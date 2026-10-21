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



async function sendBookingAdminEmail({
    adminEmail,
    hotelName,
    bookingId,
    guestName,
    guestEmail,
    roomName,
    checkIn,
    checkOut,
    totalAmount,
}) {
    if (!adminEmail) {
        throw new Error("Hotel owner email is missing");
    }

    const escapeHtml = (value) =>
        String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");

    const formatDate = (date) =>
        new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            timeZone: "Asia/Kolkata",
        });

    const { data, error } = await resend.emails.send({
        from: "HotelHub <onboarding@resend.dev>",
        to: ["mnrhag5@gmail.com"],
        subject: `New confirmed booking - ${hotelName}`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#222">
                <h2 style="color:#163b35">HotelHub — New Booking</h2>
                <p>A new booking has been successfully paid for and confirmed.</p>
                <hr />
                <p><strong>Hotel:</strong> ${escapeHtml(hotelName)}</p>
                <p><strong>Booking ID:</strong> ${escapeHtml(bookingId)}</p>
                <p><strong>Guest:</strong> ${escapeHtml(guestName)}</p>
                <p><strong>Guest email:</strong> ${escapeHtml(guestEmail || "Not provided")}</p>
                <p><strong>Room:</strong> ${escapeHtml(roomName)}</p>
                <p><strong>Check-in:</strong> ${formatDate(checkIn)}</p>
                <p><strong>Check-out:</strong> ${formatDate(checkOut)}</p>
                <p><strong>Amount paid:</strong> INR ${Number(totalAmount).toLocaleString("en-IN")}</p>
                <p><strong>Payment status:</strong> PAID</p>
            </div>
        `,
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendBookingAdminEmail
};