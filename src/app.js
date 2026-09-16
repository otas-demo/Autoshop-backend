import dns from "node:dns";
if (process.env.NODE_ENV !== "production") {
  dns.setServers(["1.1.1.1", "8.8.8.8"]);
}
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import express from "express";
import helmet from "helmet";
import { mmTimeZoneMiddleware } from "./configs/timezoneConvertor.config.js";

// User Define Module
import apiRateLimiter from "./middlewares/rateLimiter.middleware.js";
import configureCors from "./configs/cors.config.js";
import globalErrorHandler from "./controllers/error.controller.js";
import CustomError from "./utils/customError.js";

import apiRouter from "./routes/index.js";
const app = express();
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(configureCors());

app.set("trust proxy", 1);
app.use(apiRateLimiter(60, 60 * 1000)); //60 requests per minute

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "10kb" }));
app.use(mmTimeZoneMiddleware);

// Route Mounting
app.use("/api/v1", apiRouter);
//404-Error Handler
app.all("/*any", (req, res, next) => {
  const err = new CustomError(
    404,
    `Can't find ${req.originalUrl} on the server!`,
  );
  next(err);
});

app.use(globalErrorHandler);

export default app;
