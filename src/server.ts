import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import { connectDB } from "./db.js";
import { seedUsers } from "./seed.js";

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get('/',(_req,res)=>{
  res.json('Connected to server')
})

app.use("/api/auth", authRoutes);

async function startServer() {
  await connectDB();

  // Insert users only if collection is empty
  await seedUsers();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}
startServer();
export default app;