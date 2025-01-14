import { Request, Response } from "express";
import AppError from "../utils/appError";
import { MongooseError } from "mongoose";
import { ErrorIsAppError, ErrorIsCustomMongooseErr } from "../utils/tsHelpers";

export interface CustomMongooseErr extends MongooseError {
  path?: string;
  value?: unknown;
  errors?: Record<string, { message: string }>;
  code?: number;
  keyValue?: Record<string, string>;
}

const handleCastErrorDB = (err: CustomMongooseErr): AppError => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err: CustomMongooseErr): AppError => {
  const message = `Duplicate field value: "${err.keyValue?.name}". Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err: CustomMongooseErr): AppError => {
  const errors = Object.values(err.errors || {})
    .map((el) => el.message)
    .join(". ");

  const message = `Invalid input data. ${errors}`;
  return new AppError(message, 400);
};

const handleJWTError = (): AppError =>
  new AppError("Invalid token. Please login again!", 401);

const handleJWTExpiredError = (): AppError =>
  new AppError("Token has expired. Please login again!", 401);

const sendErrorDev = (err: AppError, _req: Request, res: Response): void => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err: AppError, req: Request, res: Response): void => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.error("ERROR 💥", err);
    res.status(500).json({
      status: "error",
      message: "Something went very wrong!",
    });
  }
};

export default (
  err: AppError | CustomMongooseErr,
  req: Request,
  res: Response
  //   _next: NextFunction
): void => {
  let error = {
    ...err,
    statusCode: ErrorIsAppError(err) ? err.statusCode : 500,
    status: ErrorIsAppError(err) ? err.status : "error",
  };

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(error as AppError, req, res);
  } else if (process.env.NODE_ENV === "production") {
    if (error instanceof MongooseError) {
      if (error.name === "CastError")
        error = handleCastErrorDB(error as CustomMongooseErr);
      if (ErrorIsCustomMongooseErr(error) && error.code === 11000)
        error = handleDuplicateFieldsDB(error as CustomMongooseErr);
      if (error.name === "ValidationError")
        error = handleValidationErrorDB(error as CustomMongooseErr);
    }

    if (error.name === "JsonWebTokenError") error = handleJWTError();
    if (error.name === "TokenExpiredError") error = handleJWTExpiredError();

    sendErrorProd(error as AppError, req, res);
  }
};
