import { Request, Response } from "express";
import { getBearerToken, makeJWT } from "./auth.js";
import {
  getUserFromRefreshToken,
  revokeRefreshToken,
} from "./db/queries/refreshTokens.js";
import { config } from "./config.js";
import { UnauthorizedError } from "./errors.js";

const ACCESS_TOKEN_EXPIRATION_SECONDS = 60 * 60; // 1 hour

export async function handlerRefresh(req: Request, res: Response) {
  const token = getBearerToken(req);

  const result = await getUserFromRefreshToken(token);

  if (!result) {
    throw new UnauthorizedError("Invalid refresh token");
  }

  const { user, refreshToken } = result;

  if (refreshToken.revokedAt !== null) {
    throw new UnauthorizedError("Refresh token has been revoked");
  }

  if (refreshToken.expiresAt < new Date()) {
    throw new UnauthorizedError("Refresh token has expired");
  }

  const newAccessToken = makeJWT(
    user.id,
    ACCESS_TOKEN_EXPIRATION_SECONDS,
    config.api.jwtSecret,
  );

  res.header("Content-Type", "application/json");
  res.status(200).send(JSON.stringify({ token: newAccessToken }));
}

export async function handlerRevoke(req: Request, res: Response) {
  const token = getBearerToken(req);

  await revokeRefreshToken(token);

  res.status(204).send();
}