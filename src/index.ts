import { Request, Response, NextFunction } from "express";
import { handlerReadiness } from "./health.js";
import { handlerMetrics, handlerReset } from "./metrics.js";
import {
  handlerCreateChirp,
  handlerDeleteChirp,
  handlerGetAllChirps,
  handlerGetChirp,
} from "./chirps.js";
import { handlerRefresh, handlerRevoke } from "./refreshTokens.js";
import { middlewareLogResponses, middlewareMetricsInc } from "./middleware.js";
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from "./errors.js";
import express from "express";
import { handlerCreateUser, handlerLogin, handlerUpdateUser } from "./user.js";

const app = express();
const PORT = 8080;

app.use(express.json());
app.use(middlewareLogResponses);
app.use("/app", middlewareMetricsInc);
app.use("/app", express.static("./src/app"));
app.get("/api/healthz", handlerReadiness);
app.get("/admin/metrics", handlerMetrics);
app.post("/admin/reset", handlerReset);
app.post("/api/chirps", handlerCreateChirp);
app.get("/api/chirps", handlerGetAllChirps);
app.get("/api/chirps/:chirpId", handlerGetChirp);
app.post("/api/users", handlerCreateUser);
app.post("/api/login", handlerLogin);
app.post("/api/refresh", handlerRefresh);
app.post("/api/revoke", handlerRevoke);
app.put("/api/users", handlerUpdateUser);
app.delete("/api/chirps/:chirpId", handlerDeleteChirp);

function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  let statusCode = 500;
  let message = "Something went wrong on our end";

  if (err instanceof BadRequestError) {
    statusCode = 400;
    message = err.message;
  } else if (err instanceof UnauthorizedError) {
    statusCode = 401;
    message = err.message;
  } else if (err instanceof ForbiddenError) {
    statusCode = 403;
    message = err.message;
  } else if (err instanceof NotFoundError) {
    statusCode = 404;
    message = err.message;
  } else {
    console.log(err.message);
  }

  res.status(statusCode).json({ error: message });
}

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});