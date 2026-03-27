import { CartAction, CartItem, RemoveFromCartBody } from "../../types";

export const validateCartItem = (cartItem: CartItem) => {
  const {
    variantId,
    productId,
    name,
    size,
    color,
    quantity,
    price,
    imgs,
    discounted,
    discountedPrice,
    stock,
  } = cartItem;
  if (
    !productId ||
    !name ||
    !size ||
    !color ||
    !quantity ||
    !price ||
    !imgs ||
    !variantId ||
    !stock
  ) {
    return false;
  }

  if (quantity > stock) {
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
  const { productId, variantId } = reqBody;
  if (!productId || !variantId) {
    return false;
  }
  return true;
};
