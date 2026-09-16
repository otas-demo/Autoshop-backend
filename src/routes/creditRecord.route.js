import express from "express";
import {
  createCreditPayment,
  getCreditRecordsByOrderId,
  getAllCreditRecords,
  getCreditRecordById,
  getCreditRecordsByCreditPersonId,
  hardDeleteCreditRecord,
} from "../controllers/creditRecord.controller.js";
import {
  protect,
  permissionGranted,
  checkModulePermission,
} from "../controllers/administrationPolicy.controller.js";

const router = express.Router();

// Create credit payment for an order
router.post(
  "/credit-record",
  protect,
  checkModulePermission("credits"),
  createCreditPayment
);

// Get all credit records (with optional filtering)
router.get(
  "/credit-record",
  protect,
  checkModulePermission("credits"),
  getAllCreditRecords
);

// Get credit record by ID
router.get(
  "/credit-record/:id",
  protect,
  checkModulePermission("credits"),
  getCreditRecordById
);

// Get all credit records for a specific order
router.get(
  "/order/:orderId/credit-records",
  protect,
  checkModulePermission("credits"),
  getCreditRecordsByOrderId
);

// Get all credit records for a specific credit person
router.get(
  "/credit-persona/:creditPersonId/credit-records",
  protect,
  checkModulePermission("credits"),
  getCreditRecordsByCreditPersonId
);

// Hard delete credit record (owner only)
router.delete(
  "/credit-record/:id",
  protect,
  permissionGranted("owner"),
  hardDeleteCreditRecord
);

export default router;
