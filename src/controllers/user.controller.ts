import { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError";
import catchAsync from "../utils/catchAsync";
import { StatusCodes } from "http-status-codes";
import { filterObj } from "../utils/helpers";
import { User } from "../models/user.model";
import factory from "./handlerFactory";

// Middleware function for the route "/me"
export const getMe = (req: Request, _res: Response, next: NextFunction) => {
  req.params.id = req.user?.id ? req.user.id : "";
  next();
};

/**
 * @description - Update current user
 * @route - PATCH /api/v1/users/updateMe
 */
export const updateMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1) Create error if user POSTs password data or is not authenticated.
    if (req.body.password || req.body.passwordConfirm) {
      return next(
        new AppError(
          "This route is not for password updates. Please use /updateMyPassword.",
          StatusCodes.BAD_REQUEST
        )
      );
    }

    // authenticated users have a 'user' object put on the req object by the 'protect' middleware.
    if (!req.user) {
      return next(
        new AppError(
          "You need to be signed in to perform this action.",
          StatusCodes.UNAUTHORIZED
        )
      );
    }

    // 2) Only pick allowed fields from the body that are permitted to be updated here.
    const filterBody = filterObj(req.body, "name", "email");

    // (Optional) If user uploads new photo then add it to filterbody object, add uploading img to some cloud provider.
    // if (req.file) filterBody.photo = req.file.filename;

    // 3) Update user document (only name and email)
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filterBody, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "success",
      data: {
        user: updatedUser,
      },
    });
  }
);

/**
 * @description - Delete current user
 * @route - DELETE /api/v1/users/deleteMe
 */
exports.deleteMe = catchAsync(async (req, res, next) => {
  // authenticated users have a 'user' object put on the req object by the 'protect' middleware.
  if (!req.user) {
    return next(
      new AppError(
        "You need to be signed in to perform this action.",
        StatusCodes.UNAUTHORIZED
      )
    );
  }

  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

/**
 * @description - Create New User
 * @route - POST /api/v1/users
 */
exports.createUser = (_req: Request, res: Response) => {
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    status: "error",
    message: 'This route is not defined! Please use "/signup" instead.',
  });
};

/**
 * @description - Get All Users
 * @route - GET /api/v1/users
 */
exports.getAllUsers = factory.getAll(User);

/**
 * @description - Get User (Single)
 * @route - GET /api/v1/users/:id
 */
exports.getUser = factory.getOne(User);

/**
 * @description - Update User
 * @route - PATCH /api/v1/users/:id
 */
exports.updateUser = factory.updateOne(User);

/**
 * @description - Delete User
 * @route - DELETE /api/v1/users/:id
 */
exports.deleteUser = factory.deleteOne(User);
