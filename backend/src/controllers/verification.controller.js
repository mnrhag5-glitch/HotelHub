const crypto = require("crypto");

const userModel = require("../model/user.model");
const { sendVerificationEmail } = require("../services/email.services");

async function verifyEmail(req, res) {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({
                message: "Verification token is required"
            });
        }

        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const user = await userModel.findOne({
            verificationTokenHash: tokenHash
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid verification link"
            });
        }

        if (
            !user.verificationTokenExpiresAt ||
            user.verificationTokenExpiresAt < new Date()
        ) {
            return res.status(400).json({
                message: "Verification link has expired"
            });
        }

        user.isVerified = true;
        user.verificationTokenHash = null;
        user.verificationTokenExpiresAt = null;

        await user.save();

        return res.status(200).json({
            message: "Email verified successfully"
        });

    } catch (error) {
        console.log("Email verification error:", error.message);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

async function resendVerificationEmail(req, res) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const user = await userModel.findOne({
            email: normalizedEmail
        });

        // Don't reveal whether an email exists
        if (!user) {
            return res.status(200).json({
                message: "If this email is registered, a verification email will be sent."
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                message: "Email is already verified"
            });
        }

        const verificationToken = crypto
            .randomBytes(32)
            .toString("hex");

        const verificationTokenHash = crypto
            .createHash("sha256")
            .update(verificationToken)
            .digest("hex");

        const verificationTokenExpiresAt = new Date(
            Date.now() + 60 * 60 * 1000
        );

        user.verificationTokenHash = verificationTokenHash;
        user.verificationTokenExpiresAt = verificationTokenExpiresAt;

        await user.save();

        const verificationUrl =
            `http://localhost:5173/verify-email?token=${verificationToken}`;

        await sendVerificationEmail(
            user.email,
            verificationUrl
        );

        return res.status(200).json({
            message: "If this email is registered, a verification email will be sent."
        });

    } catch (error) {
        console.log(
            "Resend verification error:",
            error.message
        );

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

module.exports = {
    verifyEmail,
    resendVerificationEmail
};