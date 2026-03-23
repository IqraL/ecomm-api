import { Router, Request } from "express";
import dotenv from "dotenv";
import { Product } from "../types";
import { getProductCollection } from "./helpers";
dotenv.config();

const productsRouter = Router();

productsRouter.get("/get-all", async (_req, res) => {
  const productCollection = await getProductCollection();
  const docs = await productCollection.find({});
  const result: Product[] = [];
  for await (const doc of docs) {
    result.push(doc);
  }
  return res.json(result);
});

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
