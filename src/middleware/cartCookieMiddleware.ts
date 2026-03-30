import { Request, Response } from "express";
import { setCookie } from "../utils/setCookie";

export const cartCookieMiddleware = async (
  req: Request,
  res: Response,
  next: () => void
) => {
  if (!req.cookies?.["cart-id"]) {
    await setCookie(req, res);
  }
  next();
};
