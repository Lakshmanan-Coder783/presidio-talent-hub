import type { Request, Response } from "express";
import { User } from "../models/User.model.js";

export async function listUsers(_req: Request, res: Response) {
  const users = await User.find();
  res.json(users);
}
