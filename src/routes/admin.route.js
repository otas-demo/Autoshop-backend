import express from "express";
import {
  signup,
  login,
  updatePassword,
  userSoftDelete,
  getAllAccounts,
  getAccountById,
  updateUser,
  userRestore,
  userDelete,
} from "../controllers/admin.controller.js";
import {
  protect,
  permissionGranted,
  checkModulePermission,
} from "../controllers/administrationPolicy.controller.js";

const router = express.Router();

router.post(
  "/admin/signup",
  protect,
  checkModulePermission("accounts"),
  signup
);
router.post("/admin/login", login);
router.get(
  "/admin",
  protect,
  checkModulePermission("accounts"),
  getAllAccounts
);
router.get(
  "/admin/:accountId",
  protect,
  checkModulePermission("accounts"),
  getAccountById
);
router.patch(
  "/admin/:accountId",
  protect,
  checkModulePermission("accounts"),
  updateUser
);
router.patch(
  "/admin/update-password/:accountId",
  protect,
  permissionGranted("owner"),
  updatePassword
);
router.patch(
  "/admin/soft-delete/:accountId",
  protect,
  permissionGranted("owner"),
  userSoftDelete
);
router.patch(
  "/admin/restore/:accountId",
  protect,
  permissionGranted("owner"),
  userRestore
);
router.delete(
  "/admin/:accountId",
  protect,
  permissionGranted("owner"),
  userDelete
);

export default router;
