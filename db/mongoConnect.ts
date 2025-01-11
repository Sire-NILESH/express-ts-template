import mongoose from "mongoose";

export const mongoConnect = async () => {
  try {
    const uri = process.env
      .MONGO_URI!.replace("<USERNAME>", process.env.MONGO_USERNAME!)
      .replace("<PASSWORD>", process.env.MONGO_PASSWORD!);

    await mongoose.connect(uri);
    console.log("MongoDB connection established...");
  } catch (error) {
    console.error(error);
    throw new Error("📡 Could not connect to Mongo Server");
  }
};
