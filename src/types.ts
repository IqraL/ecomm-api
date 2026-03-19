type ProductMetaData = {
  stock: number;
  size: string;
  color: string;
  imgs: string[];
  price: number;
  discounted: boolean;
  discountedPrice?: number;
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

export { ProductMetaData, Product };