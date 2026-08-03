import { Request, Response } from "express";
import { BadRequestError } from "./errors.js";
import { createUser } from "./db/queries/user.js";

type UserResponse = {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function handlerCreateUser(req: Request, res: Response) {
  type parameters = {
    email: string;
  };

  const params: parameters = req.body;

  if (!params.email || typeof params.email !== "string") {
    throw new BadRequestError("Email is required");
  }

  const user = await createUser({ email: params.email });

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


