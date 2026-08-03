import { Request, Response } from "express";
import {
  NotFoundError,
  UnauthorizedError,
} from "./errors.js";
import { upgradeUserToChirpyRed } from "./db/queries/user.js";
import { getAPIKey } from "./auth.js";
import { config } from "./config.js";

export async function handlerPolkaWebhook(
  req: Request,
  res: Response,
) {
  const apiKey = getAPIKey(req);

  if (apiKey !== config.api.polkaKey) {
    throw new UnauthorizedError("Unauthorized");
  }

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