import express from "express";
import {
  createStorefrontProfile,
  getAllStorefrontProfiles,
  getStorefrontProfileById,
  updateStorefrontProfile,
} from "../controllers/storefrontProfile.controller.js";
import {
  protect,
  checkModulePermission,
} from "../controllers/administrationPolicy.controller.js";

const router = express.Router();

// Create new storefront profile
router.post(
  "/storefront-profile",
  protect,
  checkModulePermission("inventory", "warehouse"),
  createStorefrontProfile
);

// Get all storefront profiles
router.get(
  "/storefront-profile",
  protect,
  checkModulePermission("sales", "inventory", "warehouse"),
  getAllStorefrontProfiles
);

// Get storefront profile by ID
router.get(
  "/storefront-profile/:id",
  protect,
  checkModulePermission("sales", "inventory", "warehouse"),
  getStorefrontProfileById
);

// Update storefront profile
router.patch(
  "/storefront-profile/:id",
  protect,
  checkModulePermission("inventory", "warehouse"),
  updateStorefrontProfile
);

export default router;
