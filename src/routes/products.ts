import { Router } from "express";

const productsRouter = Router();

productsRouter.get("/", (_req, res) => {
  res.json({ ok: true });
});

export  {productsRouter};
