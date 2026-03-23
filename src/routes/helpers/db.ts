import { MongoDbClient } from "../../db/mongodbclient";
import { Product } from "../../types";

const client = MongoDbClient.getClient();

export const getUserSessionsCollection = async () => {
  const db = process.env.db;
  const userSessionsCollection = process.env.user_sessions_collection || "";

  const dbClient = await client;
  const useCollection = dbClient.db(db).collection(userSessionsCollection);

  return useCollection;
};
export const getProductCollection = async () => {
  const db = process.env.db;
  const productCollection = process.env.product_collection || "";

  const dbClient = await client;
  const collection = dbClient.db(db).collection<Product>(productCollection);
  return collection;
};
