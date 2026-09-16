import mongoose from "mongoose";
import Purchasing from "../models/purchasing.model.js";
import PurchasePaymentRecord from "../models/purchasePaymentRecord.model.js";
import { asyncErrorHandler } from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";
import Inventory from "../models/inventory.model.js";
import WarehouseStock from "../models/warehouse.model.js";
import { createDateFilter } from "../utils/dateFilter.utils.js";
import {
  getPaginationParams,
  buildPaginationMeta,
} from "../utils/pagination.utils.js";

export const createPurchase = asyncErrorHandler(async (req, res, next) => {
  const {
    supplierId,
    products,
    note,
    totalAmount,
    paymentType = "paid",
    paidAmount = 0,
    dueDate,
    paymentMethod = "cash",
  } = req.body;
  const purchasedBy = req.user._id;

  if (!supplierId || !products || products.length === 0) {
    return next(new CustomError(400, "Supplier ID and products are required"));
  }

  // Fetch product details for each product in the purchase
  const productsWithDetails = await Promise.all(
    products.map(async (item) => {
      if (!item.inventoryId || !item.purchaseQuantity) {
        throw new CustomError(
          400,
          `Product must have inventoryId and purchaseQuantity`
        );
      }

      const inventoryItem = await Inventory.findById(item.inventoryId);

      if (!inventoryItem) {
        throw new CustomError(
          404,
          `Product with ID ${item.inventoryId} not found`
        );
      }

      return {
        inventoryId: inventoryItem._id,
        productName: inventoryItem.productName,
        productCode: inventoryItem.productCode,
        buyingPrice: inventoryItem.buyingPrice,
        purchaseQuantity: item.purchaseQuantity,
      };
    })
  );

  // Validate and determine payment fields
  let initialPaidAmount = 0;
  let paymentStatus = "paid";
  let parsedDueDate = null;

  if (paymentType === "credit") {
    initialPaidAmount = Math.max(0, Number(paidAmount) || 0);
    if (initialPaidAmount > totalAmount) {
      return next(
        new CustomError(
          400,
          `Initial paid amount (${initialPaidAmount}) cannot exceed total purchase amount (${totalAmount})`
        )
      );
    }

    if (initialPaidAmount >= totalAmount) {
      paymentStatus = "paid";
    } else if (initialPaidAmount > 0) {
      paymentStatus = "partially_paid";
    } else {
      paymentStatus = "unpaid";
    }

    if (dueDate) {
      parsedDueDate = new Date(dueDate);
      if (isNaN(parsedDueDate.getTime())) {
        return next(new CustomError(400, "Invalid due date format"));
      }
    }
  } else {
    // Standard paid in full
    initialPaidAmount = totalAmount;
    paymentStatus = "paid";
    parsedDueDate = null;
  }

  // Generate PO number
  const poNumber = await Purchasing.generatePONumber();

  const purchase = await Purchasing.create({
    poNumber,
    supplierId,
    products: productsWithDetails,
    note: note || "No note available",
    totalAmount,
    paymentType: paymentType === "credit" ? "credit" : "paid",
    paidAmount: initialPaidAmount,
    paymentStatus,
    dueDate: parsedDueDate,
    status: "pending",
    purchasedBy,
  });

  // If initial payment was made, create initial PurchasePaymentRecord
  if (initialPaidAmount > 0) {
    try {
      await PurchasePaymentRecord.create({
        purchaseId: purchase._id,
        supplierId,
        paidAmount: initialPaidAmount,
        paymentDate: new Date(),
        paymentMethod: paymentMethod || "cash",
        notes:
          paymentType === "credit"
            ? "Initial down payment upon purchase order creation"
            : "Full payment upon purchase order creation",
        recordedBy: purchasedBy,
      });
    } catch (err) {
      console.error("Failed to create initial PurchasePaymentRecord:", err);
    }
  }

  res.status(201).json({
    success: true,
    message: "Purchase created successfully",
    data: purchase,
  });
});

export const updatePurchase = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const {
    supplierId,
    products,
    note,
    totalAmount,
    paymentType,
    paidAmount,
    dueDate,
    paymentMethod,
  } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid purchase order ID format"));
  }

  const purchase = await Purchasing.findOne({ _id: id, isDeleted: false });
  if (!purchase) {
    return next(new CustomError(404, "Purchase order not found"));
  }

  if (purchase.status !== "pending") {
    return next(
      new CustomError(
        400,
        `Cannot edit a purchase order with status '${purchase.status}' (only 'pending' orders can be edited)`
      )
    );
  }

  if (supplierId) {
    purchase.supplierId = supplierId;
  }

  if (products && products.length > 0) {
    const productsWithDetails = await Promise.all(
      products.map(async (item) => {
        if (!item.inventoryId || !item.purchaseQuantity) {
          throw new CustomError(
            400,
            `Product must have inventoryId and purchaseQuantity`
          );
        }

        const inventoryItem = await Inventory.findById(item.inventoryId);
        if (!inventoryItem) {
          throw new CustomError(
            404,
            `Product with ID ${item.inventoryId} not found`
          );
        }

        const existingProduct = purchase.products.find(
          (p) => p.inventoryId.toString() === item.inventoryId.toString()
        );
        const receivedQuantity = existingProduct
          ? existingProduct.receivedQuantity || 0
          : 0;

        if (item.purchaseQuantity < receivedQuantity) {
          throw new CustomError(
            400,
            `Purchase quantity for ${inventoryItem.productName} cannot be less than already received quantity (${receivedQuantity})`
          );
        }

        return {
          inventoryId: inventoryItem._id,
          productName: inventoryItem.productName,
          productCode: inventoryItem.productCode,
          buyingPrice: inventoryItem.buyingPrice,
          purchaseQuantity: item.purchaseQuantity,
          receivedQuantity,
        };
      })
    );

    purchase.products = productsWithDetails;
  }

  if (note !== undefined) {
    purchase.note = note || "No note available";
  }

  if (totalAmount !== undefined) {
    purchase.totalAmount = totalAmount;
  } else if (products && products.length > 0) {
    purchase.totalAmount = purchase.products.reduce(
      (sum, p) => sum + p.buyingPrice * p.purchaseQuantity,
      0
    );
  }

  if (paymentType !== undefined) {
    purchase.paymentType = paymentType;
  }

  if (purchase.paymentType === "paid") {
    purchase.paidAmount = purchase.totalAmount;
    purchase.paymentStatus = "paid";
    purchase.dueDate = null;
  } else {
    // credit
    if (paidAmount !== undefined) {
      purchase.paidAmount = Math.max(0, Number(paidAmount) || 0);
    }
    if (purchase.paidAmount >= purchase.totalAmount) {
      purchase.paymentStatus = "paid";
    } else if (purchase.paidAmount > 0) {
      purchase.paymentStatus = "partially_paid";
    } else {
      purchase.paymentStatus = "unpaid";
    }

    if (dueDate !== undefined) {
      if (dueDate) {
        const parsedDate = new Date(dueDate);
        if (isNaN(parsedDate.getTime())) {
          return next(new CustomError(400, "Invalid due date format"));
        }
        purchase.dueDate = parsedDate;
      } else {
        purchase.dueDate = null;
      }
    }
  }

  await purchase.save();

  // Synchronize PurchasePaymentRecord when purchase paidAmount or payment details are updated
  try {
    const existingRecords = await PurchasePaymentRecord.find({
      purchaseId: purchase._id,
      isDeleted: false,
    }).sort({ createdAt: 1 });

    const validPaymentMethod = [
      "cash",
      "kpay",
      "wave",
      "bank_transfer",
      "other",
    ].includes(paymentMethod)
      ? paymentMethod
      : "cash";

    const recordedBy = req.user?._id || purchase.purchasedBy;

    if (existingRecords.length <= 1) {
      if (existingRecords.length === 1) {
        if (purchase.paidAmount === 0) {
          existingRecords[0].isDeleted = true;
          existingRecords[0].deletedAt = new Date();
          await existingRecords[0].save();
        } else {
          existingRecords[0].paidAmount = purchase.paidAmount;
          if (paymentMethod) {
            existingRecords[0].paymentMethod = validPaymentMethod;
          }
          existingRecords[0].supplierId = purchase.supplierId;
          existingRecords[0].recordedBy = recordedBy;
          existingRecords[0].paymentDate = new Date();
          existingRecords[0].notes =
            purchase.paymentType === "credit"
              ? "Initial down payment upon purchase order (Edited)"
              : "Full payment upon purchase order (Edited)";
          await existingRecords[0].save();
        }
      } else if (purchase.paidAmount > 0) {
        await PurchasePaymentRecord.create({
          purchaseId: purchase._id,
          supplierId: purchase.supplierId,
          paidAmount: purchase.paidAmount,
          paymentDate: new Date(),
          paymentMethod: validPaymentMethod,
          notes:
            purchase.paymentType === "credit"
              ? "Initial down payment upon purchase order (Edited)"
              : "Full payment upon purchase order (Edited)",
          recordedBy,
        });
      }
    } else {
      const existingPaidSum = existingRecords.reduce(
        (sum, r) => sum + r.paidAmount,
        0
      );
      const diff = purchase.paidAmount - existingPaidSum;

      if (diff > 0) {
        await PurchasePaymentRecord.create({
          purchaseId: purchase._id,
          supplierId: purchase.supplierId,
          paidAmount: diff,
          paymentDate: new Date(),
          paymentMethod: validPaymentMethod,
          notes: "Adjustment upon purchase order edit",
          recordedBy,
        });
      } else if (diff < 0) {
        let remainingToDeduct = Math.abs(diff);
        for (let i = existingRecords.length - 1; i >= 0; i--) {
          const rec = existingRecords[i];
          if (rec.paidAmount <= remainingToDeduct) {
            remainingToDeduct -= rec.paidAmount;
            rec.isDeleted = true;
            rec.deletedAt = new Date();
            await rec.save();
          } else {
            rec.paidAmount -= remainingToDeduct;
            rec.notes = `${rec.notes || "Payment"} (Adjusted upon edit)`;
            await rec.save();
            remainingToDeduct = 0;
            break;
          }
        }
      }
    }
  } catch (err) {
    console.error("Failed to sync PurchasePaymentRecord on purchase update:", err);
  }

  const populatedPurchase = await Purchasing.findById(purchase._id)
    .populate("purchasedBy", "name role")
    .populate("supplierId", "supplierName supplierCode contactNumber");

  res.status(200).json({
    success: true,
    message: "Purchase order updated successfully",
    data: populatedPurchase,
  });
});

export const getAllPurchases = asyncErrorHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    isDeleted,
    status,
    supplierId,
    paymentType,
    paymentStatus,
  } = req.query;

  // Build query
  const query = {};

  if (supplierId) {
    if (mongoose.Types.ObjectId.isValid(supplierId)) {
      query.supplierId = new mongoose.Types.ObjectId(supplierId);
    } else {
      query.supplierId = supplierId;
    }
  }

  // Filter by paymentType if provided
  if (paymentType) {
    query.paymentType = paymentType;
  }

  // Filter by paymentStatus if provided
  if (paymentStatus) {
    if (paymentStatus === "overdue") {
      query.paymentStatus = { $ne: "paid" };
      query.dueDate = { $lt: new Date() };
    } else if (paymentStatus === "unpaid") {
      query.paymentStatus = { $in: ["unpaid", "partially_paid"] };
    } else {
      query.paymentStatus = paymentStatus;
    }
  }

  // Filter by isDeleted status if provided
  // Supports: ?isDeleted=true, ?isDeleted=false, or omit to default to false
  if (isDeleted !== undefined) {
    // Convert string "true"/"false" to boolean
    if (isDeleted === "true" || isDeleted === true) {
      query.isDeleted = true;
    } else if (isDeleted === "false" || isDeleted === false) {
      query.isDeleted = false;
    } else {
      return next(
        new CustomError(
          400,
          "Invalid isDeleted value. Must be 'true' or 'false'."
        )
      );
    }
  } else {
    // Default: exclude deleted purchases if isDeleted is not specified
    query.isDeleted = false;
  }

  // Filter by status if provided
  if (status !== undefined) {
    const validStatuses = [
      "pending",
      "confirmed",
      "arrived",
      "cancelled",
      "completed",
    ];
    if (!validStatuses.includes(status)) {
      return next(
        new CustomError(
          400,
          `Invalid status. Allowed values: ${validStatuses.join(", ")}`
        )
      );
    }
    query.status = status;
  }

  // Add date range filter using dateFilter utility
  // Filter by the 'createdAt' field (when the purchase was created)
  try {
    const dateFilter = createDateFilter(req.query, "createdAt", false);
    Object.assign(query, dateFilter);
  } catch (error) {
    // If it's a CustomError, pass it to error handler
    if (error instanceof CustomError) {
      return next(error);
    }
    // For other errors, wrap and pass
    return next(new CustomError(400, error.message || "Invalid date filter"));
  }

  // Pagination
  const { page: pageNum, limit: limitNum, skip } = getPaginationParams(req.query, 10);

  // Sort
  const sort = {};
  sort[sortBy] = sortOrder === "asc" ? 1 : -1;

  // Execute query with population
  const purchases = await Purchasing.find(query)
    .populate("purchasedBy", "name role")
    .populate("supplierId", "supplierName supplierCode contactNumber")
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  // Calculate totalRemainingQuantity for each purchase
  // Convert to plain objects and add totalRemainingQuantity field
  const purchasesWithTotalRemaining = purchases.map((purchase) => {
    const purchaseObj = purchase.toObject({ virtuals: true });

    // Calculate totalRemainingQuantity by summing all products' remainingQuantity
    // Use virtual field if available, otherwise calculate manually
    const totalRemainingQuantity = purchase.products.reduce(
      (total, product) => {
        // Try to use virtual field first, fallback to manual calculation
        const remainingQty =
          product.remainingQuantity !== undefined
            ? product.remainingQuantity
            : (product.purchaseQuantity || 0) - (product.receivedQuantity || 0);
        return total + Math.max(0, remainingQty); // Ensure non-negative
      },
      0
    );

    // Add totalRemainingQuantity after products section
    return {
      ...purchaseObj,
      totalRemainingQuantity,
    };
  });

  // Get total count for pagination
  const total = await Purchasing.countDocuments(query);
  const pagination = buildPaginationMeta(total, pageNum, limitNum);

  res.status(200).json({
    success: true,
    message: "All purchases retrieved successfully",
    data: purchasesWithTotalRemaining,
    pagination,
  });
});

export const getPurchaseById = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  // Exclude deleted purchases by default
  const includeDeleted = req.query.includeDeleted === "true";
  const query = includeDeleted ? { _id: id } : { _id: id, isDeleted: false };

  const purchase = await Purchasing.findOne(query)
    .populate("purchasedBy", "name role")
    .populate("supplierId", "supplierName supplierCode contactNumber");

  if (!purchase) {
    return next(new CustomError(404, "Purchase not found"));
  }

  res.status(200).json({
    success: true,
    message: "Purchase retrieved successfully",
    data: purchase,
  });
});

export const updatePurchaseStatus = asyncErrorHandler(
  async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new CustomError(400, "Invalid purchase order ID format"));
    }

    if (!status) {
      return next(new CustomError(400, "Status is required"));
    }

    const validStatuses = ["pending", "confirmed", "arrived", "cancelled"];
    if (!validStatuses.includes(status)) {
      return next(
        new CustomError(
          400,
          `Invalid status. Allowed values: ${validStatuses.join(", ")}`
        )
      );
    }

    // First, check if the purchase exists and if it's soft-deleted
    const existingPurchase = await Purchasing.findById(id);

    if (!existingPurchase) {
      return next(new CustomError(404, "Purchase order not found"));
    }

    // Validate that the purchase is not soft-deleted
    if (existingPurchase.isDeleted === true) {
      return next(
        new CustomError(
          400,
          "Cannot update status of a soft-deleted purchase order. Please restore the purchase order first."
        )
      );
    }

    // Update the status
    const purchase = await Purchasing.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { status },
      { new: true, runValidators: true }
    );

    if (!purchase) {
      return next(new CustomError(404, "Purchase order not found"));
    }

    res.status(200).json({
      success: true,
      message: "Purchase status updated successfully",
      data: purchase,
    });
  }
);

// Record credit payment on purchase order
export const recordPurchasePayment = asyncErrorHandler(
  async (req, res, next) => {
    const { id } = req.params;
    const { paidAmount, paymentMethod = "cash", notes, paymentDate } = req.body;
    const recordedBy = req.user._id;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new CustomError(400, "Invalid purchase order ID format"));
    }

    const paymentNumber = Number(paidAmount);
    if (isNaN(paymentNumber) || paymentNumber <= 0) {
      return next(new CustomError(400, "Paid amount must be a number greater than 0"));
    }

    const session = await mongoose.startSession();
    try {
      let resultData;
      await session.withTransaction(async () => {
        const purchase = await Purchasing.findById(id).session(session);
        if (!purchase) {
          throw new CustomError(404, "Purchase order not found");
        }

        if (purchase.isDeleted) {
          throw new CustomError(
            400,
            "Cannot record payment for a deleted purchase order"
          );
        }

        if (purchase.paymentType !== "credit") {
          throw new CustomError(
            400,
            "Can only record credit payments for credit purchase orders"
          );
        }

        const currentPaid = purchase.paidAmount || 0;
        const currentRemaining = Math.max(0, purchase.totalAmount - currentPaid);

        if (currentRemaining <= 0 || purchase.paymentStatus === "paid") {
          throw new CustomError(
            400,
            "This purchase order is already fully paid"
          );
        }

        if (paymentNumber > currentRemaining) {
          throw new CustomError(
            400,
            `Payment amount (${paymentNumber.toLocaleString()}) exceeds remaining balance (${currentRemaining.toLocaleString()}). Maximum allowed payment: ${currentRemaining.toLocaleString()}`
          );
        }

        const newPaidTotal = currentPaid + paymentNumber;
        const isFullyPaid = newPaidTotal >= purchase.totalAmount;
        const newPaymentStatus = isFullyPaid ? "paid" : "partially_paid";

        purchase.paidAmount = newPaidTotal;
        purchase.paymentStatus = newPaymentStatus;
        await purchase.save({ session });

        const [paymentRecord] = await PurchasePaymentRecord.create(
          [
            {
              purchaseId: purchase._id,
              supplierId: purchase.supplierId,
              paidAmount: paymentNumber,
              paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
              paymentMethod,
              notes: notes || null,
              recordedBy,
            },
          ],
          { session }
        );

        resultData = {
          paymentRecord,
          purchase: purchase.toObject({ virtuals: true }),
        };
      });

      res.status(201).json({
        success: true,
        message: "Purchase payment recorded successfully",
        data: resultData,
      });
    } finally {
      await session.endSession();
    }
  }
);

// Get all payment logs for a purchase order
export const getPurchasePayments = asyncErrorHandler(
  async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new CustomError(400, "Invalid purchase order ID format"));
    }

    const payments = await PurchasePaymentRecord.find({
      purchaseId: id,
      isDeleted: false,
    })
      .populate("recordedBy", "name role")
      .populate("supplierId", "supplierName supplierCode")
      .sort({ paymentDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Purchase payment records retrieved successfully",
      data: payments,
    });
  }
);

// Update due date for a credit purchase order
export const updatePurchaseDueDate = asyncErrorHandler(
  async (req, res, next) => {
    const { id } = req.params;
    const { dueDate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new CustomError(400, "Invalid purchase order ID format"));
    }

    if (!dueDate) {
      return next(new CustomError(400, "Due date is required"));
    }

    const parsedDate = new Date(dueDate);
    if (isNaN(parsedDate.getTime())) {
      return next(new CustomError(400, "Invalid due date format"));
    }

    const purchase = await Purchasing.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!purchase) {
      return next(new CustomError(404, "Purchase order not found"));
    }

    purchase.dueDate = parsedDate;
    await purchase.save();

    res.status(200).json({
      success: true,
      message: "Purchase due date updated successfully",
      data: purchase,
    });
  }
);

// Soft delete purchase order
export const softDeletePurchase = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  // Validate MongoDB ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid purchase order ID format"));
  }

  // Find the purchase order
  const purchase = await Purchasing.findOne({
    _id: id,
    isDeleted: false,
  });

  if (!purchase) {
    return next(new CustomError(404, "Purchase order not found"));
  }

  // Soft delete: set isDeleted to true and deletedAt to current date
  purchase.isDeleted = true;
  purchase.deletedAt = new Date();
  await purchase.save();

  res.status(200).json({
    success: true,
    message: "Purchase order soft deleted successfully",
    data: purchase,
  });
});

export const restorePurchase = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  // Validate MongoDB ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid purchase order ID format"));
  }

  // Find the purchase order
  const purchase = await Purchasing.findOne({
    _id: id,
    isDeleted: true,
  });

  if (!purchase) {
    return next(new CustomError(404, "Purchase order not found"));
  }

  // Restore: set isDeleted to false and deletedAt to null
  purchase.isDeleted = false;
  purchase.deletedAt = null;
  await purchase.save();

  res.status(200).json({
    success: true,
    message: "Purchase order restored successfully",
    data: purchase,
  });
});

export const getPurchaseReport = asyncErrorHandler(async (req, res, next) => {
  const query = { isDeleted: false };

  if (req.query.supplierId) {
    if (mongoose.Types.ObjectId.isValid(req.query.supplierId)) {
      query.supplierId = new mongoose.Types.ObjectId(req.query.supplierId);
    } else {
      query.supplierId = req.query.supplierId;
    }
  }

  try {
    const dateFilter = createDateFilter(req.query, "createdAt", false);
    Object.assign(query, dateFilter);
  } catch (error) {
    if (error instanceof CustomError) {
      return next(error);
    }
    return next(new CustomError(400, error.message || "Invalid date filter"));
  }

  // 1. Overall stats
  const overallStats = await Purchasing.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$totalAmount" },
        count: { $sum: 1 },
        averageAmount: { $avg: "$totalAmount" },
      },
    },
  ]);

  const stats = overallStats[0] || {
    totalAmount: 0,
    count: 0,
    averageAmount: 0,
  };

  // 2. Status breakdown
  const statusBreakdown = await Purchasing.aggregate([
    { $match: query },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$totalAmount" },
      },
    },
  ]);

  // 3. Supplier breakdown
  const supplierBreakdown = await Purchasing.aggregate([
    { $match: query },
    {
      $group: {
        _id: "$supplierId",
        totalAmount: { $sum: "$totalAmount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { totalAmount: -1 } },
  ]);

  // Populate supplier names
  const populatedSupplierBreakdown = await Promise.all(
    supplierBreakdown.map(async (item) => {
      const supplier = await mongoose.model("SupplierProfile").findById(item._id).select("supplierName supplierCode");
      return {
        supplierId: item._id,
        supplierName: supplier ? supplier.supplierName : "Unknown Supplier",
        supplierCode: supplier ? supplier.supplierCode : "UNKNOWN",
        totalAmount: item.totalAmount,
        count: item.count,
      };
    })
  );

  // 4. Top purchased products
  const productBreakdown = await Purchasing.aggregate([
    { $match: query },
    { $unwind: "$products" },
    {
      $group: {
        _id: "$products.inventoryId",
        productName: { $first: "$products.productName" },
        productCode: { $first: "$products.productCode" },
        totalQuantity: { $sum: "$products.purchaseQuantity" },
        totalCost: { $sum: { $multiply: ["$products.buyingPrice", "$products.purchaseQuantity"] } },
      },
    },
    { $sort: { totalQuantity: -1 } },
  ]);

  // 5. Low quantity products (total quantity <= threshold, and status is "active")
  const threshold = parseInt(req.query.lowStockThreshold) || 50;

  const activeInventories = await Inventory.find({ status: "active" }).lean();
  const warehouseSums = await WarehouseStock.aggregate([
    { $group: { _id: "$inventoryId", qty: { $sum: "$quantity" } } }
  ]);
  const storefrontSums = await StorefrontInventory.aggregate([
    { $group: { _id: "$inventoryId", qty: { $sum: "$quantity" } } }
  ]);

  const stockMap = {};
  warehouseSums.forEach(item => {
    if (item._id) {
      stockMap[item._id.toString()] = (stockMap[item._id.toString()] || 0) + item.qty;
    }
  });
  storefrontSums.forEach(item => {
    if (item._id) {
      stockMap[item._id.toString()] = (stockMap[item._id.toString()] || 0) + item.qty;
    }
  });

  const lowQuantityProducts = activeInventories.map(inv => {
    const totalQuantity = stockMap[inv._id.toString()] || 0;
    return {
      _id: inv._id,
      productName: inv.productName,
      productCode: inv.productCode,
      reorderPoint: threshold, // Return the requested threshold so UI can show it
      totalQuantity,
      unitOfMeasure: inv.unitOfMeasure,
      buyingPrice: inv.buyingPrice,
      sellingPrice: inv.sellingPrice
    };
  }).filter(item => item.totalQuantity <= threshold)
    .sort((a, b) => a.totalQuantity - b.totalQuantity);

  // Paginate lowQuantityProducts
  const lowStockPageNum = parseInt(req.query.lowStockPage) || 1;
  const lowStockLimitNum = parseInt(req.query.lowStockLimit) || 10;
  const skip = (lowStockPageNum - 1) * lowStockLimitNum;
  const totalItems = lowQuantityProducts.length;
  const paginatedLowQuantityProducts = lowQuantityProducts.slice(skip, skip + lowStockLimitNum);

  // 6. Credit purchase stats
  const creditStatsResult = await Purchasing.aggregate([
    { $match: { ...query, paymentType: "credit" } },
    {
      $group: {
        _id: null,
        totalCreditAmount: { $sum: "$totalAmount" },
        totalPaid: { $sum: "$paidAmount" },
        count: { $sum: 1 },
      },
    },
  ]);

  const overdueCount = await Purchasing.countDocuments({
    ...query,
    paymentType: "credit",
    paymentStatus: { $ne: "paid" },
    dueDate: { $lt: new Date() },
  });

  const creditStats = creditStatsResult[0] || {
    totalCreditAmount: 0,
    totalPaid: 0,
    count: 0,
  };
  const creditSummary = {
    totalCreditAmount: creditStats.totalCreditAmount,
    totalPaid: creditStats.totalPaid,
    totalRemaining: Math.max(0, creditStats.totalCreditAmount - creditStats.totalPaid),
    creditCount: creditStats.count,
    overdueCount,
  };

  res.status(200).json({
    success: true,
    data: {
      overall: stats,
      statusBreakdown,
      supplierBreakdown: populatedSupplierBreakdown,
      productBreakdown,
      creditSummary,
      lowQuantityProducts: paginatedLowQuantityProducts,
      lowQuantityPagination: {
        currentPage: lowStockPageNum,
        totalPages: Math.ceil(totalItems / lowStockLimitNum),
        totalItems,
        itemsPerPage: lowStockLimitNum,
      },
    },
  });
});
