import express from "express";
import {
  createExpense,
  getExpenseById,
  getExpenses,
  getExpenseCategories,
  updateExpense,
  softDeleteExpense,
  restoreExpense,
  deleteExpense,
} from "../controllers/expense.controller.js";
import {
  protect,
  permissionGranted,
} from "../controllers/administrationPolicy.controller.js";

const router = express.Router();

router.post(
  "/expense",
  protect,
  permissionGranted("cashier", "admin", "owner", "warehouse"),
  createExpense
);
router.get(
  "/expense",
  protect,
  permissionGranted("cashier", "admin", "owner", "warehouse"),
  getExpenses
);
router.get(
  "/expense/categories",
  protect,
  permissionGranted("cashier", "admin", "owner", "warehouse"),
  getExpenseCategories
);
router.get(
  "/expense/:id",
  protect,
  permissionGranted("cashier", "admin", "owner", "warehouse"),
  getExpenseById
);
router.patch(
  "/expense/:id",
  protect,
  permissionGranted("owner", "warehouse"),
  updateExpense
);
router.patch(
  "/expense/:id/soft-delete",
  protect,
  permissionGranted("owner", "warehouse"),
  softDeleteExpense
);
router.patch(
  "/expense/:id/restore",
  protect,
  permissionGranted("owner", "warehouse"),
  restoreExpense
);
router.delete(
  "/expense/:id",
  protect,
  permissionGranted("owner", "warehouse"),
  deleteExpense
);
export default router;
