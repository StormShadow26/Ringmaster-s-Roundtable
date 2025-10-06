import mongoose from "mongoose";

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
    // Virtual reference to chat histories (not stored in database)
    // chatHistories will be populated via virtual populate
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }, // Include virtuals when converting to JSON
    toObject: { virtuals: true },
  }
);

// Virtual populate for chat histories
userSchema.virtual('chatHistories', {
  ref: 'ChatHistory',
  localField: '_id',
  foreignField: 'userId',
  options: { 
    sort: { lastActivityAt: -1 },
    limit: 50 // Limit to recent 50 chats
  }
});

const User = mongoose.model("User", userSchema);

export default User;
