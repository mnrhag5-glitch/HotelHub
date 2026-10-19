const express = require("express")
const {registerUser,loginUser, logoutUser,forgotPassword,resetPassword,getMe,updateProfile,} = require("../controllers/user.controller")
const {verifyEmail,resendVerificationEmail} = require("../controllers/verification.controller");
const {authRateLimiter} = require("../middleware/rate-limit.middleware");
const {authMiddleware} = require("../middleware/auth.middleware");


const router = express.Router()


router.post("/register" ,authRateLimiter, registerUser)
router.get("/verify-email" , verifyEmail)
router.post("/login" , authRateLimiter, loginUser)
router.post("/logout" , logoutUser)
router.post("/resend-verification-email" , authRateLimiter, resendVerificationEmail)
router.post( "/forgot-password", authRateLimiter,forgotPassword);
router.post("/reset-password", authRateLimiter, resetPassword);
router.get("/me", authMiddleware, getMe);
router.patch("/profile", authMiddleware, updateProfile);

module.exports = router