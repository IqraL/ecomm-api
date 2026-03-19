import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { healthRouter, productsRouter } from "./routes";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.use("/health", healthRouter);
app.use("/products", productsRouter);
app.get("/", (req, res) => {
  res.send("ping <> pong");
});
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
