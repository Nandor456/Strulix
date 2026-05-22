import type { Request } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import type { ParsedQs } from "qs";

export type RequestAuth = {
  userId: string;
  tokenId?: string;
};

declare global {
  namespace Express {
    interface Request {
      auth?: RequestAuth;
    }
  }
}

export type AuthenticatedRequest<
  Params = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = ParsedQs,
> = Request<Params, ResBody, ReqBody, ReqQuery>;
