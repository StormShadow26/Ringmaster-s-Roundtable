import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connect = () => {
  mongoose
    .connect(process.env.MONGODB_URL)
    .then(() => console.log("✅ DB connected Successfully"))
    .catch((error) => {
      console.error("❌ DB connection failed", error);
      process.exit(1);
    });
};

export default { connect };
