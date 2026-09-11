import express from "express";
import {
  getSummary,
  getPaymentMethods,
  getCreditSales,
  getTopProducts,
  getCreditPersonaProducts,
  getProductsByCreditPerson,
} from "../controllers/aiSaleReport.controller.js";
import { protect } from "../controllers/administrationPolicy.controller.js";
import { permissionGranted } from "../controllers/administrationPolicy.controller.js";

const router = express.Router();

router.get(
  "/ai-sale-report/summary",
  protect,
  permissionGranted("owner", "admin", "cashier", "warehouse"),
  getSummary
);

router.get(
  "/ai-sale-report/payment-methods",
  protect,
  permissionGranted("owner", "admin", "cashier", "warehouse"),
  getPaymentMethods
);

router.get(
  "/ai-sale-report/credit-sales",
  protect,
  permissionGranted("owner", "admin", "cashier", "warehouse"),
  getCreditSales
);

router.get(
  "/ai-sale-report/products/top",
  protect,
  permissionGranted("owner", "admin", "cashier", "warehouse"),
  getTopProducts
);

router.get(
  "/ai-sale-report/credit-persona-products",
  protect,
  permissionGranted("owner", "admin", "cashier", "warehouse"),
  getCreditPersonaProducts
);

router.get(
  "/ai-sale-report/products-by-credit-person",
  protect,
  permissionGranted("owner", "admin", "cashier", "warehouse"),
  getProductsByCreditPerson
);

export default router;
