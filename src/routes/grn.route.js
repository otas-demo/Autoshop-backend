import express from "express";
import {
  createGRN,
  getAllGRN,
  getGRNById,
  updateGRNStatus,
  updateGRNLineItems,
} from "../controllers/grn.controller.js";

import { protect } from "../controllers/administrationPolicy.controller.js";
import { permissionGranted } from "../controllers/administrationPolicy.controller.js";

const router = express.Router();

// Create new GRN
router.post(
  "/grn",
  protect,
  permissionGranted("owner", "admin", "warehouse"),
  createGRN
);

// Get all GRNs
router.get(
  "/grn",
  protect,
  permissionGranted("owner", "admin", "warehouse"),
  getAllGRN
);

// Get GRN by ID
router.get(
  "/grn/:id",
  protect,
  permissionGranted("owner", "admin", "warehouse"),
  getGRNById
);

// Update GRN status
router.patch(
  "/grn/:id/status",
  protect,
  permissionGranted("owner", "admin", "warehouse"),
  updateGRNStatus
);

// Update GRN line items
router.patch(
  "/grn/:id/line-items",
  protect,
  permissionGranted("owner", "admin", "warehouse"),
  updateGRNLineItems
);

export default router;
