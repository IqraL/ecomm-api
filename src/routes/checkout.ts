import { Router, Request } from "express";
import { randomUUID } from "node:crypto";
import Stripe from "stripe";

import { getCartFromDb, getCartIdFromRequest } from "./helpers";

const checkoutRouter = Router()

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
      cancel_url: `${process.env.frontend_host}/canceled?orderId=${orderId}&email=${email}`,
    });

    res.send({
      url: session.url,
    });
  }
);


export { checkoutRouter };