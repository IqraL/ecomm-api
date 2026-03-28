import express, { Request } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import { randomUUID } from "node:crypto";

import {
  healthRouter,
  productsRouter,
  cartRouter,
  checkoutRouter,
} from "./routes";
import { cartCookieMiddleware } from "./middleware/cartCookieMiddleware";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;


app.use(cookieParser());
app.use(
  cors({
    origin: process.env.frontend_host,
    credentials: true,
  })
);
app.use(cartCookieMiddleware);

app.use(express.json());
app.use(express.urlencoded());

app.use("/health", healthRouter);
app.use("/products", productsRouter);
app.use("/cart", cartRouter);
app.use("/checkout", checkoutRouter);

app.get("/", (req, res) => {
  res.send("ping <> pong");
});

app.listen(port, () => {
  console.log(`Server running on ${process.env.frontend_host}:${port}`);
});

