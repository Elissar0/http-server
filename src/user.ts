import { Request, Response } from "express";
import { saveRefreshToken } from "./db/queries/refreshTokens.js";
import { hashPassword, checkPasswordHash, makeJWT, makeRefreshToken } from "./auth.js";
import { config } from "./config.js";
import { BadRequestError, UnauthorizedError } from "./errors.js";
import { createUser, getUserByEmail } from "./db/queries/user.js";

type UserResponse = {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

type LoginResponse = UserResponse & {
  token: string;
  refreshToken: string;
};

const ACCESS_TOKEN_EXPIRATION_SECONDS = 60 * 60; // 1 hour
const REFRESH_TOKEN_EXPIRATION_MS = 60 * 24 * 60 * 60 * 1000; // 60 days

export async function handlerCreateUser(req: Request, res: Response) {
  type parameters = {
    email: string;
    password: string;
  };

  const params: parameters = req.body;

  if (!params.email || typeof params.email !== "string") {
    throw new BadRequestError("Email is required");
  }

  if (!params.password || typeof params.password !== "string") {
    throw new BadRequestError("Password is required");
  }

  const hashedPassword = await hashPassword(params.password);

  const user = await createUser({
    email: params.email,
    hashedPassword,
  });

  if (!user) {
    throw new BadRequestError("Something went wrong creating user");
  }

  const response: UserResponse = {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  res.header("Content-Type", "application/json");
  res.status(201).send(JSON.stringify(response));
}

export async function handlerLogin(req: Request, res: Response) {
  type parameters = {
    email: string;
    password: string;
  };

  const params: parameters = req.body;

  if (!params.email || typeof params.email !== "string") {
    throw new UnauthorizedError("incorrect email or password");
  }

  if (!params.password || typeof params.password !== "string") {
    throw new UnauthorizedError("incorrect email or password");
  }

  const user = await getUserByEmail(params.email);

  if (!user) {
    throw new UnauthorizedError("incorrect email or password");
  }

  const passwordMatches = await checkPasswordHash(
    params.password,
    user.hashedPassword,
  );

  if (!passwordMatches) {
    throw new UnauthorizedError("incorrect email or password");
  }

  const token = makeJWT(
    user.id,
    ACCESS_TOKEN_EXPIRATION_SECONDS,
    config.api.jwtSecret,
  );

  const refreshToken = makeRefreshToken();

  await saveRefreshToken({
    token: refreshToken,
    userId: user.id,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRATION_MS),
    revokedAt: null,
  });

  const response: LoginResponse = {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    token,
    refreshToken,
  };

  res.header("Content-Type", "application/json");
  res.status(200).send(JSON.stringify(response));
}