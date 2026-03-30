import dotenv from "dotenv";
import { MongoDbClient } from "../../db/mongodbclient";
import { OrderDocument, Product } from "../../types";

dotenv.config();

const client = MongoDbClient.getClient();

const DATABASE =
  process.env.environment === "dev" ? process.env.db_dev : process.env.db_prod;
export const getUserSessionsCollection = async () => {
  const db = DATABASE;
  const userSessionsCollection = process.env.user_sessions_collection || "";

  const dbClient = await client;
  const useCollection = dbClient.db(db).collection(userSessionsCollection);

  return useCollection;
};
export const getProductCollection = async () => {
  const db = DATABASE;
  const productCollection = process.env.product_collection || "";

  const dbClient = await client;
  const collection = dbClient.db(db).collection<Product>(productCollection);
  return collection;
};

export const getOrdersCollection = async () => {
  const db = DATABASE;
  const productCollection = process.env.orders_collection || "";

  const dbClient = await client;
  const collection = dbClient
    .db(db)
    .collection<OrderDocument>(productCollection);
  return collection;
};
