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
import { protect } from "../controllers/administrationPolicy.controller.js";
import { permissionGranted } from "../controllers/administrationPolicy.controller.js";
const router = express.Router();

router.post(
  "/supplier-profile",
  protect,
  permissionGranted("owner", "admin", "cashier", "warehouse"),
  createSupplierProfile
);
router.get(
  "/supplier-profile",
  protect,
  permissionGranted("owner", "admin", "cashier", "warehouse"),
  getAllSupplierProfiles
);
router.get(
  "/supplier-profile/:id",
  protect,
  permissionGranted("owner", "admin", "cashier", "warehouse"),
  getSupplierProfileById
);
router.patch(
  "/supplier-profile/:id",
  protect,
  permissionGranted("owner", "admin", "cashier", "warehouse"),
  updateSupplierProfile
);
router.patch(
  "/supplier-profile/:id/soft-delete",
  protect,
  permissionGranted("owner", "warehouse"),
  softDeleteSupplierProfile
);
router.patch(
  "/supplier-profile/:id/restore",
  protect,
  permissionGranted("owner", "warehouse"),
  restoreSupplierProfile
);
router.delete(
  "/supplier-profile/:id",
  protect,
  permissionGranted("owner", "warehouse"),
  deleteSupplierProfile
);
export default router;
