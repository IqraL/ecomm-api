
import { Router, Request } from "express";
import { Cart } from "../../types";
import { getUserSessionsCollection } from "./db";


export const getCartIdFromRequest = (req: Request) => {
  return req.cookies?.["cart-id"];
};

export const getCartFromDb = async (cartId: string) => {
  const userSessionsCollection = await getUserSessionsCollection();
  const cart = await userSessionsCollection.findOne<Cart>({
    cartId,
  });
  return cart;
};