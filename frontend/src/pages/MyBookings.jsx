import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { apiRequest } from "../api/client";

export default function MyBookings() {
  const navigate = useNavigate();
  const [payingBookingId, setPayingBookingId] = useState("");
  const [downloadingReceiptId, setDownloadingReceiptId] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchBookings() {
    const data = await apiRequest("/api/bookings/my-bookings");
    setBookings(Array.isArray(data) ? data : data.bookings || []);
  }

  useEffect(() => {
    async function loadBookings() {
      try {
        await fetchBookings();
      } catch (err) {
        setError(err.message || "Unable to load your bookings.");
      } finally {
        setLoading(false);
      }
    }

    loadBookings();
  }, []);

  async function handlePayment(booking) {
    if (!window.Razorpay) {
      setPaymentMessage(
        "Razorpay Checkout load nahi hua. Page refresh karke dobara try karo.",
      );
      return;
    }

    setPayingBookingId(booking._id);
    setPaymentMessage("");

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

            setPaymentMessage("Payment successful! Booking confirm ho gayi.");
            await fetchBookings();
          } catch (err) {
            setPaymentMessage(
              `${err.message || "Payment verification pending."} Payment ka status My Bookings refresh karke check karo; dobara payment karne se pehle status verify karna.`,
            );
            try {
              await fetchBookings();
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
          color: "#2563eb",
        },
      };

      const checkout = new window.Razorpay(options);

      checkout.on("payment.failed", (response) => {
        setPaymentMessage(
          response.error?.description || "Payment failed. Please try again.",
        );
        setPayingBookingId("");
      });

      checkout.open();
    } catch (err) {
      setPaymentMessage(err.message || "Unable to start payment.");
      setPayingBookingId("");
    }
  }



async function handleDownloadReceipt(bookingId) {
  try {
    setPaymentMessage("");
    setDownloadingReceiptId(bookingId);

    const response = await fetch(
      `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/payments/receipt/${bookingId}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    const contentType = response.headers.get("content-type") || "";

    if (!response.ok || !contentType.includes("application/pdf")) {
      let message = `Receipt download failed (${response.status}).`;

      try {
        const data = await response.json();
        message = data.message || message;
      } catch {
        // Response was not JSON.
      }

      throw new Error(message);
    }

    const blob = await response.blob();

    if (blob.size < 100) {
      throw new Error("Receipt PDF is empty or incomplete.");
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `HotelHub-Receipt-${bookingId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  } catch (err) {
    setPaymentMessage(
      err.message || "Receipt download nahi ho payi."
    );
  } finally {
    setDownloadingReceiptId("");
  }
}




  function formatDate(date) {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatAmount(amount) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  }

  function statusClass(status) {
    switch (status?.toLowerCase()) {
      case "confirmed":
      case "paid":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-amber-100 text-amber-700";
      case "cancelled":
      case "expired":
      case "failed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                Your account
              </p>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">
                My Bookings
              </h1>
              <p className="mt-2 text-gray-600">
                View your reservations and payment status.
              </p>
            </div>

            <Link
              to="/hotels"
              className="inline-flex w-fit items-center justify-center rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Explore hotels
            </Link>
          </div>

          {loading && (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-600">
              Loading your bookings...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-red-200 bg-white p-6">
              <p className="font-semibold text-red-700">
                Could not load bookings
              </p>
              <p className="mt-2 text-sm text-gray-600">{error}</p>
            </div>
          )}

          {!loading && !error && bookings.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center">
              <h2 className="text-xl font-semibold text-gray-900">
                No bookings yet
              </h2>
              <p className="mt-2 text-gray-600">
                Your hotel reservations will appear here.
              </p>
              <Link
                to="/hotels"
                className="mt-6 inline-flex rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Find a hotel
              </Link>
            </div>
          )}

          {paymentMessage && (
            <div
              role="status"
              aria-live="polite"
              className="mb-5 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800"
            >
              {paymentMessage}
            </div>
          )}

          {!loading && !error && bookings.length > 0 && (
            <div className="space-y-5">
              {bookings.map((booking) => (
                <article
                  key={booking._id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                >
                  <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        {booking.hotel?.name || "Hotel reservation"}
                      </h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Booking ID: {booking._id}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        {[
                          booking.hotel?.location?.address,
                          booking.hotel?.location?.city,
                          booking.hotel?.location?.state,
                          booking.hotel?.location?.country,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-sm font-semibold capitalize ${statusClass(booking.status)}`}
                    >
                      {booking.status || "Unknown"}
                    </span>
                  </div>

                  <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-sm text-gray-500">Check-in</p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {formatDate(booking.checkIn)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Check-out</p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {formatDate(booking.checkOut)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Room</p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {booking.room?.name || booking.room?.type || "Room"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {booking.roomsBooked || 1} room(s)
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Total amount</p>
                      <p className="mt-1 text-lg font-bold text-gray-900">
                        {formatAmount(booking.totalAmount)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 border-t border-gray-100 bg-gray-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-gray-600">
                      Payment status:{" "}
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 font-semibold capitalize ${statusClass(booking.paymentStatus)}`}
                      >
                        {booking.paymentStatus || "Pending"}
                      </span>
                    </p>

                    <p className="text-xs text-gray-500">
                      Booked on {formatDate(booking.createdAt)}
                    </p>
               {String(booking.status || "").toLowerCase() === "pending" &&
  String(booking.paymentStatus || "").toLowerCase() !== "paid" && (
                        <button
                          type="button"
                          onClick={() => handlePayment(booking)}
                          disabled={Boolean(payingBookingId)}
                          className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {payingBookingId === booking._id
                            ? "Processing..."
                            : "Pay Now"}
                        </button>
                      )}

{String(booking.paymentStatus || "").toLowerCase() === "paid" &&
  booking.paymentProvider === "razorpay" &&
  booking.paymentId && (
    <button
      type="button"
      onClick={() => handleDownloadReceipt(booking._id)}
      disabled={Boolean(downloadingReceiptId)}
      className="rounded-lg border border-blue-600 px-5 py-2.5 font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {downloadingReceiptId === booking._id
        ? "Downloading..."
        : "Download Receipt"}
    </button>
  )}

                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
