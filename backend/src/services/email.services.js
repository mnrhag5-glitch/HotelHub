const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendVerificationEmail(email, verificationUrl) {

    const { data, error } = await resend.emails.send({
        from: "HotelHub <onboarding@resend.dev>",
        to: [email],
        subject: "Verify your HotelHub account",
        html: `
            <h2>Welcome to HotelHub</h2>

            <p>Please verify your email address to activate your account.</p>

            <a href="${verificationUrl}">
                Verify Email
            </a>

            <p>This verification link will expire soon.</p>
        `
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

async function sendPasswordResetEmail(email, resetUrl) {

    const { data, error } = await resend.emails.send({
        from: "HotelHub <onboarding@resend.dev>",
        to: [email],
        subject: "Reset your HotelHub password",
        html: `
            <h2>Password Reset</h2>

            <p>We received a request to reset your HotelHub password.</p>

            <p>
                Click the button below to create a new password.
            </p>

            <a href="${resetUrl}">
                Reset Password
            </a>

            <p>
                This password reset link will expire in 15 minutes.
            </p>

            <p>
                If you did not request this, you can safely ignore this email.
            </p>
        `
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}


module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail
};