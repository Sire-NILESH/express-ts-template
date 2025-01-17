import express from "express";
import authController from "../controllers/auth.controller";
import userController from "../controllers/user.controller";

const userRouter = express.Router();

// Auth routes
userRouter.route("/signup").post(authController.signup);
userRouter.route("/signin").post(authController.signin);
userRouter.route("/signout").get(authController.signout);

userRouter.route("/forgot-password").post(authController.forgotPassword);
userRouter.route("/reset-password/:token").patch(authController.resetPassword);

// Middleware works in sequence so protect all routes after this middleware
userRouter.use(authController.protect);

userRouter.route("/me").get(userController.getMe, userController.getUser);
userRouter.route("/update-me").patch(
  // userController.uploadUserPhoto,
  // userController.resizeUserPhoto,
  userController.updateMe
);
userRouter.route("/delete-me").delete(userController.deleteMe);

userRouter.use(authController.restrictTo("admin"));

// User routes
userRouter
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser);

userRouter
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

export default userRouter;
