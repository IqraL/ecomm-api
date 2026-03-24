import { Router, Request } from "express";
import dotenv from "dotenv";
import { Product } from "../types";
import { getProductCollection } from "./helpers";
dotenv.config();

const PRODUCTS_PER_PAGE = 6;

const productsRouter = Router();

productsRouter.get(
  "/pagination-data",
  async (req: Request<{}, {}, {}, { pageNumber: number }>, res) => {
    const productCollection = await getProductCollection();
    const numberOfProducts = await productCollection.countDocuments();
    const numberOfPages = Math.ceil(numberOfProducts / PRODUCTS_PER_PAGE);
    return res.json({ numberOfProducts, numberOfPages });
  }
);
productsRouter.get(
  "/get-all",
  async (req: Request<{}, {}, {}, { pageNumber: number }>, res) => {
    const pageNumber = Number(req.query.pageNumber ?? 0);
    const productCollection = await getProductCollection();
    const docs = await productCollection
      .find({})
      .sort({ position: 1 })
      .skip(PRODUCTS_PER_PAGE * pageNumber)
      .limit(PRODUCTS_PER_PAGE)
      .toArray();
    const result: Product[] = [];
    for await (const doc of docs) {
      result.push(doc);
    }
    return res.json(result);
  }
);

productsRouter.post(
  "/get-by-id",
  async (req: Request<{}, {}, { productId: string }>, res) => {
    try {
      if (!req.body?.productId) {
        return res.send({
          error: true,
          msg: "please provide a productId",
        });
      }
      const { productId } = req.body;

      const productCollection = await getProductCollection();
      const doc = await productCollection.findOne<Product>({
        id: productId,
      });

      if (!doc) {
        return res.send({ error: true, msg: "product not found" });
      }

      return res.send(doc);
    } catch (error) {
      return res.send({ error: true, msg: "could not find product" });
    }
  }
);

export { productsRouter };
