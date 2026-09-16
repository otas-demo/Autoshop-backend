import mongoose from "mongoose";
import StorefrontInventory from "../models/storefrontInventory.model.js";
import CustomError from "../utils/customError.js";

/**
 * Deducts stock from storefront inventory using First-In-First-Out (FIFO) across batches.
 * Throws CustomError(400) if available stock is less than requested quantity.
 *
 * @param {Object} params
 * @param {mongoose.Types.ObjectId | string} params.storefrontId - Storefront location ID
 * @param {mongoose.Types.ObjectId | string} params.inventoryId - Inventory product ID
 * @param {number} params.quantity - Quantity to deduct
 * @param {mongoose.ClientSession} params.session - Mongoose transaction session
 * @param {string} [params.productLabel] - Product code/name for user-friendly error messages
 * @returns {Promise<{ totalDeducted: number, batchesAffected: number }>}
 */
export const deductStorefrontStockFIFO = async ({
  storefrontId,
  inventoryId,
  quantity,
  session,
  productLabel = "",
}) => {
  if (quantity <= 0) {
    return { totalDeducted: 0, batchesAffected: 0 };
  }

  const sId = new mongoose.Types.ObjectId(storefrontId);
  const iId = new mongoose.Types.ObjectId(inventoryId);

  // Fetch active batch records with available quantity, oldest first (FIFO)
  const stockRecords = await StorefrontInventory.find(
    {
      inventoryId: iId,
      storefrontId: sId,
      quantity: { $gt: 0 },
    },
    null,
    { session, sort: { createdAt: 1 } }
  );

  const totalAvailable = (stockRecords || []).reduce(
    (sum, r) => sum + (r.quantity || 0),
    0
  );

  if (totalAvailable < quantity) {
    const label = productLabel ? `'${productLabel}'` : "requested item";
    throw new CustomError(
      400,
      `Insufficient stock for product ${label}. Available: ${totalAvailable}, Requested: ${quantity}`
    );
  }

  let remaining = quantity;
  let batchesAffected = 0;

  for (const record of stockRecords) {
    if (remaining <= 0) break;
    const batchQty = record.quantity || 0;
    if (batchQty <= 0) continue;

    const deduct = Math.min(batchQty, remaining);
    record.quantity -= deduct;
    record.lastUpdated = new Date();
    await record.save({ session });

    remaining -= deduct;
    batchesAffected += 1;
  }

  return { totalDeducted: quantity, batchesAffected };
};

/**
 * Restores stock back to storefront inventory (e.g. upon order cancellation, item removal, or quantity reduction).
 * Adds to the latest existing batch, or creates a new inventory record if none exists.
 *
 * @param {Object} params
 * @param {mongoose.Types.ObjectId | string} params.storefrontId - Storefront location ID
 * @param {mongoose.Types.ObjectId | string} params.inventoryId - Inventory product ID
 * @param {number} params.quantity - Quantity to restore
 * @param {mongoose.ClientSession} params.session - Mongoose transaction session
 * @returns {Promise<{ totalRestored: number }>}
 */
export const restoreStorefrontStock = async ({
  storefrontId,
  inventoryId,
  quantity,
  session,
}) => {
  if (quantity <= 0) {
    return { totalRestored: 0 };
  }

  const sId = new mongoose.Types.ObjectId(storefrontId);
  const iId = new mongoose.Types.ObjectId(inventoryId);

  // Find the latest record to add stock back to
  const stockRecord = await StorefrontInventory.findOne(
    {
      inventoryId: iId,
      storefrontId: sId,
    },
    null,
    { session, sort: { createdAt: -1 } }
  );

  if (stockRecord) {
    stockRecord.quantity += quantity;
    stockRecord.lastUpdated = new Date();
    await stockRecord.save({ session });
  } else {
    await StorefrontInventory.create(
      [
        {
          inventoryId: iId,
          storefrontId: sId,
          quantity,
          lastUpdated: new Date(),
        },
      ],
      { session }
    );
  }

  return { totalRestored: quantity };
};

/**
 * Gets total available stock for an inventory item across all batches in a storefront.
 *
 * @param {Object} params
 * @param {mongoose.Types.ObjectId | string} params.storefrontId
 * @param {mongoose.Types.ObjectId | string} params.inventoryId
 * @param {mongoose.ClientSession} [params.session]
 * @returns {Promise<number>} Total available quantity
 */
export const getAvailableStorefrontStock = async ({
  storefrontId,
  inventoryId,
  session = null,
}) => {
  const stockRecords = await StorefrontInventory.find(
    {
      inventoryId: new mongoose.Types.ObjectId(inventoryId),
      storefrontId: new mongoose.Types.ObjectId(storefrontId),
      quantity: { $gt: 0 },
    },
    null,
    session ? { session } : {}
  );

  return (stockRecords || []).reduce(
    (sum, r) => sum + (r.quantity || 0),
    0
  );
};

export default {
  deductStorefrontStockFIFO,
  restoreStorefrontStock,
  getAvailableStorefrontStock,
};
