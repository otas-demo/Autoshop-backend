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
  permissionGranted("owner", "admin", "cashier", "warehouse"),
  createPurchase
);
router.put(
  "/purchase/:id",
  protect,
  permissionGranted("owner", "admin", "cashier", "warehouse"),
  updatePurchase
);
router.patch(
  "/purchase/:id",
  protect,
  permissionGranted("owner", "admin", "cashier", "warehouse"),
  updatePurchase
);
router.get(
  "/purchase",
  protect,
  permissionGranted("owner", "admin", "cashier", "warehouse"),
  getAllPurchases
);
router.get(
  "/purchase/report",
  protect,
  permissionGranted("owner", "admin", "cashier", "warehouse"),
  getPurchaseReport
);
router.get(
  "/purchase/:id",
  protect,
  permissionGranted("owner", "admin", "cashier", "warehouse"),
  getPurchaseById
);
router.patch(
  "/purchase/:id/status",
  protect,
  permissionGranted("owner", "admin", "cashier", "warehouse"),
  updatePurchaseStatus
);
router.post(
  "/purchase/:id/payments",
  protect,
  permissionGranted("owner", "admin", "cashier", "warehouse"),
  recordPurchasePayment
);
router.get(
  "/purchase/:id/payments",
  protect,
  permissionGranted("owner", "admin", "cashier", "warehouse"),
  getPurchasePayments
);
router.patch(
  "/purchase/:id/due-date",
  protect,
  permissionGranted("owner", "admin", "cashier", "warehouse"),
  updatePurchaseDueDate
);
router.patch(
  "/purchase/:id/soft-delete",
  protect,
  permissionGranted("owner", "admin", "cashier", "warehouse"),
  softDeletePurchase
);
router.patch(
  "/purchase/:id/restore",
  protect,
  permissionGranted("owner", "admin", "cashier", "warehouse"),
  restorePurchase
);
export default router;
