import express from "express";
import {
  createStorefrontInventory,
  getAllStorefrontInventory,
  getStorefrontInventoryById,
  updateStorefrontInventoryQuantity,
  getExpiringStorefrontInventory,
} from "../controllers/storefrontInventory.controller.js";
import {
  protect,
  checkModulePermission,
} from "../controllers/administrationPolicy.controller.js";

const router = express.Router();

// Create new storefront inventory
router.post(
  "/storefront-inventory",
  protect,
  checkModulePermission("inventory", "warehouse"),
  createStorefrontInventory
);

// Get all storefront inventory (with filtering, pagination, sorting)
router.get(
  "/storefront-inventory",
  protect,
  checkModulePermission("sales", "inventory", "warehouse"),
  getAllStorefrontInventory
);

// Get expiring stock for storefront
router.get(
  "/storefront-inventory/:storefrontId/expiring-stock",
  protect,
  checkModulePermission("sales", "inventory", "warehouse"),
  getExpiringStorefrontInventory
);

// Get storefront inventory by ID
router.get(
  "/storefront-inventory/:id",
  protect,
  checkModulePermission("sales", "inventory", "warehouse"),
  getStorefrontInventoryById
);

// Update storefront inventory quantity
router.patch(
  "/storefront-inventory/:id/quantity",
  protect,
  checkModulePermission("inventory", "warehouse"),
  updateStorefrontInventoryQuantity
);

export default router;
