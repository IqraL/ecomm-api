import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import { healthRouter, productsRouter } from "./routes";
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

app.get("/", (req, res) => {
  res.send("ping <> pong");
});

app.post("/add-to-cart", (req, res) => {
  console.log(req.body);
  res.send(200);
});
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
