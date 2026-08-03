import { Request, Response } from "express";
import { NotFoundError } from "./errors.js";
import { upgradeUserToChirpyRed } from "./db/queries/user.js";

export async function handlerPolkaWebhook(
  req: Request,
  res: Response,
) {
  const { event, data } = req.body;

  if (event !== "user.upgraded") {
    return res.sendStatus(204);
  }

  const user = await upgradeUserToChirpyRed(data.userId);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return res.sendStatus(204);
}
