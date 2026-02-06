import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";

export const isAuthenticated = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Authorization token in missing or invalid",
        });
    }
    const token = authHeader.split(" ")[1]; //['Bearer', 'token']
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name) {
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
    req.id = user._id;
    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


export const isAdmin = async (req, res, next) => {
  try {
    if (req.user && req.user.role == "admin") {
      next();
    }
    else{
      return res
        .status(400)
        .json({ success: false, message: "Acess denied : Only admin can access" });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};