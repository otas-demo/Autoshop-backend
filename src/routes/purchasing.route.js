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
  permissionGranted,
} from "../controllers/administrationPolicy.controller.js";

const router = express.Router();

router.post(
  "/purchase",
  protect,
  permissionGranted("owner", "admin", "warehouse"),
  createPurchase
);
router.put(
  "/purchase/:id",
  protect,
  permissionGranted("owner", "admin", "warehouse"),
  updatePurchase
);
router.patch(
  "/purchase/:id",
  protect,
  permissionGranted("owner", "admin", "warehouse"),
  updatePurchase
);
router.get(
  "/purchase",
  protect,
  permissionGranted("owner", "admin", "warehouse"),
  getAllPurchases
);
router.get(
  "/purchase/report",
  protect,
  permissionGranted("owner", "admin", "warehouse"),
  getPurchaseReport
);
router.get(
  "/purchase/:id",
  protect,
  permissionGranted("owner", "admin", "warehouse"),
  getPurchaseById
);
router.patch(
  "/purchase/:id/status",
  protect,
  permissionGranted("owner", "admin", "warehouse"),
  updatePurchaseStatus
);
router.post(
  "/purchase/:id/payments",
  protect,
  permissionGranted("owner", "admin", "warehouse"),
  recordPurchasePayment
);
router.get(
  "/purchase/:id/payments",
  protect,
  permissionGranted("owner", "admin", "warehouse"),
  getPurchasePayments
);
router.patch(
  "/purchase/:id/due-date",
  protect,
  permissionGranted("owner", "admin", "warehouse"),
  updatePurchaseDueDate
);
router.patch(
  "/purchase/:id/soft-delete",
  protect,
  permissionGranted("owner", "warehouse"),
  softDeletePurchase
);
router.patch(
  "/purchase/:id/restore",
  protect,
  permissionGranted("owner", "warehouse"),
  restorePurchase
);
export default router;
