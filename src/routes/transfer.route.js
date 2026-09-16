import express from "express";
import {
  createTransfer,
  getTransfers,
  getTransferById,
  updateTransferStatus,
} from "../controllers/transfer.controller.js";

import {
  protect,
  checkModulePermission,
} from "../controllers/administrationPolicy.controller.js";
const router = express.Router();

router.post(
  "/transfer",
  protect,
  checkModulePermission("warehouse", "inventory"),
  createTransfer
);
router.get(
  "/transfer",
  protect,
  checkModulePermission("warehouse", "inventory"),
  getTransfers
);
router.get(
  "/transfer/:id",
  protect,
  checkModulePermission("warehouse", "inventory"),
  getTransferById
);
router.patch(
  "/transfer/:id",
  protect,
  checkModulePermission("warehouse", "inventory"),
  updateTransferStatus
);
export default router;
