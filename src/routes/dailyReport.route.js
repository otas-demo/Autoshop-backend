import express from "express";
import {
  getDailyReports,
  getLatestDailyReport,
} from "../controllers/dailyReport.controller.js";
import {
  protect,
  checkModulePermission,
} from "../controllers/administrationPolicy.controller.js";

const router = express.Router();

// Get paginated daily reports
router.get(
  "/daily-reports",
  protect,
  checkModulePermission("reports"),
  getDailyReports
);

// Get the latest daily report
router.get(
  "/daily-reports/latest",
  protect,
  checkModulePermission("reports"),
  getLatestDailyReport
);

export default router;
