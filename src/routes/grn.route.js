import express from "express";
import {
  createGRN,
  getAllGRN,
  getGRNById,
  updateGRNStatus,
  updateGRNLineItems,
} from "../controllers/grn.controller.js";

import {
  protect,
  checkModulePermission,
} from "../controllers/administrationPolicy.controller.js";

const router = express.Router();

// Create new GRN
router.post(
  "/grn",
  protect,
  checkModulePermission("warehouse", "purchasing"),
  createGRN
);

// Get all GRNs
router.get(
  "/grn",
  protect,
  checkModulePermission("warehouse", "purchasing"),
  getAllGRN
);

// Get GRN by ID
router.get(
  "/grn/:id",
  protect,
  checkModulePermission("warehouse", "purchasing"),
  getGRNById
);

// Update GRN status
router.patch(
  "/grn/:id/status",
  protect,
  checkModulePermission("warehouse", "purchasing"),
  updateGRNStatus
);

// Update GRN line items
router.patch(
  "/grn/:id/line-items",
  protect,
  checkModulePermission("warehouse", "purchasing"),
  updateGRNLineItems
);

export default router;
