import { CartAction, CartItem, RemoveFromCartBody } from "../../types";

export const validateCartItem = (cartItem: CartItem) => {
  const {
    productId,
    name,
    size,
    color,
    quantity,
    price,
    imgs,
    discounted,
    discountedPrice,
  } = cartItem;
  if (!productId || !name || !size || !color || !quantity || !price || !imgs) {
    return false;
  }

  if (discounted && !discountedPrice) {
    return false;
  }

  return true;
};

export const validateCartAction = (cartAction: CartAction) => {
  if (cartAction !== CartAction.ADD && cartAction !== CartAction.REMOVE) {
    return false;
  }
  return true;
};

export const validateRemoveFromCartBody = (reqBody: RemoveFromCartBody) => {
  const { productId, color, size } = reqBody;
  if (!productId || !color || !size) {
    return false;
  }
  return true;
};
