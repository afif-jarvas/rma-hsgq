import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import rmaRoutes from "./routes/rmaRoutes.js";
import waRoutes from "./routes/waRoutes.js";
import pcbaRoutes from "./routes/pcbaRoutes.js";
import masterRoutes from "./routes/masterRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const app = express();

// Middleware with 50mb limit for bulk imports & photo uploads
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Request logging (sanitized)
app.use((req, res, next) => {
  if (req.originalUrl?.startsWith("/api")) {
    const timestamp = new Date().toISOString().slice(11, 19);
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  }
  next();
});

// Serve uploaded photos statically
app.use("/uploads", express.static(UPLOADS_DIR));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true, status: "healthy", database: "sqlite", time: new Date().toISOString() });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rma", rmaRoutes);
app.use("/api/wa", waRoutes);
app.use("/api/pcba", pcbaRoutes);
app.use("/api/master", masterRoutes);
app.use("/api/upload", uploadRoutes);

// 404 handler for unknown /api routes
app.use("/api", (req, res) => {
  res.status(404).json({ ok: false, error: `Endpoint ${req.originalUrl} tidak ditemukan.` });
});

// Serve static frontend in production if dist directory exists
const DIST_DIR = path.resolve(process.cwd(), "dist");
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.originalUrl.startsWith("/api") && !req.originalUrl.startsWith("/uploads")) {
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
