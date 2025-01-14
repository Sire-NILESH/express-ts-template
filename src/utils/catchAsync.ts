import { NextFunction, Request, Response } from "express";

type RecievedFnType = (req: Request, res: Response, next: NextFunction) => void;

/**
 * @description - A wrapper method to catch async errors for Controller methods.
 */
const catchAsync = (recievedFunction: RecievedFnType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(recievedFunction(req, res, next)).catch(next);
  };
};

export default catchAsync;
