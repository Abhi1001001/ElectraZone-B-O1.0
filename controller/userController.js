import { User } from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { verifyEmail } from "../emailVerify/verifyEmail.js";
import { Session } from "../models/sessionModel.js";
import { sendOTPEmail } from "../emailVerify/sendOTPMail.js";
import cloudinary from "../utills/cloudinary.js";
export const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }
    const user = await User.findOne({ email });
    if (user) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "10m",
    });
    verifyEmail(token, email); //sending email
    newUser.token = token;

    await newUser.save();
    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user: newUser,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const verify = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(400).json({
        success: false,
        message: "Authorization token in missing or invalid",
      });
    }
    const token = authHeader.split(" ")[1]; //['Bearer', 'token']
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res
          .status(400)
          .json({ success: false, message: "Token expired" });
      }
      return res.status(400).json({ success: false, message: "Invalid token" });
    }

    const user = await User.findOne({ _id: decoded.id });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }
    user.token = null;
    user.isVerified = true;
    await user.save();
    return res.status(200).json({ success: true, message: "User verified" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const reVerify = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "10m",
    });
    verifyEmail(token, email); //sending email
    user.token = token;
    await user.save();
    return res.status(200).json({
      success: true,
      message: "Email sent again successfully",
      token: user.token,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }
    const exitingUser = await User.findOne({ email });

    if (!exitingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }
    const isPasswordCorrect = await bcrypt.compare(password, exitingUser.password);
    console.log(isPasswordCorrect);
    
    if (!isPasswordCorrect) {
      return res
        .status(400)
        .json({ success: false, message: "Incorrect password" });
    }
    if (!exitingUser.isVerified) {
      return res
        .status(400)
        .json({ success: false, message: "User not verified" });
    }
    // genrate token
    const accessToken = jwt.sign(
      { id: exitingUser._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "10d",
      },
    );
    const refreshToken = jwt.sign(
      { id: exitingUser._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      },
    );
    exitingUser.isLoggedIn = true;
    await exitingUser.save();

    // check for exiting session and delete it
    const exitingSession = await Session.findOne({ userId: exitingUser._id });
    if (exitingSession) {
      await Session.deleteOne({ userId: exitingUser._id });
    }

    // create session
    await Session.create({ userId: exitingUser._id });
    return res.status(200).json({
      success: true,
      message: `Welcome back ${exitingUser.firstName}`,
      accessToken,
      refreshToken,
      user: exitingUser,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const userId = req.id;
    await Session.deleteMany({ userId });
    await User.findOneAndUpdate({ _id: userId }, { isLoggedIn: false });
    return res
      .status(200)
      .json({ success: true, message: "User logged out successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpire = new Date(Date.now() + 15 * 60 * 1000); //15 minutes

    user.otp = otp;
    user.otpExpire = otpExpire;

    await user.save();
    await sendOTPEmail(otp, email);
    return res
      .status(200)
      .json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    const email = req.params.email;
    if (!otp) {
      return res
        .status(400)
        .json({ success: false, message: "OTP is required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }
    if (!otp || !user.otpExpire) {
      return res.status(400).json({
        success: false,
        message: "Otp is not genrated or already verified",
      });
    }
    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }
    if (otp !== user.otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }
    user.otp = null;
    user.otpExpire = null;
    await user.save();
    return res
      .status(200)
      .json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    const { email } = req.params;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }
    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password is required",
      });
    }
    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match" });
    }
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    return res
      .status(200)
      .json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const allUser = async (req, res) => {
  try {
    const users = await User.find({});
    return res.status(200).json({ success: true, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params; //extact userId from params
    const user = await User.findById(userId).select(
      "-password -otp -otpExpire -token",
    ); //exclude password, otp, otpExpire, token from response
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const userIdToUpdate = req.params.id;
    console.log("userIdToUpdate", userIdToUpdate);
    const loggedInUser = req.user;
    console.log(loggedInUser._id.toString());

    const { firstName, lastName, address, city, zipCode, phoneNo, role } =
      req.body;
    if (
      loggedInUser._id.toString() !== userIdToUpdate &&
      loggedInUser.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "you are not allowed to update this user",
      });
    }
    let user = await User.findById(userIdToUpdate);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    let profilePicUrl = user.profilePic;
    let profilePicPublicId = user.profilePicPublicId;

    if (req.file) {
      if (profilePicPublicId) {
        await cloudinary.uploader.destroy(profilePicPublicId);
      }
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "profilePic",
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          },
        );
        stream.end(req.file.buffer);
      });
      profilePicUrl = uploadResult.secure_url;
      profilePicPublicId = uploadResult.public_id;
    }
    // update fields
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.address = address || user.address;
    user.city = city || user.city;
    user.zipCode = zipCode || user.zipCode;
    user.phoneNo = phoneNo || user.phoneNo;
    user.role = role;
    user.profilePic = profilePicUrl;
    user.profilePicPublicId = profilePicPublicId;

    const updatedUser = await user.save();
    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
