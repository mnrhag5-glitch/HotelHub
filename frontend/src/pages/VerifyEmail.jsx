
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("Verifying your email...");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("Verification link is invalid.");
      return;
    }

    const verify = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/users/verify-email?token=${encodeURIComponent(token)}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Email verification failed.");
        }

        setStatus("Email verified successfully! You can now log in.");
      } catch (error) {
        setStatus(error.message || "Something went wrong.");
      }
    };

    verify();
  }, [searchParams]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-2xl font-bold">Email Verification</h1>
      <p className="text-center">{status}</p>
      <Link to="/login" className="text-blue-600 underline">
        Go to Login
      </Link>
    </main>
  );
}
