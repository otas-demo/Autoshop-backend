import { Router } from "express";
import {
  createCreditPerson,
  getAllCreditPersons,
  getCreditPersonById,
  updateCreditPerson,
} from "../controllers/creditPersona.controller.js";
import { protect } from "../controllers/administrationPolicy.controller.js";
import { permissionGranted } from "../controllers/administrationPolicy.controller.js";

const router = Router();

router.post(
  "/credit-persona",
  protect,
  permissionGranted("owner", "admin", "cashier", "warehouse"),
  createCreditPerson
);
router.get(
  "/credit-persona",
  protect,
  permissionGranted("owner", "admin", "cashier", "warehouse"),
  getAllCreditPersons
);
router.get(
  "/credit-persona/:id",
  protect,
  permissionGranted("owner", "admin", "cashier", "warehouse"),
  getCreditPersonById
);
router.patch(
  "/credit-persona/:id",
  protect,
  permissionGranted("owner", "warehouse"),
  updateCreditPerson
);
export default router;
