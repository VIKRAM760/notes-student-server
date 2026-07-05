import type { Response, NextFunction } from "express";
import type { AuthedRequest } from "./authMiddleware.js";

// requireAuth (which must run first) already verified the session against
// the correct collection and stamped req.auth.role, so this just checks it.
export async function requireAdmin(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.auth) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  if (req.auth.role !== "admin") {
    return res.status(403).json({ error: "Admin access required." });
  }

  next();
}
