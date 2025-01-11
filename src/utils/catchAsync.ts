import { NextFunction, Request, Response } from "express";

type RecievedFnType = (req: Request, res: Response, next: NextFunction) => void;

const catchAsync = (recievedFunction: RecievedFnType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(recievedFunction(req, res, next)).catch(next);
  };
};

export default catchAsync;
