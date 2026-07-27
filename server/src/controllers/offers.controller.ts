import type { Request, Response } from "express";
import { Offer } from "../models/Offer.model.js";

export async function listOffers(_req: Request, res: Response) {
  const offers = await Offer.find();
  res.json(offers);
}
