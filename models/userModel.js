import mongoose from "mongoose";

const userSchema = mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    profilePic: {
      type: String,
      default: "", //cloudinary image url
    },
    profilePicPublicId: {
      type: String,
      default: "", //cloudinary public_id for deletion
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    token: {
      type: String,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isLoggedIn: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpire: {
      type: Date,
      default: null,
    },
    address: {
      type: String,
    },
    city: {
      type: String,
    },
    zipcode: {
      type: String,
    },
    phoneNo: {
      type: String,
    },
  },
  {
    timestamps: true, //getting createdAt and updatedAt
  }
);

export const User = mongoose.model("User", userSchema);
