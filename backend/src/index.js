import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import cron from "node-cron";
import { checkTaskExpiry, checkTaskReminders } from "./utils/taskExpiry.js";
import { config } from "./config/index.js";

// Import routes
import authRoutes from "./routes/auth.js";
import taskRoutes from "./routes/tasks.js";
import organizationRoutes from "./routes/organizations.js";

const app = express();

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5000",
      "https://beamish-sprite-716ffb.netlify.app",
      "https://multi-tenant-assignment.onrender.com",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Log all incoming requests (moved before API routes)
app.use((req, res, next) => {
  console.log(
    `INCOMING: ${req.method} ${req.originalUrl} - Body: ${JSON.stringify(req.body)} - Headers: ${JSON.stringify(req.headers)}`
  );
  next();
});

// Test route to verify middleware
app.get("/api/test-middleware", (req, res) => {
  res.json({
    message: "Middleware is working",
    headers: req.headers,
    url: req.url,
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/organizations", organizationRoutes);

// Error handling middleware (should be last)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Database connection
mongoose
  .connect(config.mongodbUri || "mongodb://localhost:27017/task-manager", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");

    // Schedule task expiry check (runs every hour)
    cron.schedule("0 * * * *", async () => {
      console.log("Running task expiry check...");
      await checkTaskExpiry();
    });

    // Schedule task reminder check (runs every hour)
    cron.schedule("30 * * * *", async () => {
      console.log("Running task reminder check...");
      await checkTaskReminders();
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Test routes
app.get("/", (req, res) => {
  res.json({
    message: "Multi-tenant Task Management API",
    version: "1.0.0",
    status: "healthy",
  });
});

app.get("/api/test", (req, res) => {
  res.json({ message: "API is working" });
});

app.post("/api/test", (req, res) => {
  res.json({ message: "POST is working", body: req.body });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});
