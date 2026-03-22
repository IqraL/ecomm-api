import { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { MongoDbClient } from "../db/mongodbclient";

const client = MongoDbClient.getClient();

export const cartCookieMiddleware = async (
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

    const db = process.env.db;
    const userSessionsCollection = process.env.user_sessions_collection || "";

    const dbClient = await client;
    const useCollection = dbClient.db(db).collection(userSessionsCollection);
    await useCollection.insertOne({
      cartId,
      cartItems: [],
    });
  }

  next();
};
