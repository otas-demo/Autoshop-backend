import express from "express";
import {
  createStorefrontInventory,
  getAllStorefrontInventory,
  getStorefrontInventoryById,
  updateStorefrontInventoryQuantity,
  getExpiringStorefrontInventory,
} from "../controllers/storefrontInventory.controller.js";
import { protect } from "../controllers/administrationPolicy.controller.js";
import { permissionGranted } from "../controllers/administrationPolicy.controller.js";
const router = express.Router();

// Create new storefront inventory
router.post(
  "/storefront-inventory",
  protect,
  permissionGranted("owner", "admin"),
  createStorefrontInventory
);

// Get all storefront inventory (with filtering, pagination, sorting)
router.get(
  "/storefront-inventory",
  protect,
  permissionGranted("owner", "admin", "cashier"),
  getAllStorefrontInventory
);

// Get expiring stock for storefront
router.get(
  "/storefront-inventory/:storefrontId/expiring-stock",
  protect,
  permissionGranted("owner", "admin", "cashier"),
  getExpiringStorefrontInventory
);

// Get storefront inventory by ID
router.get(
  "/storefront-inventory/:id",
  protect,
  permissionGranted("owner", "admin", "cashier"),
  getStorefrontInventoryById
);

// Update storefront inventory quantity
router.patch(
  "/storefront-inventory/:id/quantity",
  protect,
  permissionGranted("owner"),
  updateStorefrontInventoryQuantity
);

export default router;
