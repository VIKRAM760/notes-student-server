import User from "./models/users.js";

export async function seedUsers() {
  const count = await User.countDocuments();

  if (count > 0) {
    console.log("✅ Users already exist. Skipping seed.");
    return;
  }

  await User.insertMany([
    {
      userId: "admin",
      name: "Course Admin",
      email: "admin@example.com",
      // Admin@123 — change this after first login in production.
      passwordHash:
        "$2a$10$8WFXEtvrXfkLZF8zutgwpuY785rMQaV7.7bz68XZHeVOX9Pcr4gy6",
      role: "admin",
      courseId: null,
      activeSessionId: null,
      sessionExpiresAt: null,
      resetTokenHash: null,
      resetTokenExpiresAt: null,
    },
    {
      userId: "rahul12",
      name: "rahul (Frontend)",
      email: "user1@example.com",
      passwordHash:
        "$2a$10$g.dQBYocpniuG/JyPdbtSOpk7mV5yC6LmfRn7B3Hw3WhNFDQ8nXbK",
      role: "student",
      courseId: "frontend-development",
      activeSessionId: null,
      sessionExpiresAt: null,
      resetTokenHash: null,
      resetTokenExpiresAt: null,
    },
    {
      userId: "anjali",
      name: "anjali (Backend)",
      email: "user2@example.com",
      passwordHash:
        "$2a$10$vi6tL809IBRYStXZXsUUTuvXD8I8kW5zsasbE02dCB5JgRBexIoOK",
      role: "student",
      courseId: "backend-development",
      activeSessionId: null,
      sessionExpiresAt: null,
      resetTokenHash: null,
      resetTokenExpiresAt: null,
    },
    {
      userId: "user3",
      name: "Noah (Tools)",
      email: "user3@example.com",
      passwordHash:
        "$2a$10$2DneH5dSB4z84ZJx62Vl8efKRMYO6WQn28noBaAPheTPNFQtKskBa",
      role: "student",
      courseId: "tools-devops",
      activeSessionId: null,
      sessionExpiresAt: null,
      resetTokenHash: null,
      resetTokenExpiresAt: null,
    },
    {
      userId: "vikram",
      name: "vikram (Full-Stack)",
      email: "vikrambhosale219@gmail.com",
      passwordHash:
        "$2a$10$yiuvBpHVeufDjL0PCGNSSuhi8H2V95.V.AWNZjyqZPixeREDD7.pC",
      role: "student",
      courseId: "fullstack-development",
      activeSessionId: null,
      sessionExpiresAt: null,
      resetTokenHash: null,
      resetTokenExpiresAt: null,
    },
  ]);

  console.log("✅ Initial users inserted into MongoDB");
}