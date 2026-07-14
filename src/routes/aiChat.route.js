import express from "express";
import { askSaleReportAI } from "../controllers/aiChat.controller.js";
import { protect } from "../controllers/administrationPolicy.controller.js";
import { permissionGranted } from "../controllers/administrationPolicy.controller.js";
import aiChatRateLimiter from "../middlewares/aiChatRateLimiter.middleware.js";

const router = express.Router();

router.post(
  "/sale-report/ai-chat",
  protect,
  permissionGranted("owner", "admin", "cashier"),
  aiChatRateLimiter,
  askSaleReportAI
);

export default router;
