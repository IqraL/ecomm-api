import { Router, Request } from "express";
import { MongoDbClient } from "../db/mongodbclient";

const client = MongoDbClient.getClient();

const cartRouter = Router();

// _id
// 69bf0e2668189ff12d2d5069
// cartId
// "0321f45d-8fb3-4b2c-8588-4cee70247c60"

// cartItems
type CartItem = {
  productId: string;
  name: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  discounted: boolean;
  discountedPrice?: number;
  imgs: string[];
};
type Cart = {
  cartId: String;
  cartItems: CartItem[];
};

enum CartAction {
  ADD = "add",
  REMOVE = "remove",
}
export const validateCartItem = (cartItem: CartItem) => {};

cartRouter.post(
  "/add",
  async (
    req: Request<{}, {}, { cartItem: CartItem; cartAction: CartAction }>,
    res
  ) => {
    try {
      const cartId = req.cookies?.["cart-id"];
      const { cartAction } = req.body;

      if (!cartId) {
        return res.json({
          error: true,
          message: "no cartId provided ",
        });
      }
      const { cartItem } = req.body;
      const db = process.env.db;
      const userSessionsCollection = process.env.user_sessions_collection || "";

      const dbClient = await client;
      const useCollection = dbClient.db(db).collection(userSessionsCollection);
      const cart = await useCollection.findOne<Cart>({
        cartId,
      });

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
          currentCartItem.size === cartItem.size &&
          currentCartItem.color === cartItem.color
        );
      });

      const updatedCartItems = exists
        ? cartItems.map((currentCartItem) => {
            if (
              currentCartItem.productId === cartItem.productId &&
              currentCartItem.size === cartItem.size &&
              currentCartItem.color === cartItem.color
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
      const updatedCart = await useCollection.findOne<Cart>({
        cartId,
      });

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

type RemoveFromCartBody = {
  productId: string;
  color: string;
  size: string;
};
cartRouter.post(
  "/remove",
  async (req: Request<{}, {}, RemoveFromCartBody>, res) => {
    try {
      const cartId = req.cookies?.["cart-id"];
      //TODO validate body
      const { productId, color, size } = req.body;

      if (!cartId) {
        return res.json({
          error: true,
          message: "no cartId provided ",
        });
      }

      const db = process.env.db;
      const userSessionsCollection = process.env.user_sessions_collection || "";

      const dbClient = await client;
      const useCollection = dbClient.db(db).collection(userSessionsCollection);
      const cart = await useCollection.findOne<Cart>({
        cartId,
      });

      if (!cart) {
        return res.json({
          error: true,
          message: "no cart found ",
        });
      }

      const cartItems = cart?.cartItems;

      const filteredItems = cartItems.filter((currentCartItem) => {
        if (
          currentCartItem.productId === productId &&
          currentCartItem.size === size &&
          currentCartItem.color === color
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
cartRouter.post("/edit", () => {});

export { cartRouter };
