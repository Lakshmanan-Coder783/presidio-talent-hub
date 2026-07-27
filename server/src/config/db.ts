import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDB(): Promise<void> {
  mongoose.connection.on("connected", () => {
    console.log("[db] connected to MongoDB");
  });
  mongoose.connection.on("error", (err) => {
    console.error("[db] connection error:", err);
  });
  mongoose.connection.on("disconnected", () => {
    console.warn("[db] disconnected from MongoDB");
  });

  await mongoose.connect(env.MONGODB_URI);
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
