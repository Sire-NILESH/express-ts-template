import { MongooseError } from "mongoose";
import { CustomMongooseErr } from "../controllers/error.controller";
import AppError from "./appError";

// Type Guard checkers for narrowing Types

export const ErrorIsAppError = (error: Error): error is AppError =>
  error instanceof AppError;

export const ErrorIsCustomMongooseErr = (
  error: Error
): error is CustomMongooseErr => error instanceof MongooseError;
