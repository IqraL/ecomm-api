import { Router, Request } from "express";
import { CartAction, CartItem, RemoveFromCartBody } from "../types";
import { setCookie } from "../utils/setCookie";
import {
  getCartFromDb,
  getCartIdFromRequest,
  getProductCollection,
} from "./helpers";
import { getUserSessionsCollection } from "./helpers";
import {
  validateCartAction,
  validateCartItem,
  validateRemoveFromCartBody,
} from "./validation";

const cartRouter = Router();

cartRouter.get("/fetch", async (req, res) => {
  try {
    let cartId = getCartIdFromRequest(req);

    if (!cartId) {
      cartId = await setCookie(req, res);
    }

    const cart = await getCartFromDb(cartId);
    const productIds =
      cart?.cartItems.map((cartItem) => cartItem.productId) || [];
    const productCollection = await getProductCollection();
    const products = [];

    for await (const productId of productIds) {
      const product = await productCollection.findOne({ id: productId });
      products.push(product);
    }

    if (!cart) {
      return res.json({
        error: true,
        message: "could not find cart ",
      });
    }

    return res.json({ cart, products });
  } catch (error) {
    console.log("error", error);
    return res.json({
      error: true,
      message: "something went wrong when fetching cart",
    });
  }
});

cartRouter.post(
  "/add",
  async (
    req: Request<{}, {}, { cartItem: CartItem; cartAction: CartAction }>,
    res
  ) => {
    try {
      let cartId = getCartIdFromRequest(req);

      if (!cartId) {
        cartId = await setCookie(req, res);
      }
      const { cartItem } = req.body;
      const isCartItemValid = validateCartItem(cartItem);
      if (!isCartItemValid) {
        return res.json({
          error: true,
          message: "invalid cart item sent",
        });
      }
      const { cartAction } = req.body;
      const isCartActionValid = validateCartAction(cartAction);
      if (!isCartActionValid) {
        return res.json({
          error: true,
          message: "invalid cartAction",
        });
      }

      const useCollection = await getUserSessionsCollection();
      const cart = await getCartFromDb(cartId);

      const cartItems = cart?.cartItems;
      if (!cartItems?.length) {
        await useCollection.updateOne(
          {
            cartId,
          },
          { $set: { cartItems: [cartItem] } }
        );

        return res.status(200).json({
          error: false,
          message: "item added to empty cart",
        });
      }

      const exists = cartItems.some((currentCartItem) => {
        return (
          currentCartItem.productId === cartItem.productId &&
          currentCartItem.variantId === cartItem.variantId
        );
      });

      const updatedCartItems = exists
        ? cartItems.map((currentCartItem) => {
            if (
              currentCartItem.productId === cartItem.productId &&
              currentCartItem.variantId === cartItem.variantId
            ) {
              return {
                ...currentCartItem,
                quantity:
                  cartAction === CartAction.ADD
                    ? currentCartItem.quantity + 1
                    : cartAction === CartAction.REMOVE
                    ? currentCartItem.quantity - 1
                    : currentCartItem.quantity,
              };
            }

            return currentCartItem;
          })
        : [...cartItems, cartItem];

      await useCollection.updateOne(
        {
          cartId,
        },
        { $set: { cartItems: updatedCartItems } }
      );

      /* Removing empty products */
      const updatedCart = await getCartFromDb(cartId);

      const filteredCartItems =
        updatedCart?.cartItems.filter(
          (currentCartItem) => currentCartItem.quantity > 0
        ) ?? [];

      await useCollection.updateOne(
        {
          cartId,
        },
        { $set: { cartItems: filteredCartItems } }
      );

      res.send(200);
    } catch (error) {
      console.log("error add/removing from cart");
      res.send(404);
    }
  }
);

cartRouter.post(
  "/remove",
  async (req: Request<{}, {}, RemoveFromCartBody>, res) => {
    try {
      let cartId = getCartIdFromRequest(req);

      if (!cartId) {
        cartId = await setCookie(req, res);
      }

      const isBodyValid = validateRemoveFromCartBody(req.body);
      if (!isBodyValid) {
        return res.json({
          error: true,
          message: "invalid body provided. productId and variantId required ",
        });
      }

      const useCollection = await getUserSessionsCollection();
      const cart = await getCartFromDb(cartId);

      if (!cart) {
        return res.json({
          error: true,
          message: "no cart found ",
        });
      }

      const cartItems = cart?.cartItems;
      const { productId, variantId } = req.body;

      const filteredItems = cartItems.filter((currentCartItem) => {
        if (
          currentCartItem.productId === productId &&
          currentCartItem.variantId === variantId
        ) {
          return false;
        } else {
          return true;
        }
      });

      await useCollection.updateOne(
        {
          cartId,
        },
        { $set: { cartItems: filteredItems } }
      );

      return res.json({
        error: false,
        message: "removed item from cart",
      });
    } catch (error) {
      console.log("error", error);
      return res.json({
        error: true,
        message: "unable to remove cart item",
      });
    }
  }
);

export { cartRouter };
