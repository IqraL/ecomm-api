import { Request, Response } from "express";
import { randomUUID } from "node:crypto";

export const cartCookieMiddleware = (
  req: Request,
  res: Response,
  next: () => void
) => {
  if (!req.cookies?.["cart-id"]) {
    const cartId = randomUUID();

    res.cookie("cart-id", cartId, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24,
    });
  }

  next();
};
