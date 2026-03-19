import { Router, Request } from "express";
import dotenv from "dotenv";
import { MongoDbClient } from "../db/mongodbclient";
import { Product } from "../types";
dotenv.config();

const client = MongoDbClient.getClient();

const productsRouter = Router();

productsRouter.get("/get-all", async (req, res) => {
  const db = process.env.db;
  const productCollection = process.env.product_collection || "";

  const dbClient = await client;
  const collection = dbClient.db(db).collection<Product>(productCollection);

  const docs = await collection.find({});
  const result: Product[] = [];
  for await (const doc of docs) {
    result.push(doc);
  }

  res.json(result);
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

      const db = process.env.db;
      const productCollection = process.env.product_collection || "";

      const dbClient = await client;
      const collection = dbClient.db(db).collection<Product>(productCollection);

      const doc = await collection.findOne<Product>({
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
