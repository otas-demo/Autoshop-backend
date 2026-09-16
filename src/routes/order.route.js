import express from "express";
import {
  createOrder,
  getOrders,
  getOrdersByStorefrontId,
  getAllOrders,
  updateOrderCreditPersonId,
  updateOrderPaidAmount,
  addOrderItems,
  removeOrderItems,
  hardDeleteOrder,
  updateEntireOrder,
} from "../controllers/order.controller.js";
import {
  protect,
  permissionGranted,
  checkModulePermission,
} from "../controllers/administrationPolicy.controller.js";

const router = express.Router();

// Create new order
router.post(
  "/order",
  protect,
  checkModulePermission("sales"),
  createOrder
);
router.get(
  "/order",
  protect,
  checkModulePermission("sales"),
  getAllOrders
);
router.get(
  "/order/:orderId",
  protect,
  checkModulePermission("sales"),
  getOrders
);
router.patch(
  "/order/:orderId",
  protect,
  checkModulePermission("sales"),
  updateEntireOrder
);
router.get(
  "/order/storefront/:storefrontId",
  protect,
  checkModulePermission("sales"),
  getOrdersByStorefrontId
);

// Update/add credit person ID to an order
router.patch(
  "/order/:orderId/credit-person",
  protect,
  checkModulePermission("sales"),
  updateOrderCreditPersonId
);

// Update order paid amount
router.patch(
  "/order/:orderId/paid-amount",
  protect,
  checkModulePermission("sales"),
  updateOrderPaidAmount
);

// Add order items to existing order
router.patch(
  "/order/:orderId/items/add",
  protect,
  checkModulePermission("sales"),
  addOrderItems
);

// Remove order items from existing order
router.patch(
  "/order/:orderId/items/remove",
  protect,
  checkModulePermission("sales"),
  removeOrderItems
);

// Hard delete order (restricted to owner)
router.delete(
  "/order/:orderId",
  protect,
  permissionGranted("owner"),
  hardDeleteOrder
);

export default router;
