import express, { Request, Response } from "express";

const userRouter = express.Router();

userRouter.route("/").get((req: Request, res: Response) => {
  res.send({
    success: true,
    data: {
      message: `${req.originalUrl} user route has been hit`,
    },
  });
});

export default userRouter;
