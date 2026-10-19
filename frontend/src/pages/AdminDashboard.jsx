import { useCallback, useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { apiRequest } from "../api/client";
import { Link } from "react-router-dom";
import { chatSocket } from "../services/chatSocket";

const initialForm = {
  name: "",
  description: "",
  imageUrl: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  latitude: "",
  longitude: "",
};

// Accept one image URL per line (commas are supported too).
function parseImageUrls(value) {
  return [...new Set(String(value || "").split(/[\n,]+/).map((url) => url.trim()).filter(Boolean))];
}

function imageUrlsToText(images) {
  return Array.isArray(images) ? images.join("\n") : "";
}

const inputClass =
  "mt-2 block h-12 w-full rounded-lg border border-stone-300 px-3 outline-none focus:border-emerald-800 focus:ring-2 focus:ring-emerald-100";

export default function AdminDashboard() {
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  useEffect(() => {
    const loadUnreadCount = () => {
      chatSocket.emit("chat:admin:unread-count", {}, (result) => {
        if (result?.success) setUnreadChatCount(Number(result.unreadCount) || 0);
      });
    };

    const onConnect = loadUnreadCount;
    const onNewCustomerMessage = (payload) => {
      if (payload?.senderRole === "admin") return;
      setUnreadChatCount((count) => count + 1);
      // Reconcile with the database count to avoid stale/duplicate increments.
      loadUnreadCount();
    };
    const onUnreadCount = (payload) => {
      if (Number.isFinite(Number(payload?.unreadCount))) {
        setUnreadChatCount(Number(payload.unreadCount));
      }
    };

    chatSocket.on("connect", onConnect);
    chatSocket.on("chat:admin:new-message", onNewCustomerMessage);
    chatSocket.on("chat:admin:unread-count-updated", onUnreadCount);
    if (chatSocket.connected) loadUnreadCount();
    else chatSocket.connect();

    return () => {
      chatSocket.off("connect", onConnect);
      chatSocket.off("chat:admin:new-message", onNewCustomerMessage);
      chatSocket.off("chat:admin:unread-count-updated", onUnreadCount);
      // Do not disconnect here; the shared socket is also used by the chat page.
    };
  }, []);
    const [bookings, setBookings] = useState([]);
const [loadingBookings, setLoadingBookings] = useState(false);
const [updatingBookingStatus, setUpdatingBookingStatus] = useState(false);
const [selectedBooking, setSelectedBooking] = useState(null);
const [bookingSearch, setBookingSearch] = useState("");
const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [form, setForm] = useState(initialForm);
  const [busy, setBusy] = useState(false);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [imageUrls, setImageUrls] = useState({});
  const [savingImageId, setSavingImageId] = useState("");
  const [experienceEdits, setExperienceEdits] = useState({});
  const [savingExperienceId, setSavingExperienceId] = useState("");
  const [roomForm, setRoomForm] = useState({
    hotelId: "",
    name: "",
    description: "",
    roomType: "double",
    adults: "2",
    children: "0",
    pricePerNight: "",
    totalRooms: "1",
    amenities: "",
    imageUrl: "",
  });

  const [savingRoom, setSavingRoom] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [updatingRoomId, setUpdatingRoomId] = useState("");
  const [roomEdits, setRoomEdits] = useState({});
  const [hotels, setHotels] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [adminReviews, setAdminReviews] = useState([]);
  const [loadingAdminReviews, setLoadingAdminReviews] = useState(false);
  const [reviewsExpanded, setReviewsExpanded] = useState(false);
const [reviewsError, setReviewsError] = useState("");
const [deletingReviewId, setDeletingReviewId] = useState("");
  const loadHotels = useCallback(async () => {
    setLoadingHotels(true);
    try {
      const data = await apiRequest("/api/hotels/admin/all");
      setHotels(data.hotels || []);
    } catch (err) {
      setError(err.message || "Unable to load hotels.");
    } finally {
      setLoadingHotels(false);
    }
  }, []);

  useEffect(() => {
    loadHotels();
  }, [loadHotels]);

  useEffect(() => {
    let active = true;
    async function loadAdminReviews() {
      setLoadingAdminReviews(true);
  try {
    setReviewsError("");

    const data = await apiRequest("/api/reviews/admin/all");

    if (active) {
      setAdminReviews(
        Array.isArray(data.reviews) ? data.reviews : []
      );
    }
  } catch (err) {
  if (active) {
    setReviewsError(
      err.message || "Unable to load guest reviews."
    );
  }
} finally {
  if (active) setLoadingAdminReviews(false);
}
    }
    loadAdminReviews();
    return () => { active = false; };
  }, []);

  function handleChange(event) {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");

    try {
      const data = await apiRequest("/api/hotels", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
          images: parseImageUrls(form.imageUrl),
          location: {
            address: form.address.trim(),
            city: form.city.trim(),
            state: form.state.trim(),
            country: form.country.trim(),
            coordinates: {
              type: "Point",
              coordinates: [Number(form.longitude), Number(form.latitude)],
            },
          },
        }),
      });

      setMessage(data.message || "Hotel created successfully.");
      setForm(initialForm);
      await loadHotels();
    } catch (err) {
      setError(err.message || "Unable to create hotel.");
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(hotel) {
    const nextStatus = hotel.status === "active" ? "inactive" : "active";

    setUpdatingId(hotel._id);
    setMessage("");
    setError("");

    try {
      const data = await apiRequest(`/api/hotels/${hotel._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });

      setMessage(data.message || `Hotel ${nextStatus} successfully.`);
      await loadHotels();
    } catch (err) {
      setError(err.message || "Unable to update hotel status.");
    } finally {
      setUpdatingId("");
    }
  }

  async function updateHotelImage(hotel) {
    const images = parseImageUrls(imageUrls[hotel._id] ?? imageUrlsToText(hotel.images));

    if (!images.length) {
      setError("Please enter at least one hotel image URL.");
      setMessage("");
      return;
    }

    try {
      if (images.some((imageUrl) => {
        try { return new URL(imageUrl).protocol !== "https:"; } catch { return true; }
      })) throw new Error("invalid");
    } catch {
      setError("Every hotel image must be a valid HTTPS URL.");
      setMessage("");
      return;
    }



    setSavingImageId(hotel._id);
    setMessage("");
    setError("");

    try {
      const data = await apiRequest(`/api/hotels/${hotel._id}/images`, {
        method: "PATCH",
        body: JSON.stringify({ images }),
      });

      setMessage(data.message || "Hotel image updated successfully.");
      await loadHotels();
    } catch (err) {
      setError(err.message || "Unable to update hotel image.");
    } finally {
      setSavingImageId("");
    }
  }

  async function saveHotelExperience(hotel) {
    const edits = experienceEdits[hotel._id] || {};
    const experience = {
      foodAndDining: parseImageUrls(edits.foodAndDining ?? hotel.experience?.foodAndDining),
      staffAndHospitality: parseImageUrls(edits.staffAndHospitality ?? hotel.experience?.staffAndHospitality),
      viewsAndSurroundings: parseImageUrls(edits.viewsAndSurroundings ?? hotel.experience?.viewsAndSurroundings),
      bedrooms: parseImageUrls(edits.bedrooms ?? hotel.experience?.bedrooms),
    };
    const allUrls = Object.values(experience).flat();
    if (allUrls.some((url) => { try { return new URL(url).protocol !== "https:"; } catch { return true; } })) {
      setError("Every experience photo must be a valid HTTPS URL.");
      setMessage("");
      return;
    }
    setSavingExperienceId(hotel._id);
    setError("");
    setMessage("");
    try {
      const data = await apiRequest(`/api/hotels/${hotel._id}/experience`, {
        method: "PATCH",
        body: JSON.stringify({ experience }),
      });
      setMessage(data.message || "Hotel experience photos saved.");
      await loadHotels();
    } catch (err) {
      setError(err.message || "Unable to save experience photos. Check that the backend experience endpoint is implemented.");
    } finally {
      setSavingExperienceId("");
    }
  }

  async function deleteHotel(hotel) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${hotel.name}"?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) return;

    setUpdatingId(hotel._id);
    setMessage("");
    setError("");

    try {
      const data = await apiRequest(`/api/hotels/${hotel._id}`, {
        method: "DELETE",
      });

      setMessage(data.message || "Hotel deleted successfully.");
      await loadHotels();
    } catch (err) {
      setError(err.message || "Unable to delete hotel.");
    } finally {
      setUpdatingId("");
    }
  }

  function handleRoomChange(event) {
    const { name, value } = event.target;

    setRoomForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleRoomSubmit(event) {
    event.preventDefault();
    setSavingRoom(true);
    setMessage("");
    setError("");

    try {
      const data = await apiRequest("/api/rooms", {
        method: "POST",
        body: JSON.stringify({
          hotelId: roomForm.hotelId,
          name: roomForm.name.trim(),
          description: roomForm.description.trim(),
          roomType: roomForm.roomType,
          capacity: {
            adults: Number(roomForm.adults),
            children: Number(roomForm.children),
          },
          pricePerNight: Number(roomForm.pricePerNight),
          totalRooms: Number(roomForm.totalRooms),
          amenities: roomForm.amenities
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          images: parseImageUrls(roomForm.imageUrl),
        }),
      });

      setMessage(data.message || "Room created successfully.");

      setRoomForm((previous) => ({
        ...previous,
        name: "",
        description: "",
        pricePerNight: "",
        totalRooms: "1",
        amenities: "",
        imageUrl: "",
      }));
    } catch (err) {
      setError(err.message || "Unable to create room.");
    } finally {
      setSavingRoom(false);
    }
  }

  const loadRooms = useCallback(async () => {
    setLoadingRooms(true);

    try {
      const data = await apiRequest("/api/rooms/admin/all");
      setRooms(data.rooms || []);
    } catch (err) {
      setError(err.message || "Unable to load rooms.");
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  async function toggleRoomStatus(room) {
    const nextStatus = room.status === "active" ? "inactive" : "active";

    setUpdatingRoomId(room._id);
    setMessage("");
    setError("");

    try {
      const data = await apiRequest(`/api/rooms/${room._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });

      setMessage(data.message || "Room status updated.");
      await loadRooms();
    } catch (err) {
      setError(err.message || "Unable to update room status.");
    } finally {
      setUpdatingRoomId("");
    }
  }

  async function saveRoomChanges(room) {
    const edits = roomEdits[room._id] || {};

    if (
      edits.pricePerNight !== undefined &&
      (!Number.isFinite(Number(edits.pricePerNight)) ||
        Number(edits.pricePerNight) < 0)
    ) {
      setError("Room price must be a valid non-negative number.");
      return;
    }

    if (
      edits.totalRooms !== undefined &&
      (!Number.isInteger(Number(edits.totalRooms)) ||
        Number(edits.totalRooms) < 1)
    ) {
      setError("Total rooms must be at least 1.");
      return;
    }

    setUpdatingRoomId(room._id);
    setMessage("");
    setError("");

    try {
      const payload = {};

      if (edits.name !== undefined) {
        if (!edits.name.trim()) {
          setError("Room name is required.");
          return;
        }
        payload.name = edits.name.trim();
      }

      if (edits.pricePerNight !== undefined) {
        payload.pricePerNight = Number(edits.pricePerNight);
      }

      if (edits.totalRooms !== undefined) {
        payload.totalRooms = Number(edits.totalRooms);
      }

      if (edits.images !== undefined) {
        const images = parseImageUrls(edits.images);
        if (images.some((url) => { try { return new URL(url).protocol !== "https:"; } catch { return true; } })) {
          setError("Every room image must be a valid HTTPS URL.");
          return;
        }
        payload.images = images;
      }

      if (Object.keys(payload).length === 0) {
        setMessage("No changes to save.");
        return;
      }

      const data = await apiRequest(`/api/rooms/${room._id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      setMessage(data.message || "Room updated successfully.");

      setRoomEdits((previous) => {
        const next = { ...previous };
        delete next[room._id];
        return next;
      });

      await loadRooms();
    } catch (err) {
      setError(err.message || "Unable to update room.");
    } finally {
      setUpdatingRoomId("");
    }
  }


const loadBookings = useCallback(async () => {
    //  console.log("Loading bookings started");
  setLoadingBookings(true);

  try {
    const data = await apiRequest("/api/bookings/admin/all");
  //  console.log("Bookings API data:", data);
    setBookings(data.bookings || []);
    setError("");
  } catch (err) {
       // console.error("Bookings API error:", err);
    setError(err.message || "Unable to load bookings.");
  } finally {
    setLoadingBookings(false);
    // console.log("Loading bookings finished");
  }
}, []);

useEffect(() => {
  loadBookings();
}, [loadBookings]);

function formatDate(date) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

async function updateBookingStatus(nextStatus) {
  if (!selectedBooking || updatingBookingStatus) return;

  const currentStatus = (
    selectedBooking.status || ""
  ).toLowerCase();

  const paymentStatus = (
    selectedBooking.paymentStatus || ""
  ).toLowerCase();

  if (nextStatus === "confirmed" && paymentStatus !== "paid") {
    setError("Only paid bookings can be confirmed.");
    return;
  }

  if (
    !window.confirm(
      `Are you sure you want to change this booking to "${nextStatus}"?`
    )
  ) {
    return;
  }

  setUpdatingBookingStatus(true);
  setError("");
  setMessage("");

  try {
    const data = await apiRequest(
      `/api/bookings/admin/${selectedBooking._id}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      }
    );

    const updatedStatus = data.booking?.status || nextStatus;

    setBookings((previous) =>
      previous.map((booking) =>
        booking._id === selectedBooking._id
          ? { ...booking, status: updatedStatus }
          : booking
      )
    );

    setSelectedBooking((previous) =>
      previous
        ? { ...previous, status: updatedStatus }
        : previous
    );

    setMessage(data.message || "Booking status updated successfully.");
  } catch (err) {
    setError(err.message || "Unable to update booking status.");
  } finally {
    setUpdatingBookingStatus(false);
  }
}

const filteredBookings = bookings.filter((booking) => {
  const search = bookingSearch.trim().toLowerCase();

  const matchesSearch =
    !search ||
    [
      booking.user?.name,
      booking.user?.email,
      booking.hotel?.name,
      booking.room?.name,
      booking._id,
    ].some((value) =>
      String(value || "").toLowerCase().includes(search)
    );

  const matchesBookingStatus =
    bookingStatusFilter === "all" ||
    booking.status === bookingStatusFilter;

  const matchesPaymentStatus =
    paymentStatusFilter === "all" ||
    booking.paymentStatus === paymentStatusFilter;

  return (
    matchesSearch &&
    matchesBookingStatus &&
    matchesPaymentStatus
  );
});

async function deleteAdminReview(review) {
  const reviewId = review._id;

  if (!reviewId || deletingReviewId) return;

  const confirmed = window.confirm(
    "Are you sure you want to delete this guest review? This cannot be undone."
  );

  if (!confirmed) return;

  setDeletingReviewId(reviewId);
  setReviewsError("");
  setMessage("");

  try {
    const data = await apiRequest(
      `/api/reviews/admin/${reviewId}`,
      { method: "DELETE" }
    );

    setAdminReviews((previous) =>
      previous.filter((item) => item._id !== reviewId)
    );

    setMessage(data.message || "Review deleted successfully.");
  } catch (err) {
    setReviewsError(
      err.message || "Unable to delete this review."
    );
  } finally {
    setDeletingReviewId("");
  }
}


  return (
    <div className="min-h-screen bg-[#fbfaf7]">
      <Navbar />

      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">
          HotelHub Administration
        </p>

        <h1 className="mt-3 font-serif text-4xl text-stone-900">
          Manage Hotels
        </h1>

        <p className="mt-3 text-sm text-stone-600">
          Create and manage your hotel listings.
        </p>

        <Link
          to="/admin/live-chat"
          className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
        >
          <span className="flex min-w-0 items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-6.5A7.5 7.5 0 1 1 20 11.5Z" />
                <path d="M8 11h.01M12 11h.01M16 11h.01" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-2 font-semibold text-stone-900">
                Live Chat
                {unreadChatCount > 0 && (
                  <span className="relative flex h-3 w-3" aria-label={`${unreadChatCount} unread customer messages`}>
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600" />
                  </span>
                )}
              </span>
              <span className="mt-1 block text-sm text-stone-600">View and reply to customer messages in real time.</span>
            </span>
          </span>
          <span className="shrink-0 text-sm font-semibold text-emerald-800">Open inbox →</span>
        </Link>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {message && (
          <p
            role="status"
            className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900"
          >
            {message}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <h2 className="font-serif text-2xl text-stone-900">Add a hotel</h2>

          <div className="grid gap-5 sm:grid-cols-2">
            {[
              { name: "name", label: "Hotel name", maxLength: 150 },
              { name: "address", label: "Street address", maxLength: 200 },
              { name: "city", label: "City", maxLength: 100 },
              { name: "state", label: "State", maxLength: 100 },
              { name: "country", label: "Country", maxLength: 100 },
            ].map((field) => (
              <label
                key={field.name}
                className="text-sm font-medium text-stone-700"
              >
                {field.label}
                <input
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  required
                  maxLength={field.maxLength}
                  className={inputClass}
                />
              </label>
            ))}

            <label className="text-sm font-medium text-stone-700">
              Latitude
              <input
                type="number"
                name="latitude"
                value={form.latitude}
                onChange={handleChange}
                min="-90"
                max="90"
                step="any"
                required
                className={inputClass}
              />
            </label>

            <label className="text-sm font-medium text-stone-700">
              Longitude
              <input
                type="number"
                name="longitude"
                value={form.longitude}
                onChange={handleChange}
                min="-180"
                max="180"
                step="any"
                required
                className={inputClass}
              />
            </label>

            <label className="text-sm font-medium text-stone-700 sm:col-span-2">
              Hotel Image URLs
              <textarea
                name="imageUrl"
                value={form.imageUrl}
                onChange={handleChange}
                placeholder={"https://example.com/hotel-front.jpg\nhttps://example.com/hotel-lobby.jpg"}
                rows={3}
                maxLength={12000}
                className="mt-2 block w-full rounded-lg border border-stone-300 p-3 outline-none focus:border-emerald-800 focus:ring-2 focus:ring-emerald-100"
              />
              <span className="mt-1 block text-xs font-normal text-stone-500">
                Add one direct HTTPS image URL per line. These photos are saved to the hotel record.
              </span>
            </label>

            <label className="text-sm font-medium text-stone-700 sm:col-span-2">
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                maxLength={2000}
                rows={4}
                className="mt-2 block w-full rounded-lg border border-stone-300 p-3 outline-none focus:border-emerald-800 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-emerald-900 px-6 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {busy ? "Creating hotel..." : "Create hotel"}
          </button>
        </form>

        <form
          onSubmit={handleRoomSubmit}
          className="mt-8 space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <h2 className="font-serif text-2xl text-stone-900">Add a Room</h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-medium text-stone-700 sm:col-span-2">
              Select Hotel
              <select
                name="hotelId"
                value={roomForm.hotelId}
                onChange={handleRoomChange}
                required
                className={inputClass}
              >
                <option value="">Choose a hotel</option>
                {hotels.map((hotel) => (
                  <option key={hotel._id} value={hotel._id}>
                    {hotel.name} — {hotel.location?.city}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-stone-700">
              Room Name
              <input
                name="name"
                value={roomForm.name}
                onChange={handleRoomChange}
                required
                maxLength={100}
                className={inputClass}
                placeholder="Deluxe Mountain View Room"
              />
            </label>

            <label className="text-sm font-medium text-stone-700">
              Room Type
              <select
                name="roomType"
                value={roomForm.roomType}
                onChange={handleRoomChange}
                required
                className={inputClass}
              >
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="deluxe">Deluxe</option>
                <option value="suite">Suite</option>
                <option value="family">Family</option>
              </select>
            </label>

            <label className="text-sm font-medium text-stone-700 sm:col-span-2">
              Description
              <textarea
                name="description"
                value={roomForm.description}
                onChange={handleRoomChange}
                maxLength={1000}
                rows={3}
                className={inputClass}
                placeholder="Describe the room..."
              />
            </label>

            <label className="text-sm font-medium text-stone-700">
              Adults
              <input
                type="number"
                name="adults"
                value={roomForm.adults}
                onChange={handleRoomChange}
                min="1"
                max="20"
                required
                className={inputClass}
              />
            </label>

            <label className="text-sm font-medium text-stone-700">
              Children
              <input
                type="number"
                name="children"
                value={roomForm.children}
                onChange={handleRoomChange}
                min="0"
                max="20"
                required
                className={inputClass}
              />
            </label>

            <label className="text-sm font-medium text-stone-700">
              Price Per Night (₹)
              <input
                type="number"
                name="pricePerNight"
                value={roomForm.pricePerNight}
                onChange={handleRoomChange}
                min="1"
                step="0.01"
                required
                className={inputClass}
                placeholder="3500"
              />
            </label>

            <label className="text-sm font-medium text-stone-700">
              Total Rooms
              <input
                type="number"
                name="totalRooms"
                value={roomForm.totalRooms}
                onChange={handleRoomChange}
                min="1"
                max="10000"
                required
                className={inputClass}
              />
            </label>

            <label className="text-sm font-medium text-stone-700 sm:col-span-2">
              Amenities (comma-separated)
              <input
                name="amenities"
                value={roomForm.amenities}
                onChange={handleRoomChange}
                className={inputClass}
                placeholder="Wi-Fi, Air conditioning, Mountain view"
              />
            </label>

            <label className="text-sm font-medium text-stone-700 sm:col-span-2">
              Room Image URLs
              <textarea
                name="imageUrl"
                value={roomForm.imageUrl}
                onChange={handleRoomChange}
                rows={3}
                maxLength={12000}
                className="mt-2 block w-full rounded-lg border border-stone-300 p-3 outline-none focus:border-emerald-800 focus:ring-2 focus:ring-emerald-100"
                placeholder={"https://example.com/room-1.jpg\nhttps://example.com/room-2.jpg"}
              />
              <span className="mt-1 block text-xs font-normal text-stone-500">Add one direct HTTPS image URL per line.</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={savingRoom || hotels.length === 0}
            className="rounded-lg bg-emerald-900 px-6 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {savingRoom ? "Creating room..." : "Add Room"}
          </button>
        </form>

        <section className="mt-10">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-2xl text-stone-900">Manage Rooms</h2>

            <button
              type="button"
              onClick={loadRooms}
              disabled={loadingRooms}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-white disabled:opacity-60"
            >
              {loadingRooms ? "Loading..." : "Refresh Rooms"}
            </button>
          </div>

          {loadingRooms ? (
            <p className="mt-5 text-sm text-stone-600">Loading rooms...</p>
          ) : rooms.length === 0 ? (
            <p className="mt-5 rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-600">
              No rooms found. Create a room using the form above.
            </p>
          ) : (
            <div className="mt-5 space-y-4">
              {rooms.map((room) => {
                const edits = roomEdits[room._id] || {};

                return (
                  <article
                    key={room._id}
                    className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row">
                      {room.images?.[0] && (
                        <img
                          src={room.images[0]}
                          alt={room.name}
                          className="h-40 w-full rounded-xl object-cover sm:w-52"
                        />
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                          {room.hotel?.name || "Hotel"}
                          {room.hotel?.location?.city
                            ? ` · ${room.hotel.location.city}`
                            : ""}
                        </p>

                        <label className="mt-3 block text-sm font-medium text-stone-700">
                          Room Name
                          <input
                            value={edits.name ?? room.name}
                            onChange={(event) =>
                              setRoomEdits((previous) => ({
                                ...previous,
                                [room._id]: {
                                  ...previous[room._id],
                                  name: event.target.value,
                                },
                              }))
                            }
                            maxLength={100}
                            className={inputClass}
                          />
                        </label>

                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <label className="text-sm font-medium text-stone-700">
                            Price per night (₹)
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={edits.pricePerNight ?? room.pricePerNight}
                              onChange={(event) =>
                                setRoomEdits((previous) => ({
                                  ...previous,
                                  [room._id]: {
                                    ...previous[room._id],
                                    pricePerNight: event.target.value,
                                  },
                                }))
                              }
                              className={inputClass}
                            />
                          </label>

                          <label className="text-sm font-medium text-stone-700">
                            Total Rooms
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={edits.totalRooms ?? room.totalRooms}
                              onChange={(event) =>
                                setRoomEdits((previous) => ({
                                  ...previous,
                                  [room._id]: {
                                    ...previous[room._id],
                                    totalRooms: event.target.value,
                                  },
                                }))
                              }
                              className={inputClass}
                            />
                          </label>
                        </div>

                        <p className="mt-3 text-sm text-stone-600">
                          Type: {room.roomType} · Adults:{" "}
                          {room.capacity?.adults} · Children:{" "}
                          {room.capacity?.children}
                        </p>

                        <p className="mt-1 text-sm text-stone-600">
                          Status:{" "}
                          <span className="font-semibold">{room.status}</span>
                        </p>

                        <label className="mt-4 block text-sm font-medium text-stone-700">
                          Room Photo URLs (one HTTPS URL per line)
                          <textarea
                            rows={3}
                            value={edits.images ?? imageUrlsToText(room.images)}
                            onChange={(event) =>
                              setRoomEdits((previous) => ({
                                ...previous,
                                [room._id]: { ...previous[room._id], images: event.target.value },
                              }))
                            }
                            maxLength={12000}
                            placeholder="https://example.com/room.jpg"
                            className="mt-2 block w-full rounded-lg border border-stone-300 p-3 outline-none focus:border-emerald-800 focus:ring-2 focus:ring-emerald-100"
                          />
                        </label>

                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => saveRoomChanges(room)}
                            disabled={updatingRoomId === room._id}
                            className="rounded-lg bg-emerald-900 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                          >
                            {updatingRoomId === room._id
                              ? "Saving..."
                              : "Save Changes"}
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleRoomStatus(room)}
                            disabled={updatingRoomId === room._id}
                            className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-60"
                          >
                            {room.status === "active"
                              ? "Deactivate"
                              : "Activate"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        
<section className="mt-12">
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h2 className="font-serif text-2xl text-stone-900">
        Manage Bookings
      </h2>
      <p className="mt-1 text-sm text-stone-600">
        View customer reservations and payment status.
      </p>
    </div>

    <button
      type="button"
      onClick={loadBookings}
      disabled={loadingBookings}
      className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-white disabled:opacity-60"
    >
      {loadingBookings ? "Loading..." : "Refresh Bookings"}
    </button>
  </div>

{/* Booking Summary Cards */}
<div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
  <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
    <p className="text-sm text-stone-500">Total Bookings</p>
    <p className="mt-2 text-3xl font-semibold text-stone-900">
      {bookings.length}
    </p>
  </div>

  <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
    <p className="text-sm text-stone-500">Confirmed Bookings</p>
    <p className="mt-2 text-3xl font-semibold text-emerald-800">
      {bookings.filter(
        (booking) => booking.status?.toLowerCase() === "confirmed"
      ).length}
    </p>
  </div>

  <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
    <p className="text-sm text-stone-500">Pending Payments</p>
    <p className="mt-2 text-3xl font-semibold text-amber-600">
      {bookings.filter(
        (booking) => booking.paymentStatus?.toLowerCase() === "pending"
      ).length}
    </p>
  </div>

  <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
    <p className="text-sm text-stone-500">Revenue Received</p>
    <p className="mt-2 text-3xl font-semibold text-stone-900">
      ₹
      {bookings
        .filter(
          (booking) => booking.paymentStatus?.toLowerCase() === "paid"
        )
        .reduce(
          (total, booking) =>
            total + Number(booking.totalAmount || 0),
          0
        )
        .toLocaleString("en-IN")}
    </p>
  </div>
</div>

<div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
  <input
    type="search"
    value={bookingSearch}
    onChange={(e) => setBookingSearch(e.target.value)}
    placeholder="Search customer, hotel, email or ID..."
    className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10"
  />

  <select
    value={bookingStatusFilter}
    onChange={(e) => setBookingStatusFilter(e.target.value)}
    className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-800"
  >
    <option value="all">All booking statuses</option>
    <option value="confirmed">Confirmed</option>
    <option value="pending">Pending</option>
    <option value="expired">Expired</option>
    <option value="cancelled">Cancelled</option>
  </select>

  <select
    value={paymentStatusFilter}
    onChange={(e) => setPaymentStatusFilter(e.target.value)}
    className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-800"
  >
    <option value="all">All payment statuses</option>
    <option value="paid">Paid</option>
    <option value="pending">Payment pending</option>
    <option value="failed">Failed</option>
    <option value="refunded">Refunded</option>
  </select>
</div>

<p className="mt-3 text-sm text-stone-500">
  Showing {filteredBookings.length} of {bookings.length} bookings
</p>
  <div className="mt-5 rounded-2xl border border-stone-200 bg-white shadow-sm">
    {loadingBookings && bookings.length === 0 ? (
      <p className="p-6 text-sm text-stone-600">
        Loading bookings...
      </p>
    ) : bookings.length === 0 ? (
      <p className="p-6 text-sm text-stone-600">
        No bookings found yet.
      </p>
    ) : (
      <div className="overflow-x-auto">
<table className="w-full min-w-[800px] text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-600">
            <tr>
              <th className="px-5 py-4">Customer</th>
              <th className="px-5 py-4">Hotel / Room</th>
              <th className="px-5 py-4">Amount</th>
              <th className="px-5 py-4">Booking Status</th>
              <th className="px-5 py-4">Payment</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>
<tbody className="divide-y divide-gray-100">
  {filteredBookings.map((booking) => (
    <tr key={booking._id} className="hover:bg-gray-50">

      {/* Customer */}
      <td className="px-5 py-4">
        <div className="font-semibold text-gray-900">
          {booking.user?.name || booking.user?.fullName || "N/A"}
        </div>
        <div className="text-xs text-gray-500">
          {booking.user?.email || "N/A"}
        </div>
      </td>

      {/* Hotel / Room */}
      <td className="px-5 py-4">
        <div className="font-medium text-gray-900">
          {booking.hotel?.name || booking.room?.hotel?.name || "N/A"}
        </div>
        <div className="text-xs text-gray-500">
          {booking.room?.name || booking.room?.roomType || "Room"}
        </div>
      </td>

      {/* Amount */}
      <td className="px-5 py-4 font-semibold text-gray-900">
        ₹{Number(booking.totalAmount || booking.totalPrice || 0).toLocaleString("en-IN")}
      </td>

      {/* Booking Status */}
{/* Booking Status */}
<td className="px-5 py-4">
  <span
    className={`rounded-full px-3 py-1 text-xs font-medium ${
      (booking.status || booking.bookingStatus || "").toLowerCase() === "confirmed"
        ? "bg-emerald-50 text-emerald-700"
        : (booking.status || booking.bookingStatus || "").toLowerCase() === "expired"
        ? "bg-red-50 text-red-700"
        : "bg-amber-50 text-amber-700"
    }`}
  >
    {booking.status || booking.bookingStatus || "Pending"}
  </span>
</td>

      {/* Payment */}
   {/* Payment */}
<td className="px-5 py-4">
  <span
    className={`rounded-full px-3 py-1 text-xs font-medium ${
      (booking.paymentStatus || "").toLowerCase() === "paid"
        ? "bg-emerald-50 text-emerald-700"
        : (booking.paymentStatus || "").toLowerCase() === "pending"
        ? "bg-amber-50 text-amber-700"
        : "bg-red-50 text-red-700"
    }`}
  >
    {booking.paymentStatus || "Pending"}
  </span>
</td>

      {/* View Details Button */}
      <td className="px-5 py-4">
        <button
          type="button"
          onClick={() => setSelectedBooking(booking)}
          className="whitespace-nowrap rounded-lg bg-emerald-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800"
        >
          View Details
        </button>
      </td>

    </tr>
  ))}
</tbody>
        </table>
      </div>
    )}
  </div>
</section>
        {selectedBooking && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setSelectedBooking(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="booking-details-title"
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3
                    id="booking-details-title"
                    className="font-serif text-2xl text-stone-900"
                  >
                    Booking Details
                  </h3>
                  <p className="mt-1 break-all text-xs text-stone-500">
                    ID: {selectedBooking._id}
                  </p>
 
 {selectedBooking.createdAt && (
  <p className="mt-2 text-xs text-stone-500">
    Booked on: {formatDate(selectedBooking.createdAt)}
  </p>
)}

<button
  type="button"
  onClick={() => {
    navigator.clipboard.writeText(selectedBooking._id);
    setMessage("Booking ID copied.");
  }}
  className="mt-2 rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100"
>
  Copy Booking ID
</button>

                </div>

                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  aria-label="Close booking details"
                  className="rounded-lg px-3 py-2 text-xl text-stone-500 hover:bg-stone-100"
                >
                  &times;
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-stone-50 p-4">
                  <p className="text-xs font-semibold uppercase text-stone-500">
                    Customer
                  </p>
                  <p className="mt-2 font-semibold text-stone-900">
                    {selectedBooking.user?.name || "Customer"}
                  </p>
                  <p className="mt-1 break-all text-sm text-stone-600">
                    {selectedBooking.user?.email || "—"}
                  </p>
                  <p className="mt-2 text-sm text-stone-600">
  <span className="font-medium text-stone-800">Phone:</span>{" "}
  {selectedBooking.user?.phone || "Not provided"}
</p>
                </div>

                <div className="rounded-xl bg-stone-50 p-4">
                  <p className="text-xs font-semibold uppercase text-stone-500">
                    Hotel & Room
                  </p>
                  <p className="mt-2 font-semibold text-stone-900">
                    {selectedBooking.hotel?.name || "Hotel unavailable"}
                  </p>
                  <p className="mt-1 text-sm text-stone-600">
                    {selectedBooking.room?.name || "Room unavailable"}
                  </p>
                  <p className="mt-1 text-sm capitalize text-stone-600">
                    {selectedBooking.room?.roomType || "—"}
                  </p>
                </div>

                <div className="rounded-xl bg-stone-50 p-4">
                  <p className="text-xs font-semibold uppercase text-stone-500">
                    Stay
                  </p>
                  <p className="mt-2 text-sm text-stone-700">
                    Check-in: {formatDate(selectedBooking.checkIn)}
                  </p>
                  <p className="mt-2 text-sm text-stone-700">
                    Check-out: {formatDate(selectedBooking.checkOut)}
                  </p>
                </div>

                <div className="rounded-xl bg-stone-50 p-4">
                  <p className="text-xs font-semibold uppercase text-stone-500">
                    Guests & Rooms
                  </p>
                  <p className="mt-2 text-sm text-stone-700">
                    Adults: {selectedBooking.guests?.adults ?? 0}
                  </p>
                  <p className="mt-1 text-sm text-stone-700">
                    Children: {selectedBooking.guests?.children ?? 0}
                  </p>
                  <p className="mt-1 text-sm text-stone-700">
                    Rooms booked: {selectedBooking.roomsBooked ?? 1}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-stone-200 p-4">
                <p className="text-sm text-stone-500">Total Amount</p>
                <p className="mt-1 text-2xl font-bold text-stone-900">
                  {formatAmount(selectedBooking.totalAmount)}
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold capitalize text-stone-700">
                    Booking: {selectedBooking.status || "unknown"}
                  </span>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold capitalize text-emerald-800">
                    Payment: {selectedBooking.paymentStatus || "unknown"}
                  </span>
                </div>
                <div className="mt-5 border-t border-stone-200 pt-5">
  <p className="text-sm font-semibold text-stone-800">
    Manage Booking Status
  </p>

  <div className="mt-3 flex flex-wrap gap-3">
    {selectedBooking.status?.toLowerCase() === "pending" &&
      selectedBooking.paymentStatus?.toLowerCase() === "paid" && (
        <button
          type="button"
          onClick={() => updateBookingStatus("confirmed")}
          disabled={updatingBookingStatus}
          className="rounded-lg bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {updatingBookingStatus ? "Updating..." : "Confirm Booking"}
        </button>
      )}


{selectedBooking.status?.toLowerCase() === "confirmed" && (() => {
  const checkOutDate = new Date(selectedBooking.checkOut);
  const now = new Date();

  const checkoutHasPassed =
    !Number.isNaN(checkOutDate.getTime()) &&
    now >= checkOutDate;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => updateBookingStatus("completed")}
        disabled={updatingBookingStatus || !checkoutHasPassed}
        className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {updatingBookingStatus
          ? "Updating..."
          : "Mark Completed"}
      </button>

      {!checkoutHasPassed && (
        <p className="text-xs text-amber-700">
          Booking can be completed after the checkout date.
        </p>
      )}
    </div>
  );
})()}


    {["expired", "cancelled", "completed"].includes(
      selectedBooking.status?.toLowerCase()
    ) && (
      <p className="text-sm text-stone-500">
        This booking is {selectedBooking.status} and cannot be changed here.
      </p>
    )}
  </div>
</div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="rounded-lg bg-emerald-900 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}


        <section className="mt-10">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-2xl text-stone-900">Your hotels</h2>
            <button
              type="button"
              onClick={loadHotels}
              disabled={loadingHotels}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-white disabled:opacity-60"
            >
              {loadingHotels ? "Loading..." : "Refresh"}
            </button>
          </div>

          {loadingHotels ? (
            <p className="mt-5 text-sm text-stone-600">Loading hotels...</p>
          ) : hotels.length === 0 ? (
            <p className="mt-5 rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-600">
              No hotels found. Create your first hotel using the form above.
            </p>
          ) : (
            <div className="mt-5 space-y-4">
              {hotels.map((hotel) => (
                <article
                  key={hotel._id}
                  className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <h3 className="font-semibold text-stone-900">
                      {hotel.name}
                    </h3>
                    <p className="mt-1 text-sm text-stone-600">
                      {hotel.location?.city}, {hotel.location?.state}
                    </p>

                    <div className="mt-3 w-full sm:max-w-md">
                      <label
                        htmlFor={`hotel-image-${hotel._id}`}
                        className="text-sm font-medium text-stone-700"
                      >
                        Hotel Image URL
                      </label>

                      <input
                        id={`hotel-image-${hotel._id}`}
                        value={imageUrls[hotel._id] ?? imageUrlsToText(hotel.images)}
                        onChange={(event) =>
                          setImageUrls((previous) => ({
                            ...previous,
                            [hotel._id]: event.target.value,
                          }))
                        }
                        placeholder={"https://example.com/hotel-front.jpg\nhttps://example.com/hotel-lobby.jpg"}
                        maxLength={12000}
                        rows={3}
                        className="mt-2 block w-full rounded-lg border border-stone-300 p-3 outline-none focus:border-emerald-800 focus:ring-2 focus:ring-emerald-100"
                      />
                      <p className="mt-1 text-xs text-stone-500">One HTTPS URL per line. Saving replaces the hotel photo gallery.</p>

                      <button
                        type="button"
                        onClick={() => updateHotelImage(hotel)}
                        disabled={savingImageId === hotel._id}
                        className="mt-2 rounded-lg bg-emerald-900 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                      >
                        {savingImageId === hotel._id ? "Saving..." : "Save Hotel Photos"}
                      </button>
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-3">
                      {[
                        { key: "foodAndDining", label: "Food & Dining Photos", current: hotel.experience?.foodAndDining },
                        { key: "staffAndHospitality", label: "Staff & Hospitality Photos", current: hotel.experience?.staffAndHospitality },
                        { key: "viewsAndSurroundings", label: "Views & Surroundings Photos", current: hotel.experience?.viewsAndSurroundings },
                        { key: "bedrooms", label: "Bedrooms Photos", current: hotel.experience?.bedrooms },
                      ].map((group) => (
                        <label key={group.key} className="block text-sm font-medium text-stone-700">
                          {group.label}
                          <textarea
                            rows={4}
                            maxLength={20000}
                            value={experienceEdits[hotel._id]?.[group.key] ?? imageUrlsToText(group.current)}
                            onChange={(event) => setExperienceEdits((previous) => ({
                              ...previous,
                              [hotel._id]: { ...previous[hotel._id], [group.key]: event.target.value },
                            }))}
                            placeholder="One HTTPS image URL per line"
                            className="mt-2 block w-full rounded-lg border border-stone-300 p-3 text-sm outline-none focus:border-emerald-800 focus:ring-2 focus:ring-emerald-100"
                          />
                          <span className="mt-1 block text-xs font-normal text-stone-500">{parseImageUrls(experienceEdits[hotel._id]?.[group.key] ?? imageUrlsToText(group.current)).length} photo(s)</span>
                        </label>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => saveHotelExperience(hotel)}
                      disabled={savingExperienceId === hotel._id}
                      className="mt-3 rounded-lg bg-stone-800 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-60"
                    >
                      {savingExperienceId === hotel._id ? "Saving experience photos..." : "Save Experience Photos"}
                    </button>

                    <p className="mt-2 text-xs text-stone-500">
                      Status:{" "}
                      <span className="font-semibold uppercase">
                        {hotel.status}
                      </span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => changeStatus(hotel)}
                    disabled={updatingId === hotel._id}
                    className={`rounded-lg px-5 py-3 text-sm font-semibold text-white disabled:opacity-60 ${
                      hotel.status === "active"
                        ? "bg-stone-700 hover:bg-stone-800"
                        : "bg-emerald-900 hover:bg-emerald-800"
                    }`}
                  >
                    {updatingId === hotel._id
                      ? "Updating..."
                      : hotel.status === "active"
                        ? "Deactivate"
                        : "Activate"}
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteHotel(hotel)}
                    disabled={updatingId === hotel._id}
                    className="rounded-lg bg-red-700 px-5 py-3 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
                  >
                    {updatingId === hotel._id
                      ? "Processing..."
                      : "Delete Hotel"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
    <section className="mt-12 border-t border-stone-200 pt-8">
  <button
    type="button"
    onClick={() => setReviewsExpanded((previous) => !previous)}
    aria-expanded={reviewsExpanded}
    className="flex w-full items-center justify-between gap-4 rounded-xl border border-stone-200 bg-white px-5 py-4 text-left shadow-sm transition hover:border-emerald-800/40 hover:bg-stone-50"
  >
    <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
      <span className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-800">
        Guest Feedback
      </span>

      <span className="hidden text-stone-300 sm:inline">/</span>

      <span className="font-serif text-lg text-stone-900">
        Hotel reviews &amp; ratings
      </span>
    </span>

    <span className="flex shrink-0 items-center gap-3">
      <span className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-700">
        {loadingAdminReviews ? "Loading…" : `${adminReviews.length} reviews`}
      </span>

      <span
        className={`text-lg text-stone-500 transition-transform ${
          reviewsExpanded ? "rotate-180" : ""
        }`}
        aria-hidden="true"
      >
       ⌄
      </span>
    </span>
  </button>

  {reviewsExpanded && (
    <div className="mt-4 space-y-4">
      {reviewsError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {reviewsError}

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="ml-3 font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {loadingAdminReviews ? (
        <p className="rounded-xl border border-stone-200 bg-white p-5 text-sm text-stone-500">
          Loading guest reviews…
        </p>
      ) : adminReviews.length === 0 ? (
        <p className="rounded-xl border border-stone-200 bg-white p-5 text-sm text-stone-500">
          {reviewsError
            ? "Reviews could not be loaded."
            : "No guest reviews have been submitted yet."}
        </p>
      ) : (
        <div className="space-y-3">
          {adminReviews.map((review) => (
            <article
              key={review._id}
              className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-stone-900">
                      {review.hotel?.name || "Hotel"}
                    </h3>

                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">
                      ★ {Number(review.rating || 0).toFixed(1)} / 5
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-stone-500">
                    Guest:{" "}
                    {review.user?.name ||
                      [
                        review.user?.firstName,
                        review.user?.lastName,
                      ]
                        .filter(Boolean)
                        .join(" ") ||
                      "Guest"}

                    {review.hotel?.location?.city
                      ? ` · ${review.hotel.location.city}`
                      : ""}
                  </p>

                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-stone-700">
                    {review.comment || "No written feedback provided."}
                  </p>

                  <p className="mt-3 text-xs text-stone-400">
                    {review.createdAt
                      ? new Date(review.createdAt).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )
                      : ""}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => deleteAdminReview(review)}
                  disabled={Boolean(deletingReviewId)}
                  className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingReviewId === review._id
                    ? "Deleting…"
                    : "Delete review"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )}
</section>
      </main>
    </div>
  );
}
