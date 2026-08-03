import { Request, Response } from "express";
import {
  createChirp,
  deleteChirp,
  getAllChirps,
  getChirpById,
  getChirpsByAuthorId,
} from "./db/queries/chirps.js";
import { getBearerToken, validateJWT } from "./auth.js";
import { config } from "./config.js";
import { BadRequestError, ForbiddenError, NotFoundError } from "./errors.js";

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
  };

  const token = getBearerToken(req);
  const userId = validateJWT(token, config.api.jwtSecret);

  const params: parameters = req.body;

  if (!params.body || typeof params.body !== "string") {
    throw new BadRequestError("Something went wrong");
  }

  if (params.body.length > 140) {
    throw new BadRequestError("Chirp is too long. Max length is 140");
  }

  const cleanedBody = cleanBody(params.body);

  const chirp = await createChirp({
    body: cleanedBody,
    userId,
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

export async function handlerGetAllChirps(req: Request, res: Response) {
  let authorId = "";
  const authorIdQuery = req.query.authorId;

  if (typeof authorIdQuery === "string") {
    authorId = authorIdQuery;
  }

  const sortOrder = req.query.sort === "desc" ? "desc" : "asc";

  const chirps = authorId
    ? await getChirpsByAuthorId(authorId)
    : await getAllChirps();

  if (sortOrder === "desc") {
    chirps.reverse();
  }

  const response: ChirpResponse[] = chirps.map((chirp) => ({
    id: chirp.id,
    createdAt: chirp.createdAt,
    updatedAt: chirp.updatedAt,
    body: chirp.body,
    userId: chirp.userId,
  }));

  res.header("Content-Type", "application/json");
  res.status(200).send(JSON.stringify(response));
}

export async function handlerGetChirp(req: Request, res: Response) {
  const chirpId = req.params.chirpId as string;

  const chirp = await getChirpById(chirpId);

  if (!chirp) {
    throw new NotFoundError("Chirp not found");
  }

  const response: ChirpResponse = {
    id: chirp.id,
    createdAt: chirp.createdAt,
    updatedAt: chirp.updatedAt,
    body: chirp.body,
    userId: chirp.userId,
  };

  res.header("Content-Type", "application/json");
  res.status(200).send(JSON.stringify(response));
}

export async function handlerDeleteChirp(req: Request, res: Response) {
  const token = getBearerToken(req);
  const userId = validateJWT(token, config.api.jwtSecret);

  const chirpId = req.params.chirpId as string;
  const chirp = await getChirpById(chirpId);

  if (!chirp) {
    throw new NotFoundError("Chirp not found");
  }

  if (chirp.userId !== userId) {
    throw new ForbiddenError("You are not the author of this chirp");
  }

  await deleteChirp(chirpId);

  res.sendStatus(204);
}