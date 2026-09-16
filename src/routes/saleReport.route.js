import express from "express";
import {
  getSaleReportByStorefrontId,
  getPaymentMethodReportByStorefrontId,
  getCreditSaleReportByStorefrontId,
  getProductSalesReportByStorefrontId,
  getCreditPersonaProductReport,
  getSaleProductsAnalyticsByCreditPerson,
} from "../controllers/saleReport.controller.js";
import {
  protect,
  checkModulePermission,
} from "../controllers/administrationPolicy.controller.js";

const router = express.Router();

// Sale report for storefront or all storefronts
router.get(
  "/sale-report",
  protect,
  checkModulePermission("reports"),
  getSaleReportByStorefrontId
);

// Payment method breakdown report for storefront or all storefronts (paid orders only)
router.get(
  "/sale-report/paid-orders",
  protect,
  checkModulePermission("reports"),
  getPaymentMethodReportByStorefrontId
);

// Credit sale report with credit records breakdown for storefront or all storefronts
router.get(
  "/sale-report/credit-orders",
  protect,
  checkModulePermission("reports"),
  getCreditSaleReportByStorefrontId
);

// Product/stock sales statistics report for storefront or all storefronts
router.get(
  "/sale-report/products",
  protect,
  checkModulePermission("reports"),
  getProductSalesReportByStorefrontId
);

// Credit persona product report
router.get(
  "/sale-report/credit-persona-products",
  protect,
  checkModulePermission("reports"),
  getCreditPersonaProductReport
);

// Sale products analytics by credit person
router.get(
  "/sale-report/products-by-credit-person",
  protect,
  checkModulePermission("reports"),
  getSaleProductsAnalyticsByCreditPerson
);

export default router;
