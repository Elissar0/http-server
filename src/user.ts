import { Request, Response } from "express";
import { hashPassword, checkPasswordHash } from "./auth.js";
import { BadRequestError, UnauthorizedError } from "./errors.js";
import { createUser, getUserByEmail } from "./db/queries/user.js";

type UserResponse = {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

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

  const response: UserResponse = {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  res.header("Content-Type", "application/json");
  res.status(200).send(JSON.stringify(response));
}