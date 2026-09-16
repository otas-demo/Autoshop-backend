import { Router } from "express";
import {
  getAllStockAuditLogs,
  getStockAuditLogById,
} from "../controllers/stockAuditLog.controller.js";
import {
  protect,
  checkModulePermission,
} from "../controllers/administrationPolicy.controller.js";

const router = Router();

router.get(
  "/stock-audit-logs",
  protect,
  checkModulePermission("warehouse", "inventory"),
  getAllStockAuditLogs
);
router.get(
  "/stock-audit-logs/:id",
  protect,
  checkModulePermission("warehouse", "inventory"),
  getStockAuditLogById
);

export default router;
