import type { Response, NextFunction } from "express";
import User from "../models/users.js";
import type { AuthedRequest } from "./authMiddleware.js";

export async function requireAdmin(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.auth) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  const user = await User.findOne({ userId: req.auth.userId });

  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required." });
  }

  next();
}
