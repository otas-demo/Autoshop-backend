import express from "express";

import inventoryRouter from "./inventory.route.js";
import warehouseProfileRouter from "./warehouseProfile.route.js";
import storefrontProfileRouter from "./storefrontProfile.route.js";
import locationProfileRouter from "./locationProfile.route.js";
import storefrontInventoryRouter from "./storefrontInventory.route.js";
import supplierProfileRouter from "./supplierProfile.route.js";
import purchasingRouter from "./purchasing.route.js";
import warehouseRouter from "./warehouse.route.js";
import grnRouter from "./grn.route.js";
import transferRouter from "./transfer.route.js";
import orderRouter from "./order.route.js";
import creditRecordRouter from "./creditRecord.route.js";
import creditPersonaRouter from "./creditPersona.route.js";
import adminRouter from "./admin.route.js";
import expenseRouter from "./expense.route.js";
import stockAuditLogRouter from "./stockAuditLog.route.js";
import saleReportRouter from "./saleReport.route.js";
import aiSaleReportRouter from "./aiSaleReport.route.js";
import aiChatRouter from "./aiChat.route.js";
import shopSettingRouter from "./shopSetting.route.js";
import dailyReportRouter from "./dailyReport.route.js";

const apiRouter = express.Router();

apiRouter.use(inventoryRouter);
apiRouter.use(warehouseProfileRouter);
apiRouter.use(storefrontProfileRouter);
apiRouter.use(locationProfileRouter);
apiRouter.use(storefrontInventoryRouter);
apiRouter.use(supplierProfileRouter);
apiRouter.use(purchasingRouter);
apiRouter.use(warehouseRouter);
apiRouter.use(grnRouter);
apiRouter.use(transferRouter);
apiRouter.use(orderRouter);
apiRouter.use(creditRecordRouter);
apiRouter.use(creditPersonaRouter);
apiRouter.use(adminRouter);
apiRouter.use(expenseRouter);
apiRouter.use(stockAuditLogRouter);
apiRouter.use(saleReportRouter);
apiRouter.use(aiSaleReportRouter);
apiRouter.use(aiChatRouter);
apiRouter.use(shopSettingRouter);
apiRouter.use(dailyReportRouter);

export default apiRouter;
