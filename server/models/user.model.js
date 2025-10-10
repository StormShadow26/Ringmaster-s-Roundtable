import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  public_id: { type: String, required: true },
});


const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.isGoogleUser;
      },
    },
    googleId: {
      type: String,
      default: null,
    },
    isGoogleUser: {
      type: Boolean,
      default: false,
    },
    jwtToken: {
      type: String,
      default: null,
    },
    // 👇 Images stored for each user
    images: [imageSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual populate for chat histories
userSchema.virtual("chatHistories", {
  ref: "ChatHistory",
  localField: "_id",
  foreignField: "userId",
  options: {
    sort: { lastActivityAt: -1 },
    limit: 50,
  },
});

const User = mongoose.model("User", userSchema);
export default User;
