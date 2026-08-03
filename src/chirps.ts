import { Request, Response } from "express";
import { BadRequestError } from "./errors.js";
import { createChirp } from "./db/chirps.js";

const profaneWords = ["kerfuffle", "sharbert", "fornax"];

function cleanBody(body: string): string {
  const words = body.split(" ");

  const cleanedWords = words.map((word) => {
    if (profaneWords.includes(word.toLowerCase())) {
      return "****";
    }
    return word;
  });

  return cleanedWords.join(" ");
}

type ChirpResponse = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  body: string;
  userId: string;
};

export async function handlerCreateChirp(req: Request, res: Response) {
  type parameters = {
    body: string;
    userId: string;
  };

  const params: parameters = req.body;

  if (!params.body || typeof params.body !== "string") {
    throw new BadRequestError("Something went wrong");
  }

  if (params.body.length > 140) {
    throw new BadRequestError("Chirp is too long. Max length is 140");
  }

  if (!params.userId || typeof params.userId !== "string") {
    throw new BadRequestError("userId is required");
  }

  const cleanedBody = cleanBody(params.body);

  const chirp = await createChirp({
    body: cleanedBody,
    userId: params.userId,
  });

  if (!chirp) {
    throw new BadRequestError("Something went wrong creating chirp");
  }

  const response: ChirpResponse = {
    id: chirp.id,
    createdAt: chirp.createdAt,
    updatedAt: chirp.updatedAt,
    body: chirp.body,
    userId: chirp.userId,
  };

  res.header("Content-Type", "application/json");
  res.status(201).send(JSON.stringify(response));
}