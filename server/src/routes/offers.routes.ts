import { Router } from "express";
import { listOffers } from "../controllers/offers.controller.js";

export const offersRouter = Router();

offersRouter.get("/offers", listOffers);
