import mongoose from "mongoose";

const MONGODB_URI = 'mongodb+srv://bhosalevikram760_db_user:Y3noR99iHv2HmrSf@reactdev-academy.72qlfvs.mongodb.net/';

export async function connectDB(): Promise<void> {
  try {
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in .env");
    }

    await mongoose.connect(MONGODB_URI);

    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed");
    console.error(error);
    process.exit(1);
  }
}