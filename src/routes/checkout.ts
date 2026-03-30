import { Router, Request } from "express";
import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import { ServerClient } from "postmark";
import dotenv from "dotenv";

import { getCartFromDb, getCartIdFromRequest } from "./helpers";
import { OrderDocument } from "../types";
import {
  getOrdersCollection,
  getProductCollection,
  getUserSessionsCollection,
} from "./helpers/db";
import { sendEmail } from "./helpers";

dotenv.config();

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
      client_reference_id: orderId,
      metadata: {
        orderId,
        email,
        cartId,
      },
      success_url: `${process.env.frontend_host}/success?orderId=${orderId}&email=${email}`,
      cancel_url: `${process.env.frontend_host}/cart`,
    });

    res.send({
      url: session.url,
    });
  }
);

checkoutRouter.post("/session-completed", async (req, res) => {
  if (req.body.type !== "checkout.session.completed") {
    return res.sendStatus(200);
  }

  const session = req.body.data.object;

  const cartId = session.metadata?.cartId;
  const cart = await getCartFromDb(cartId);
  const cartItems = cart?.cartItems || [];

  if (!cartItems.length) {
    return res.status(400).json({
      error: true,
      message: "Cart is empty or not found",
    });
  }

  const stripeSessionId = session.id;
  const email = session.customer_email ?? session.metadata?.email;
  const orderId = session.client_reference_id || session.metadata?.orderId;

  if (!cartId || !email || !orderId) {
    return res.status(400).json({
      error: true,
      message: "Missing cartId, email, or orderId",
    });
  }

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
  if (!currentOrder) {
    const newOrder: OrderDocument = {
      email: email,
      orderId: orderId,
      cartItems: cartItems,
      stripeSuccess: true,
      sessionCompleted: true,
      stripeSessionId: stripeSessionId,
    };
    await orderCollection.insertOne(newOrder);

    //update product quantity
    const productCollection = await getProductCollection();

    for (const cartItem of cartItems) {
      await productCollection.updateOne(
        {
          id: cartItem.productId,
          meta: {
            $elemMatch: {
              variantId: cartItem.variantId,
              //    stock: { $gte: cartItem.quantity },
            },
          },
        },
        {
          $inc: {
            "meta.$[variant].stock": -cartItem.quantity,
          },
        },
        {
          arrayFilters: [{ "variant.variantId": cartItem.variantId }],
        }
      );
    }

    //empty cart
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

    const result = await orderCollection.updateOne(
      {
        orderId,
        email,
      },
      {
        $set: {
          sessionCompleted: true,
          stripeSessionId,
        },
      }
    );

    const addedOrder = await orderCollection.findOne({
      email: email,
      orderId: orderId,
    });

    if (result.matchedCount === 0) {
      console.log("⚠️ Order not found:", { orderId, email });
      return res.sendStatus(400);
    }

    //TODO://send order email
    if (addedOrder) {
      sendEmail({ order: addedOrder });
    }

    return res.json({
      ...addedOrder,
    });
  }
  return res.sendStatus(200);
});

checkoutRouter.post(
  "/get-order",
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
    try {
      const { email, orderId } = req.body;

      if (!email || !orderId) {
        return res.json({
          error: true,
          message: "please provide a valid email and orderId and cartId",
        });
      }

      const orderCollection = await getOrdersCollection();
      const currentOrder = await orderCollection.findOne({
        email: email,
        orderId: orderId,
      });

      if (currentOrder) {
        return res.json({
          ...currentOrder,
        });
      } else {
        return res.json({
          error: true,
          message: "order not found",
        });
      }
    } catch (error) {
      return res.json({
        error: true,
        message: "failed to get order",
      });
    }
  }
);

export { checkoutRouter };
