import bcrypt from "bcrypt";
import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import { IUserDocument, User } from "../models/user.model";
import AppError from "../utils/appError";
import catchAsync from "../utils/catchAsync";
import { IUser } from "./../models/user.model";

const signToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

export const createSendTokenResponse = (
  user: IUserDocument,
  statusCode: number,
  req: Request,
  res: Response
) => {
  const token = signToken(user.id);
  const cookieOptions = {
    expires: new Date(
      Date.now() +
        Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
  };

  // if (req.secure || req.headers['x-forwarded-proto'] === 'https') cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  // Remove password from output
  const resUser = { ...user, password: undefined };

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user: resUser,
    },
  });
};

export const generateHashedPassword = async (passwordText: string) => {
  return await bcrypt.hash(passwordText, 12);
};

export const comparePasswords = async (
  passwordText: string,
  hashedPassword: string
) => {
  return await bcrypt.compare(passwordText, hashedPassword);
};

export const verifyJWTAsync = (
  token: string,
  secret: string
): Promise<jwt.JwtPayload> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        return reject(err);
      }
      resolve(decoded as jwt.JwtPayload);
    });
  });
};

/**
 * Check if user changed password after the token was issued
 * @param {Number} tokenIssuedAt - Generated jwts will include an iat (issued at)
 * @returns Boolean
 */
export const changedPasswordAfter = function (
  user: IUserDocument,
  tokenIssuedAt: number
) {
  if (user.passwordChangedAt) {
    const changedTimestamp = new Date(user.passwordChangedAt).getTime() / 1000;

    return tokenIssuedAt < changedTimestamp;
  }

  // not changed
  return false;
};

/**
 * @description - Register new User
 * @route - POST /api/v1/users/signup
 */
export const signup = catchAsync(async (req, res, next) => {
  // Server-side check is password and password confirm matches
  if (req.body.password !== req.body.passwordConfirm) {
    return next(
      new AppError(
        "password and passwordConfirm does no match",
        StatusCodes.BAD_REQUEST
      )
    );
  }

  const hashedPassword = await generateHashedPassword(req.body.password);

  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: hashedPassword,
  });

  // Send welcome email in the background
  // sendWelcomeEmail(newUser, req);

  createSendTokenResponse(newUser, StatusCodes.CREATED, req, res);
});

/**
 * @description - Signin a User
 * @route - POST /api/v1/users/signin
 */
export const signin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if user provide email and password
  if (!email || !password) {
    return next(
      new AppError(
        "Please provide email and password!",
        StatusCodes.BAD_REQUEST
      )
    );
  }

  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select("+password");

  // 3) Check if user not exists or password is incorrect
  if (!user || !(await comparePasswords(password, user.password))) {
    return next(
      new AppError("Incorrect email or password", StatusCodes.UNAUTHORIZED)
    );
  }

  // 4) If everything ok, send token to client
  createSendTokenResponse(user, StatusCodes.OK, req, res);
});

// Log out user by passing dummy token instead and expires in 10 seconds
/**
 * Signout out user
 * @description Signout user by passing dummy token payload that expires in 10 seconds
 * @route - GET /api/v1/users/signout
 */
export const signout = (_req: Request, res: Response) => {
  res.cookie("jwt", "signed-out", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(StatusCodes.OK).json({ status: "success" });
};

/**
 * @description - Forgot Password
 * @route - POST /api/v1/users/forgot-password
 */
export const forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on posted email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError("There is no user with this email address.", 403));
  }

  // 2) Generate the random reset token for the user
  // "generatePasswordResetToken" is document instance methods from "userModel"
  // const resetToken = user.generatePasswordResetToken(); // without encrypted/simple token
  // await user.save({ validateBeforeSave: false });

  const resetToken = crypto.randomBytes(40).toString("hex");
  const resetTokenExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

  user.resetPasswordToken = resetToken;
  user.resetPasswordTokenExpiresAt = resetTokenExpiresAt;

  await user.save();

  // 3) Send it to user's email
  // const resetURL = `${req.protocol}://${req.get(
  //   "host"
  // )}/api/v1/users/resetPassword/${resetToken}`; // e.g. http://127.0.0.1:8080/api/v1/users/resetPassword/3454543...

  try {
    // Send password reset email to requested user

    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpiresAt = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "There was an error sending the email. Try again later!",
        StatusCodes.INTERNAL_SERVER_ERROR
      )
    );
  }
});

/**
 * @description - Resets user Password
 * @route - PATCH /api/v1/users/reset-password/:token
 */
export const resetPassword = catchAsync(async (req, res, next) => {
  // Server-side check is password and password confirm matches
  if (req.body.password !== req.body.passwordConfirm) {
    return next(
      new AppError(
        "password and passwordConfirm does no match",
        StatusCodes.BAD_REQUEST
      )
    );
  }

  // 1) Get user based on the token (encrypt this simple token and then compare with the stored token)
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user: IUserDocument | null = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordTokenExpiresAt: { $gt: Date.now() }, // should be greater than the "resetPassword" opening time
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  user.password = await generateHashedPassword(req.body.password);
  user.resetPasswordToken = undefined;
  user.resetPasswordTokenExpiresAt = undefined;

  await user.save();

  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  createSendTokenResponse(user, StatusCodes.OK, req, res);
});

/**
 * Middleware function to check if the user is authenticated
 * @description - Only login user can access further routes
 */
export const protect = catchAsync(async (req, _res, next) => {
  // 1) Getting token, and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError("Please login to get access!", StatusCodes.UNAUTHORIZED)
    );
  }

  // 2) Verification token, doing it async way will help us keep using the catchAsync way for error handling.
  const decoded = await verifyJWTAsync(token, process.env.JWT_SECRET as string);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError(
        "The user associated with this token no longer exists.",
        StatusCodes.UNAUTHORIZED
      )
    );
  }

  /**
   * 4) Check if user changed password after the token was issued
   * "changedPasswordAfter" is document instance methods from "userModel.js" which returns boolean
   */
  if (changedPasswordAfter(currentUser, decoded.iat as number)) {
    return next(
      new AppError(
        "User recently changed password! Please log in again.",
        StatusCodes.UNAUTHORIZED
      )
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

/**
 * Middleware function to check user's role and perform Authorization
 * @description - Restricts further actions to specfied roles only
 */
export const restrictTo = (...roles: IUser["role"][]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (req.user && !roles.includes(req.user.role)) {
      return next(
        new AppError(
          "You don't have permission to perform this action.",
          StatusCodes.FORBIDDEN
        )
      );
    }

    next();
  };
};
