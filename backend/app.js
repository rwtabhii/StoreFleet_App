import dotenv from "dotenv";
import express from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";
import path from "path";
import productRoutes from "./src/product/routes/product.routes.js";
import {
  errorHandlerMiddleware,
  handleUncaughtError,
} from "./middlewares/errorHandlerMiddleware.js";
import userRoutes from "./src/user/routes/user.routes.js";
import cookieParser from "cookie-parser";
import orderRoutes from "./src/order/routes/order.routes.js";
// this _filename will give the cwd where the file belong to 
const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);
console.log(path.resolve());
// console.log(_dirname);
const configPath = path.resolve(_dirname, "config", "uat.env");
dotenv.config({ path: configPath });
// console.log(process.env.PORT);
const app = express();
app.use(express.json());
app.use(cookieParser());
// configure routes
app.use("/api/storefleet/product", productRoutes);
app.use("/api/storefleet/user", userRoutes);
app.use("/api/storefleet/order", orderRoutes);
// errorHandlerMiddleware
app.use(errorHandlerMiddleware);

export default app;
