const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL
);

function generateGoogleState() {
  return crypto.randomBytes(32).toString("hex");
}

function getGoogleAuthUrl(state) {
  return googleClient.generateAuthUrl({
    access_type: "offline",
    scope: [
      "openid",
      "profile",
      "email",
    ],
    state,
    prompt: "select_account",
  });
}

async function verifyGoogleCode(code) {
  const { tokens } = await googleClient.getToken(code);

  if (!tokens.id_token) {
    throw new Error("Google ID token not received");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload) {
    throw new Error("Invalid Google ID token");
  }

  if (!payload.email || !payload.email_verified) {
    throw new Error("Google email is not verified");
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name || "Google User",
    profileImage: payload.picture || null,
  };
}

module.exports = {
  generateGoogleState,
  getGoogleAuthUrl,
  verifyGoogleCode,
};