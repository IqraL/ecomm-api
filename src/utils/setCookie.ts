import { Request, Response } from "express";
import dotenv from "dotenv";
import { randomUUID } from "node:crypto";
import { client } from "../db/mongodbclient";

dotenv.config();

const DATABASE =
  process.env.environment === "dev" ? process.env.db_dev : process.env.db_prod;

export const setCookie = async (req: Request, res: Response) => {
  try {
    const cartId = randomUUID();
    res.cookie("cart-id", cartId, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24,
    });

    const db = DATABASE;
    const userSessionsCollection = process.env.user_sessions_collection || "";

    const dbClient = await client;
    const useCollection = dbClient.db(db).collection(userSessionsCollection);
    await useCollection.insertOne({
      cartId,
      cartItems: [],
    });

    return cartId;
  } catch (error) {
    console.log("error setting cookie");
  }
};
