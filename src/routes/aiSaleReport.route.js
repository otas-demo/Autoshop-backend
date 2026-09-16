import express from "express";
import {
  getSummary,
  getPaymentMethods,
  getCreditSales,
  getTopProducts,
  getCreditPersonaProducts,
  getProductsByCreditPerson,
} from "../controllers/aiSaleReport.controller.js";
import {
  protect,
  checkModulePermission,
} from "../controllers/administrationPolicy.controller.js";

const router = express.Router();

router.get(
  "/ai-sale-report/summary",
  protect,
  checkModulePermission("reports"),
  getSummary
);

router.get(
  "/ai-sale-report/payment-methods",
  protect,
  checkModulePermission("reports"),
  getPaymentMethods
);

router.get(
  "/ai-sale-report/credit-sales",
  protect,
  checkModulePermission("reports"),
  getCreditSales
);

router.get(
  "/ai-sale-report/products/top",
  protect,
  checkModulePermission("reports"),
  getTopProducts
);

router.get(
  "/ai-sale-report/credit-persona-products",
  protect,
  checkModulePermission("reports"),
  getCreditPersonaProducts
);

router.get(
  "/ai-sale-report/products-by-credit-person",
  protect,
  checkModulePermission("reports"),
  getProductsByCreditPerson
);

export default router;
