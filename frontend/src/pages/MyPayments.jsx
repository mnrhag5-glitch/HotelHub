
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { apiRequest } from "../api/client";

export default function MyPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState("");
  const [payingBookingId, setPayingBookingId] = useState("");
const [paymentMessage, setPaymentMessage] = useState("");


async function fetchPayments() {
  const data = await apiRequest("/api/payments/my-payments");
  setPayments(Array.isArray(data) ? data : data.payments || []);
}

useEffect(() => {
  async function loadPayments() {
    try {
      await fetchPayments();
    } catch (err) {
      setError(err.message || "Unable to load payment history.");
    } finally {
      setLoading(false);
    }
  }

  loadPayments();
}, []);




async function handlePayment(booking) {
  if (!window.Razorpay) {
    setPaymentMessage(
      "Razorpay Checkout load nahi hua. Page refresh karke dobara try karo."
    );
    return;
  }

  setPayingBookingId(booking._id);
  setPaymentMessage("");
  setError("");

  try {
    const orderData = await apiRequest("/api/payments/create-order", {
      method: "POST",
      body: JSON.stringify({ bookingId: booking._id }),
    });

    const options = {
      key: orderData.keyId,
      amount: Math.round(Number(orderData.amount) * 100),
      currency: orderData.currency || "INR",
      name: "HotelHub",
      description: `Booking ${booking._id}`,
      order_id: orderData.orderId,

      handler: async (response) => {
        try {
          setPaymentMessage("Payment verify ho raha hai...");

          await apiRequest("/api/payments/verify-payment", {
            method: "POST",
            body: JSON.stringify({
              bookingId: booking._id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          setPaymentMessage("Payment successful! Status refresh ho raha hai.");
          await fetchPayments();
        } catch (err) {
          setPaymentMessage(
            `${err.message || "Payment verification pending."} Payment status refresh karke check karo. Dobara payment karne se pehle status verify karna.`
          );

          try {
            await fetchPayments();
          } catch {
            // Preserve the payment verification message.
          }
        } finally {
          setPayingBookingId("");
        }
      },

      modal: {
        ondismiss: () => {
          setPayingBookingId("");
        },
      },

      theme: {
        color: "#047857",
      },
    };

    const checkout = new window.Razorpay(options);

    checkout.on("payment.failed", (response) => {
      setPaymentMessage(
        response.error?.description || "Payment failed. Please try again."
      );
      setPayingBookingId("");
    });

    checkout.open();
  } catch (err) {
    setPaymentMessage(err.message || "Unable to start payment.");
    setPayingBookingId("");
  }
}



  async function downloadReceipt(bookingId) {
    try {
      setError("");
      setDownloadingId(bookingId);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/payments/receipt/${bookingId}`,
        { credentials: "include" }
      );

      const type = response.headers.get("content-type") || "";

      if (!response.ok || !type.includes("application/pdf")) {
        let message = `Receipt download failed (${response.status}).`;

        try {
          const data = await response.json();
          message = data.message || message;
        } catch {}

        throw new Error(message);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `HotelHub-Receipt-${bookingId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(err.message || "Unable to download receipt.");
    } finally {
      setDownloadingId("");
    }
  }

  function money(value) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);
  }

  function date(value) {
    if (!value) return "—";

    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function statusStyle(status) {
    switch (String(status || "").toLowerCase()) {
      case "paid":
        return "bg-emerald-100 text-emerald-800";
      case "refunded":
        return "bg-purple-100 text-purple-800";
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-stone-100 text-stone-700";
    }
  }

  const totalPaid = payments
    .filter((p) => p.paymentStatus === "paid")
    .reduce((sum, p) => sum + Number(p.totalAmount || 0), 0);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-stone-50 px-4 py-10 dark:bg-stone-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
    <Link
  to="/"
  className="inline-flex items-center gap-2 text-sm font-medium text-teal-500 transition hover:text-teal-400"
>
  ← Back to Home
</Link>

          <div className="mt-5">
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
              Your account
            </p>
            <h1 className="mt-2 text-3xl font-bold text-stone-900 dark:text-white">
              My Payments
            </h1>
            <p className="mt-2 text-stone-600 dark:text-stone-400">
              View your payment history and download booking receipts.
            </p>
          </div>

          
{paymentMessage && (
  <div
    role="status"
    aria-live="polite"
    className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
  >
    {paymentMessage}
  </div>
)}


          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Total paid
              </p>
              <p className="mt-2 text-2xl font-bold text-stone-900 dark:text-white">
                {money(totalPaid)}
              </p>
              <p className="mt-1 text-xs text-stone-500">
                Excludes pending, failed and refunded bookings
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Transactions
              </p>
              <p className="mt-2 text-2xl font-bold text-stone-900 dark:text-white">
                {payments.length}
              </p>
              <p className="mt-1 text-xs text-stone-500">
                Booking payment records
              </p>
            </div>
          </div>

          {loading && (
            <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-8 text-center text-stone-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
              Loading payment history...
            </div>
          )}

          {!loading && error && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            >
              {error}
            </div>
          )}

          {!loading && !error && payments.length === 0 && (
            <div className="mt-6 rounded-2xl border border-stone-200 bg-white px-6 py-14 text-center dark:border-stone-800 dark:bg-stone-900">
              <h2 className="text-xl font-semibold text-stone-900 dark:text-white">
                No payment records yet
              </h2>
              <p className="mt-2 text-stone-600 dark:text-stone-400">
                Your booking payments will appear here.
              </p>
              <Link
                to="/hotels"
                className="mt-5 inline-flex rounded-lg bg-emerald-900 px-5 py-3 font-semibold text-white hover:bg-emerald-800"
              >
                Explore stays
              </Link>
            </div>
          )}

          {!loading && payments.length > 0 && (
            <div className="mt-6 space-y-4">
              {payments.map((payment) => (
                <article
                  key={payment._id}
                  className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                      <h2 className="text-lg font-bold text-stone-900 dark:text-white">
                        {payment.hotel?.name || "Hotel booking"}
                      </h2>
                      <p className="mt-1 break-all text-xs text-stone-500">
                        Booking ID: {payment._id}
                      </p>
                      <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
                        {payment.room?.name || payment.room?.roomType || "Room"}
                        {" · "}
                        {date(payment.createdAt)}
                      </p>
                    </div>

                    <div className="sm:text-right">
                      <p className="text-xl font-bold text-stone-900 dark:text-white">
                        {money(payment.totalAmount)}
                      </p>
                      <span
                        className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyle(payment.paymentStatus)}`}
                      >
                        {payment.paymentStatus || "Unknown"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 border-t border-stone-100 pt-4 text-sm dark:border-stone-800 sm:grid-cols-2">
                    <div>
                      <p className="text-stone-500">Payment provider</p>
                      <p className="mt-1 font-medium text-stone-900 dark:text-white">
                        {payment.paymentProvider || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-stone-500">Payment ID</p>
                      <p className="mt-1 break-all font-medium text-stone-900 dark:text-white">
                        {payment.paymentId || "Not available"}
                      </p>
                    </div>
                  </div>

                  {payment.paymentStatus === "paid" &&
                    payment.paymentProvider === "razorpay" &&
                    payment.paymentId && (
                      <button
                        type="button"
                        onClick={() => downloadReceipt(payment._id)}
                        disabled={Boolean(downloadingId)}
                        className="mt-4 rounded-lg border border-emerald-800 px-4 py-2.5 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50 disabled:opacity-60 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-stone-800"
                      >
                        {downloadingId === payment._id
                          ? "Downloading..."
                          : "Download receipt"}
                      </button>
                    )}


{String(payment.status || "").toLowerCase() === "pending" &&
  String(payment.paymentStatus || "").toLowerCase() !== "paid" && (
    <button
      type="button"
      onClick={() => handlePayment(payment)}
      disabled={Boolean(payingBookingId)}
      className="mt-4 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {payingBookingId === payment._id
        ? "Processing..."
        : "Pay Now"}
    </button>
  )}


                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
