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
  checkModulePermission,
} from "../controllers/administrationPolicy.controller.js";

const router = express.Router();

router.post(
  "/expense",
  protect,
  checkModulePermission("expenses"),
  createExpense
);
router.get(
  "/expense",
  protect,
  checkModulePermission("expenses"),
  getExpenses
);
router.get(
  "/expense/categories",
  protect,
  checkModulePermission("expenses"),
  getExpenseCategories
);
router.get(
  "/expense/:id",
  protect,
  checkModulePermission("expenses"),
  getExpenseById
);
router.patch(
  "/expense/:id",
  protect,
  checkModulePermission("expenses"),
  updateExpense
);
router.patch(
  "/expense/:id/soft-delete",
  protect,
  checkModulePermission("expenses"),
  softDeleteExpense
);
router.patch(
  "/expense/:id/restore",
  protect,
  checkModulePermission("expenses"),
  restoreExpense
);
router.delete(
  "/expense/:id",
  protect,
  permissionGranted("owner"),
  deleteExpense
);
export default router;
