import express from "express";
import {
  createWarehouseStock,
  getAllWarehouseStock,
  getWarehouseStockById,
  updateWarehouseStockQuantity,
  getExpiringWarehouseStock,
} from "../controllers/warehouse.controller.js";
import {
  protect,
  checkModulePermission,
} from "../controllers/administrationPolicy.controller.js";

const router = express.Router();

// Create new warehouse stock record
router.post(
  "/warehouse",
  protect,
  checkModulePermission("warehouse"),
  createWarehouseStock
);

// Get all warehouse stock
router.get(
  "/warehouse",
  protect,
  checkModulePermission("warehouse"),
  getAllWarehouseStock
);

// Get expiring stock for specific warehouse
router.get(
  "/warehouse/:warehouseId/expiring-stock",
  protect,
  checkModulePermission("warehouse"),
  getExpiringWarehouseStock
);

// Get warehouse stock by ID
router.get(
  "/warehouse/:id",
  protect,
  checkModulePermission("warehouse"),
  getWarehouseStockById
);

// Update warehouse stock quantity
router.patch(
  "/warehouse/:id/quantity",
  protect,
  checkModulePermission("warehouse"),
  updateWarehouseStockQuantity
);

export default router;
