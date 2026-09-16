import express from "express";
import multer from "multer";
import {
  createInventory,
  getAllInventory,
  getInventoryById,
  updateInventory,
  importInventoryFromExcel,
  getAllCategories,
  updateBatchExpiryDate,
} from "../controllers/inventory.controller.js";
import {
  protect,
  checkModulePermission,
} from "../controllers/administrationPolicy.controller.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    if (
      allowedMimes.includes(file.mimetype) ||
      file.originalname.endsWith(".xlsx") ||
      file.originalname.endsWith(".xls") ||
      file.originalname.endsWith(".csv")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files (.xlsx, .xls, .csv) are allowed"), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// Bulk import inventory from Excel
router.post(
  "/inventory/import-excel",
  protect,
  checkModulePermission("inventory"),
  upload.single("file"),
  importInventoryFromExcel,
);

// Get all unique categories (inventory, sales POS, purchasing, warehouse)
router.get(
  "/inventory/categories",
  protect,
  checkModulePermission("inventory", "sales", "purchasing", "warehouse"),
  getAllCategories,
);

// Create new inventory item
router.post(
  "/inventory",
  protect,
  checkModulePermission("inventory"),
  createInventory,
);

// Get all inventory items (read-only: needed by inventory, purchasing for PO, sales, and warehouse)
router.get(
  "/inventory",
  protect,
  checkModulePermission("inventory", "purchasing", "sales", "warehouse"),
  getAllInventory,
);

// Get inventory item by ID (read-only)
router.get(
  "/inventory/:id",
  protect,
  checkModulePermission("inventory", "purchasing", "sales", "warehouse"),
  getInventoryById,
);

// Update inventory metadata
router.patch(
  "/inventory/:id",
  protect,
  checkModulePermission("inventory"),
  updateInventory,
);

// Update batch expiry date
router.patch(
  "/inventory/batch/expiry",
  protect,
  checkModulePermission("inventory"),
  updateBatchExpiryDate,
);

export default router;
