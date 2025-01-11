import express from "express";
import userRouter from "./userRouter";

const indexRouter = express.Router();

// Mount the routes
// indexRouter.use("/api/v1/products", producterRouter)
indexRouter.use("/api/v1/users", userRouter);

export default indexRouter;
