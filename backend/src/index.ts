/**
 * @fileoverview Main entry point for the backend server application.
 * @module backend/index
 */

import cors from "cors";
import dotenv from "dotenv";
import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import stiplesRouter from "./routes/stiples";

/**
 * Load environment variables from .env file
 */
dotenv.config();

/**
 * Express application instance
 * @type {Express}
 */
const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware
/**
 * Enable CORS for all routes
 * Enable JSON parsing for request bodies
 */
app.use(cors());
app.use(express.json());

/**
 * Mount the stipples router at /api
 */
app.use("/api", stiplesRouter);

/**
 * Global error handler middleware
 * @param {Error} err - The error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke!" });
});

/**
 * Start the server
 * @listens {number} port - The port number to listen on
 */
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
