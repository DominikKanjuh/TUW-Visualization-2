import cors from "cors";
import dotenv from "dotenv";
import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import stiplesRouter from "./routes/stiples";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", stiplesRouter);

// Basic error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke!" });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
