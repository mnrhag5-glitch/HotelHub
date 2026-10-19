const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const {sendVerificationEmail,sendPasswordResetEmail,} = require("../services/email.services");
const userModel = require("../model/user.model");

async function registerUser(req, res) {
  try {
const { name, email, password, phone } = req.body;

if (!name || !email || !password) {
  return res.status(400).json({
    message: "Name, email and password are required",
  });
}

const normalizedPhone = phone?.trim() || null;

if (
  normalizedPhone &&
  !/^\+?[0-9\s()-]{7,20}$/.test(normalizedPhone)
) {
  return res.status(400).json({
    message: "Please provide a valid phone number",
  });
}

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await userModel.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate random verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Store only token hash in database
    const verificationTokenHash = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    // Token expires after 1 hour
    const verificationTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);

 const user = await userModel.create({
  name: name.trim(),
  email: normalizedEmail,
  phone: normalizedPhone,
  password: hashedPassword,
  verificationTokenHash,
  verificationTokenExpiresAt,
});

    const verificationUrl = `http://localhost:5173/verify-email?token=${verificationToken}`;

    await sendVerificationEmail(user.email, verificationUrl);

    return res.status(201).json({
      message: "Account created. Please verify your email.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.log("Register error:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await userModel.findOne({
      email: normalizedEmail,
    });

    // Same response for wrong email/password
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!user.password) {
      return res.status(400).json({
        message: "This account uses Google login. Please continue with Google.",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Email verification required
    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in",
      });
    }

    const token = jwt.sign(
      {
        user_id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.log("Login error:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

async function logoutUser(req, res) {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      message: "Unable to logout",
    });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await userModel.findOne({
      email: normalizedEmail,
    });

    // Don't reveal whether email exists
    if (!user) {
      return res.status(200).json({
        message:
          "If an account exists with this email, a password reset email will be sent.",
      });
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Store only hash in database
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Token expires in 15 minutes
    user.resetPasswordTokenHash = resetTokenHash;
    user.resetPasswordTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;

    // Email service will be added in next step
    await sendPasswordResetEmail(user.email, resetUrl);
    return res.status(200).json({
      message:
        "If an account exists with this email, a password reset email will be sent.",
    });
  } catch (error) {
    console.log("Forgot password error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        message: "Token and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long",
      });
    }

    // Hash the token received from the user
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with matching token
    const user = await userModel.findOne({
      resetPasswordTokenHash: resetTokenHash,
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired password reset token",
      });
    }

    // Check token expiry
    if (
      !user.resetPasswordTokenExpiresAt ||
      user.resetPasswordTokenExpiresAt < new Date()
    ) {
      return res.status(400).json({
        message: "Invalid or expired password reset token",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    user.password = hashedPassword;

    // Invalidate reset token immediately
    user.resetPasswordTokenHash = null;
    user.resetPasswordTokenExpiresAt = null;

    await user.save();

    return res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (error) {
    console.log("Reset password error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

async function getMe(req, res) {
  try {
    const user = await userModel
      .findById(req.user.user_id)
      .select(
        "-password " +
          "-verificationTokenHash " +
          "-verificationTokenExpiresAt " +
          "-resetPasswordTokenHash " +
          "-resetPasswordTokenExpiresAt " +
          "-__v",
      )
      .lean();

    if (!user) {
      return res.status(404).json({
        message: "User account not found",
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      message: "Unable to fetch user profile",
    });
  }
}


async function updateProfile(req, res) {
  try {
    const { phone } = req.body;

    if (typeof phone !== "string" || !phone.trim()) {
      return res.status(400).json({
        message: "Phone number is required",
      });
    }

    const normalizedPhone = phone.trim();

    if (!/^\+?[0-9\s()-]{7,20}$/.test(normalizedPhone)) {
      return res.status(400).json({
        message: "Please provide a valid phone number",
      });
    }

    const user = await userModel.findById(req.user.user_id);

    if (!user) {
      return res.status(404).json({
        message: "User account not found",
      });
    }

    user.phone = normalizedPhone;
    await user.save();

    return res.status(200).json({
      message: "Phone number updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      message: "Unable to update phone number",
    });
  }
}



module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
};
