type ProductMetaData = {
  stock: number;
  size: string;
  color: string;
  imgs: string[];
  price: number;
  discounted: boolean;
  discountedPrice?: number;
  variantId: string;
};
type Product = {
  id: string;
  name: string;
  tag: string;
  description: string;
  coverImg: string;
  position: number;
  meta: ProductMetaData[];
};

type CartItem = {
  productId: string;
  variantId: string;
  name: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  discounted: boolean;
  discountedPrice?: number;
  imgs: string[];
  stock: number;
};
type Cart = {
  cartId: String;
  cartItems: CartItem[];
};

enum CartAction {
  ADD = "add",
  REMOVE = "remove",
}
type RemoveFromCartBody = {
  productId: string;
  variantId: string;
};

export {
  ProductMetaData,
  Product,
  CartItem,
  Cart,
  CartAction,
  RemoveFromCartBody,
};
