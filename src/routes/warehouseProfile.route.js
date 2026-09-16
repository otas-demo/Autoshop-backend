import express from "express";
import {
  createWarehouseProfile,
  getAllWarehouseProfiles,
  getWarehouseProfileById,
  updateWarehouseProfile,
} from "../controllers/warehouseProfile.controller.js";
import {
  protect,
  checkModulePermission,
} from "../controllers/administrationPolicy.controller.js";

const router = express.Router();

// Create new warehouse profile
router.post(
  "/warehouse-profile",
  protect,
  checkModulePermission("warehouse"),
  createWarehouseProfile
);

// Get all warehouse profiles
router.get(
  "/warehouse-profile",
  protect,
  checkModulePermission("warehouse"),
  getAllWarehouseProfiles
);

// Get warehouse profile by ID
router.get(
  "/warehouse-profile/:id",
  protect,
  checkModulePermission("warehouse"),
  getWarehouseProfileById
);

// Update warehouse profile
router.patch(
  "/warehouse-profile/:id",
  protect,
  checkModulePermission("warehouse"),
  updateWarehouseProfile
);

export default router;
