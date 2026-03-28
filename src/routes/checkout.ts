import { Router, Request } from "express";
import { randomUUID } from "node:crypto";
import Stripe from "stripe";

import { getCartFromDb, getCartIdFromRequest } from "./helpers";
import { OrderDocument } from "../types";
import { getOrdersCollection, getUserSessionsCollection } from "./helpers/db";

const checkoutRouter = Router();

const stripe = new Stripe(process.env.stripe_secret_key ?? "");

checkoutRouter.post(
  "/create-session",
  async (req: Request<{}, {}, { email: string }>, res) => {
    const orderId = randomUUID();
    const { email } = req.body;

    if (!email) {
      return res.json({
        error: true,
        message: "no valid email provided",
      });
    }

    let cartId = getCartIdFromRequest(req);
    const cart = await getCartFromDb(cartId);

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      cart?.cartItems.map((cartItem) => {
        return {
          price_data: {
            currency: "gbp",
            product_data: {
              name: cartItem.name,
              description: `Size:${cartItem.size}, Color:${cartItem.color},  orderId:${orderId}`,
            },
            unit_amount: cartItem.discounted
              ? Number(cartItem.discountedPrice) * 100
              : Number(cartItem.price) * 100,
          },
          quantity: cartItem.quantity,
        };
      }) ?? [];
    const session = await stripe.checkout.sessions.create({
      line_items: [...lineItems],
      customer_email: email,
      mode: "payment",
      success_url: `${process.env.frontend_host}/success?orderId=${orderId}&email=${email}`,
      cancel_url: `${process.env.frontend_host}/cart`,
    });

    res.send({
      url: session.url,
    });
  }
);

checkoutRouter.post(
  "/success",
  async (
    req: Request<
      {},
      {},
      {
        email: string;
        orderId: string;
      }
    >,
    res
  ) => {
    const { email, orderId } = req.body;
    let cartId = getCartIdFromRequest(req);

    if (!email || !orderId || !cartId) {
      return res.json({
        error: true,
        message: "please provide a valid email and orderId and cartId",
      });
    }

    const cart = await getCartFromDb(cartId);
    const cartItems = cart?.cartItems || [];

    const orderCollection = await getOrdersCollection();
    const currentOrder = await orderCollection.findOne({
      email: email,
      orderId: orderId,
    });

    if (currentOrder) {
      return res.json({
        ...currentOrder,
      });
    }

    const newOrder: OrderDocument = {
      email: email,
      orderId: orderId,
      cartItems: cartItems,
      stripeSuccess: true,
      sessionCompleted: false,
    };
    await orderCollection.insertOne(newOrder);

    //update product quantity
    // empty cart
    const userCollection = await getUserSessionsCollection();
    await userCollection.updateOne(
      {
        cartId,
      },
      {
        $set: {
          cartItems: [],
        },
      }
    );

    return res.json({
        done: true
    })
  }
);

export { checkoutRouter };
