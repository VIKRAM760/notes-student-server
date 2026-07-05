import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/users.js";
import { courses, getCourseById } from "../courses.js";
import {
  requireAuth,
  type AuthedRequest,
} from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";

const router = Router();

// every route below requires a logged-in admin
router.use(requireAuth, requireAdmin);

/**
 * GET /api/admin/courses
 */
router.get("/courses", (_req, res) => {
  res.json({
    courses: courses.map((c) => ({ id: c.id, name: c.name, topics: c.topics })),
  });
});

/**
 * GET /api/admin/students
 */
router.get("/students", async (_req, res) => {
  try {
    const students = await User.find({ role: "student" });

    return res.json({
      students: students.map((u) => {
        const course = u.courseId ? getCourseById(u.courseId) : undefined;
        const sessionActive = Boolean(
          u.activeSessionId &&
            u.sessionExpiresAt &&
            u.sessionExpiresAt > Date.now()
        );

        return {
          userId: u.userId,
          name: u.name,
          email: u.email,
          courseId: u.courseId,
          courseName: course?.name || u.courseId,
          sessionActive,
        };
      }),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * POST /api/admin/students
 */
router.post("/students", async (req, res) => {
  try {
    const { userId, name, email, password, courseId } = req.body ?? {};

    if (!userId || !name || !email || !password || !courseId) {
      return res.status(400).json({
        error: "userId, name, email, password, and courseId are all required.",
      });
    }

    if (String(password).length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters." });
    }

    if (!getCourseById(String(courseId))) {
      return res.status(400).json({ error: `Unknown courseId "${courseId}".` });
    }

    const existingId = await User.findOne({ userId: String(userId).trim() });
    if (existingId) {
      return res
        .status(409)
        .json({ error: `User ID "${userId}" is already taken.` });
    }

    const existingEmail = await User.findOne({ email: String(email).trim() });
    if (existingEmail) {
      return res
        .status(409)
        .json({ error: `Email "${email}" is already registered.` });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    const student = await User.create({
      userId: String(userId).trim(),
      name: String(name).trim(),
      email: String(email).trim(),
      passwordHash,
      role: "student",
      courseId: String(courseId),
      activeSessionId: null,
      sessionExpiresAt: null,
      resetTokenHash: null,
      resetTokenExpiresAt: null,
    });

    const course = getCourseById(student.courseId!);

    return res.status(201).json({
      student: {
        userId: student.userId,
        name: student.name,
        email: student.email,
        courseId: student.courseId,
        courseName: course?.name,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * DELETE /api/admin/students/:userId
 */
router.delete(
  "/students/:userId",
  async (req: AuthedRequest, res) => {
    try {
      const { userId } = req.params;

      if (userId.toLowerCase() === req.auth?.userId.toLowerCase()) {
        return res
          .status(400)
          .json({ error: "You can't delete your own admin account here." });
      }

      const target = await User.findOne({ userId });
      if (!target || target.role !== "student") {
        return res.status(404).json({ error: "Student not found." });
      }

      await User.deleteOne({ userId });
      return res.json({ ok: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error." });
    }
  }
);

export default router;
