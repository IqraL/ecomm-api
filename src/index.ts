import express, { Request } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";

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


app.listen(port, () => {
  console.log(`Server running on localhost:${port}`);
});
//stripe login
//stripe listen --forward-to http://localhost:3000/checkout/session-completed
//stripe trigger checkout.session.completed
//stripe listen --events checkout.session.completed --forward-to http://localhost:3000/app