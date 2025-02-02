import { IUserDocument } from "../../models/user.model";

declare global {
  namespace Express {
    export interface Request {
      user?: IUserDocument;
    }
  }
}

export {};
