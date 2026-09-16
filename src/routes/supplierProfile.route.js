import express from "express";
import {
  createSupplierProfile,
  getAllSupplierProfiles,
  getSupplierProfileById,
  updateSupplierProfile,
  softDeleteSupplierProfile,
  restoreSupplierProfile,
  deleteSupplierProfile,
} from "../controllers/supplier.controller.js";
import {
  protect,
  permissionGranted,
  checkModulePermission,
} from "../controllers/administrationPolicy.controller.js";
const router = express.Router();

router.post(
  "/supplier-profile",
  protect,
  checkModulePermission("purchasing"),
  createSupplierProfile
);
router.get(
  "/supplier-profile",
  protect,
  checkModulePermission("purchasing"),
  getAllSupplierProfiles
);
router.get(
  "/supplier-profile/:id",
  protect,
  checkModulePermission("purchasing"),
  getSupplierProfileById
);
router.patch(
  "/supplier-profile/:id",
  protect,
  checkModulePermission("purchasing"),
  updateSupplierProfile
);
router.patch(
  "/supplier-profile/:id/soft-delete",
  protect,
  checkModulePermission("purchasing"),
  softDeleteSupplierProfile
);
router.patch(
  "/supplier-profile/:id/restore",
  protect,
  checkModulePermission("purchasing"),
  restoreSupplierProfile
);
router.delete(
  "/supplier-profile/:id",
  protect,
  permissionGranted("owner"),
  deleteSupplierProfile
);
export default router;
