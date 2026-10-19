const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const userModel = require("../model/user.model");

const {generateGoogleState,getGoogleAuthUrl,verifyGoogleCode,} = require("../services/google-auth.service");


function generateJwtToken(user) {
  return jwt.sign(
    {
      user_id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}


// Start Google OAuth
function googleLogin(req, res) {
  try {
    const state = generateGoogleState();

    const googleAuthUrl = getGoogleAuthUrl(state);

    res.cookie("google_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
     sameSite: "none",
      path: "/",
      maxAge: 10 * 60 * 1000,
    });

    return res.redirect(googleAuthUrl);
  } catch (error) {
    console.error("Google login error:", error);

    return res.status(500).json({
      message: "Unable to start Google login",
    });
  }
}


// Google OAuth callback
async function googleCallback(req, res) {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({
        message: "Google authentication data is missing",
      });
    }

    const savedState = req.cookies.google_oauth_state;

    if (!savedState) {
      return res.status(400).json({
        message: "Google authentication session expired",
      });
    }

    const stateMatch =
      savedState.length === state.length &&
      crypto.timingSafeEqual(
        Buffer.from(savedState),
        Buffer.from(state)
      );

    res.clearCookie("google_oauth_state");

    if (!stateMatch) {
      return res.status(400).json({
        message: "Invalid Google authentication state",
      });
    }

    const googleUser = await verifyGoogleCode(code);

    let user = await userModel.findOne({
      email: googleUser.email,
    });

    // Existing account
    if (user) {

      // Existing Google account
      if (user.authProvider === "google") {

        if (user.googleId !== googleUser.googleId) {
          return res.status(409).json({
            message: "Google account does not match this user",
          });
        }

      } else {

        // Link existing local account with verified Google account
  user.authProvider = "google";
  user.googleId = googleUser.googleId;
  user.profileImage = googleUser.profileImage;
  user.isVerified = true;

  await user.save();
      }

    } else {

      // Create new Google account
      user = await userModel.create({
        name: googleUser.name,
        email: googleUser.email,
        password: null,
        authProvider: "google",
        googleId: googleUser.googleId,
        profileImage: googleUser.profileImage,
        isVerified: true,
        role: "user",
      });
    }

    const token = generateJwtToken(user);

res.cookie("token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "none",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

const frontendUrl =
  process.env.FRONTEND_URL || "http://localhost:5173";

return res.redirect(`${frontendUrl}/`);

  } catch (error) {
    console.error("Google callback error:", error);

    return res.status(500).json({
      message: "Google authentication failed",
    });
  }
}


module.exports = {
  googleLogin,
  googleCallback,
};