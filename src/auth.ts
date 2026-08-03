import argon2 from "argon2";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import type { Request } from "express";
import { randomBytes } from "crypto";
import { UnauthorizedError } from "./errors.js";

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

export async function checkPasswordHash(
  password: string,
  hash: string,
): Promise<boolean> {
  return argon2.verify(hash, password);
}

type payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;

export function makeJWT(
  userID: string,
  expiresIn: number,
  secret: string,
): string {
  const issuedAt = Math.floor(Date.now() / 1000);

  const payload: payload = {
    iss: "chirpy",
    sub: userID,
    iat: issuedAt,
    exp: issuedAt + expiresIn,
  };

  return jwt.sign(payload, secret);
}

export function validateJWT(tokenString: string, secret: string): string {
  let decoded: payload;

  try {
    decoded = jwt.verify(tokenString, secret) as JwtPayload;
  } catch (error) {
    throw new UnauthorizedError("Invalid token");
  }

  if (!decoded.sub) {
    throw new UnauthorizedError("Invalid token");
  }

  return decoded.sub;
}

export function getBearerToken(req: Request): string {
  const authHeader = req.get("Authorization");

  if (!authHeader) {
    throw new UnauthorizedError("Malformed authorization header");
  }

  const token = authHeader.replace("Bearer", "").trim();

  if (!token) {
    throw new UnauthorizedError("Malformed authorization header");
  }

  return token;
}

export function makeRefreshToken(): string {
  return randomBytes(32).toString("hex");
}