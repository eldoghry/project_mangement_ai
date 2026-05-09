import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth";
import listsRoutes from "./routes/lists";
import tasksRoutes from "./routes/tasks";

const corsOptions = {
  origin: "*", // Use string "*" instead of ["*"]
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

export function createApp() {
  const app = express();

  // Handle preflight OPTIONS requests for all routes (Express 5 requires regex wildcard)
  app.options(/.*/, cors(corsOptions));
  app.use(cors(corsOptions));
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/lists", listsRoutes);
  app.use("/api/tasks", tasksRoutes);

  app.use(errorHandler);

  return app;
}
