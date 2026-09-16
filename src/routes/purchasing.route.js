import express from "express";
import {
  createPurchase,
  updatePurchase,
  getAllPurchases,
  getPurchaseById,
  updatePurchaseStatus,
  softDeletePurchase,
  restorePurchase,
  getPurchaseReport,
  recordPurchasePayment,
  getPurchasePayments,
  updatePurchaseDueDate,
} from "../controllers/purchase.controller.js";
import {
  protect,
  checkModulePermission,
} from "../controllers/administrationPolicy.controller.js";

const router = express.Router();

router.post(
  "/purchase",
  protect,
  checkModulePermission("purchasing"),
  createPurchase
);
router.put(
  "/purchase/:id",
  protect,
  checkModulePermission("purchasing"),
  updatePurchase
);
router.patch(
  "/purchase/:id",
  protect,
  checkModulePermission("purchasing"),
  updatePurchase
);
router.get(
  "/purchase",
  protect,
  checkModulePermission("purchasing"),
  getAllPurchases
);
router.get(
  "/purchase/report",
  protect,
  checkModulePermission("purchasing"),
  getPurchaseReport
);
router.get(
  "/purchase/:id",
  protect,
  checkModulePermission("purchasing"),
  getPurchaseById
);
router.patch(
  "/purchase/:id/status",
  protect,
  checkModulePermission("purchasing"),
  updatePurchaseStatus
);
router.post(
  "/purchase/:id/payments",
  protect,
  checkModulePermission("purchasing"),
  recordPurchasePayment
);
router.get(
  "/purchase/:id/payments",
  protect,
  checkModulePermission("purchasing"),
  getPurchasePayments
);
router.patch(
  "/purchase/:id/due-date",
  protect,
  checkModulePermission("purchasing"),
  updatePurchaseDueDate
);
router.patch(
  "/purchase/:id/soft-delete",
  protect,
  checkModulePermission("purchasing"),
  softDeletePurchase
);
router.patch(
  "/purchase/:id/restore",
  protect,
  checkModulePermission("purchasing"),
  restorePurchase
);
export default router;
