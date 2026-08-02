import { Request, Response } from "express";
import { BadRequestError } from "./errors.js";

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

export async function handlerValidateChirp(req: Request, res: Response) {
  type parameters = {
    body: string;
  };

  const params: parameters = req.body;

  if (!params.body || typeof params.body !== "string") {
    throw new BadRequestError("Something went wrong");
  }

  if (params.body.length > 140) {
    throw new BadRequestError("Chirp is too long. Max length is 140");
  }

  const cleanedBody = cleanBody(params.body);

  res.header("Content-Type", "application/json");
  res.status(200).send(JSON.stringify({ cleanedBody }));
}