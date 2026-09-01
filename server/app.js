import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (sanitized)
app.use((req, res, next) => {
  if (req.originalUrl?.startsWith("/api")) {
    const timestamp = new Date().toISOString().slice(11, 19);
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  }
  next();
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true, status: "healthy", time: new Date().toISOString() });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// 404 handler for unknown /api routes
app.use("/api", (req, res) => {
  res.status(404).json({ ok: false, error: `Endpoint ${req.originalUrl} tidak ditemukan.` });
});

// Serve static frontend in production if dist directory exists
const DIST_DIR = path.resolve(process.cwd(), "dist");
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.originalUrl.startsWith("/api")) {
      return res.sendFile(path.join(DIST_DIR, "index.html"));
    }
    next();
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error("API Server Error:", err);
  res.status(500).json({ ok: false, error: err?.message || "Internal Server Error" });
});

export default app;
