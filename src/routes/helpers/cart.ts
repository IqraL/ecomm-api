import { Request } from "express";
import { Cart, CartItem, Product } from "../../types";
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

export const totalCalculation = (updatedCartItems: CartItem[]) => {
  const total = updatedCartItems.reduce((acc, currentCartItem) => {
    const price = currentCartItem.discounted
      ? currentCartItem.discountedPrice
      : currentCartItem.price;

    const totalPriceWithQuantity =
      Number(price) * Number(currentCartItem.quantity);
    return Number(acc) + Number(totalPriceWithQuantity);
  }, 0);

  return total;
};

export const updatePrice = async ({
  products,
  cart,
  cartId,
}: {
  products: Product[];
  cart: Cart;
  cartId: string;
}) => {
  const { cartItems } = cart;

  for (const product of products) {
    const productId = product.id;

    for (const productMetaData of product.meta) {
      const variantId = productMetaData.variantId;

      for (const cartItem of cartItems) {
        if (
          cartItem.variantId === variantId &&
          cartItem.productId === productId
        ) {
          if (
            productMetaData.price !== cartItem.price ||
            productMetaData.discounted !== cartItem.discounted ||
            productMetaData.discountedPrice !== cartItem.discountedPrice
          ) {
            const updateCartItem: CartItem = {
              ...cartItem,
              price: productMetaData.price,
              discounted: productMetaData.discounted,
              discountedPrice: productMetaData.discountedPrice,
              size: productMetaData.size,
              color: productMetaData.color,
              imgs: productMetaData.imgs,
              stock: productMetaData.stock,
            };
            const userCollection = await getUserSessionsCollection();
            await userCollection.updateOne(
              { cartId: cartId },
              {
                $set: {
                  "cartItems.$[item]": updateCartItem,
                },
              },
              {
                arrayFilters: [
                  {
                    "item.productId": productId,
                    "item.variantId": variantId,
                  },
                ],
              }
            );
          }
        }
      }
    }
  }
};
