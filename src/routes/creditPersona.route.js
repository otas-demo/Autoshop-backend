import { Router } from "express";
import {
  createCreditPerson,
  getAllCreditPersons,
  getCreditPersonById,
  updateCreditPerson,
} from "../controllers/creditPersona.controller.js";
import {
  protect,
  checkModulePermission,
} from "../controllers/administrationPolicy.controller.js";

const router = Router();

router.post(
  "/credit-persona",
  protect,
  checkModulePermission("credits", "sales"),
  createCreditPerson
);
router.get(
  "/credit-persona",
  protect,
  checkModulePermission("credits", "sales"),
  getAllCreditPersons
);
router.get(
  "/credit-persona/:id",
  protect,
  checkModulePermission("credits", "sales"),
  getCreditPersonById
);
router.patch(
  "/credit-persona/:id",
  protect,
  checkModulePermission("credits"),
  updateCreditPerson
);
export default router;
