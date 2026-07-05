import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { connectDB } from "./db.js";
import { seedUsers } from "./seed.js";

const app = express();

// CLIENT_ORIGIN can be a single origin or a comma-separated list, e.g.
// "http://localhost:5173,https://student.reactdevacademy.com"
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow tools with no Origin header (curl, health checks, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`[cors] blocked request from origin: ${origin}`);
        callback(new Error(`Origin ${origin} is not allowed by CORS`));
      }
    },
  })
);
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Server Running 🚀");
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

const PORT = Number(process.env.PORT || 4000);

async function start() {
  try {
    await connectDB();
    await seedUsers();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on ${PORT}`);
      console.log(`Allowed origins: ${allowedOrigins.join(", ")}`);
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

start();