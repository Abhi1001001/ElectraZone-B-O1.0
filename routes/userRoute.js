import express from "express";
import { allUser, changePassword, forgotPassword, getUserById, login, logout, registerUser, reVerify, updateUser, verify, verifyOTP } from "../controller/userController.js";
import { isAdmin, isAuthenticated } from "../middleware/isAuthenticated.js";
import { singleUpload } from "../middleware/multer.js";



const  router = express.Router();
router.post("/register", registerUser);
router.post("/verify", verify);
router.post("/reverify", reVerify);
router.post("/login", login);
router.post("/logout",isAuthenticated, logout);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp/:email", verifyOTP);
router.post("/change-password/:email", changePassword);
router.get("/all-users", isAuthenticated, isAdmin, allUser);
router.get("/get-user/:userId", getUserById);
router.put("/update/:id", isAuthenticated, singleUpload, updateUser);


export default router;