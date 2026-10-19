import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { apiRequest } from "../api/client";
import HotelLiveChat from "../components/HotelLiveChat";

const HOTEL_DETAILS_DARK_STYLES = `
  html.dark .hotel-details-dark {
    min-height: 100vh;
    background: #0b0f0e !important;
    color: #f5f5f4;
    color-scheme: dark;
  }
  html.dark .hotel-details-dark main { color: #f5f5f4; }
  html.dark .hotel-details-dark [class*="bg-white"],
  html.dark .hotel-details-dark [class*="bg-stone-50"],
  html.dark .hotel-details-dark [class*="bg-stone-100"],
  html.dark .hotel-details-dark [class*="bg-stone-200"] {
    background-color: #151b18 !important;
  }
  html.dark .hotel-details-dark [class*="bg-amber-50"] { background-color: #302719 !important; }
  html.dark .hotel-details-dark [class*="bg-emerald-50"] { background-color: #142c23 !important; }
  html.dark .hotel-details-dark [class*="bg-sky-50"] { background-color: #172832 !important; }
  html.dark .hotel-details-dark [class*="bg-violet-50"] { background-color: #282137 !important; }
  html.dark .hotel-details-dark [class*="bg-red-50"] { background-color: #321b1b !important; }
  html.dark .hotel-details-dark [class*="text-stone-900"],
  html.dark .hotel-details-dark [class*="text-stone-800"],
  html.dark .hotel-details-dark [class*="text-stone-700"],
  html.dark .hotel-details-dark [class*="text-stone-600"] { color: #e7e5e4 !important; }
  html.dark .hotel-details-dark [class*="text-stone-500"],
  html.dark .hotel-details-dark [class*="text-stone-400"] { color: #a8b0aa !important; }
  html.dark .hotel-details-dark [class*="text-emerald-950"],
  html.dark .hotel-details-dark [class*="text-emerald-900"],
  html.dark .hotel-details-dark [class*="text-emerald-800"] { color: #a7f3d0 !important; }
  html.dark .hotel-details-dark [class*="text-sky-900"] { color: #bae6fd !important; }
  html.dark .hotel-details-dark [class*="text-amber-800"],
  html.dark .hotel-details-dark [class*="text-amber-700"] { color: #fcd34d !important; }
  html.dark .hotel-details-dark [class*="text-red-700"] { color: #fca5a5 !important; }
  html.dark .hotel-details-dark [class*="border-stone-100"],
  html.dark .hotel-details-dark [class*="border-stone-200"],
  html.dark .hotel-details-dark [class*="border-stone-300"] { border-color: #303a34 !important; }
  html.dark .hotel-details-dark [class*="border-emerald-200"] { border-color: #285342 !important; }
  html.dark .hotel-details-dark input,
  html.dark .hotel-details-dark textarea,
  html.dark .hotel-details-dark select {
    background-color: #101613 !important;
    color: #f5f5f4 !important;
    border-color: #3a4741 !important;
    color-scheme: dark;
  }
  html.dark .hotel-details-dark input::placeholder,
  html.dark .hotel-details-dark textarea::placeholder { color: #9ca3af !important; }
  html.dark .hotel-details-dark button:focus-visible,
  html.dark .hotel-details-dark a:focus-visible { outline: 2px solid #34d399; outline-offset: 3px; }
  html.dark .hotel-details-dark button:not([class*="bg-emerald-"]):not([class*="bg-amber-"]) { color: inherit; }
`;


function PhotoGallery({ images, alt, className = "" }) {
  const validImages = Array.isArray(images)
    ? [
        ...new Set(
          images.filter((image) => typeof image === "string" && image.trim()),
        ),
      ]
    : [];
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => setActiveIndex(0), [validImages.join("|")]);

  if (!validImages.length) return null;

  return (
    <div className={`mt-4 min-w-0 w-full max-w-full ${className}`}>
      <style>{`@keyframes hotelPhotoReveal { from { opacity: .45; transform: scale(1.035); } to { opacity: 1; transform: scale(1); } }`}</style>
      <div className="relative h-[280px] w-full min-w-0 max-w-full overflow-hidden rounded-xl bg-stone-100 p-1 shadow-sm xs:h-[320px] sm:h-[420px] sm:rounded-2xl sm:p-2 lg:h-[560px]">
        <img
          key={`${alt}-${activeIndex}-${validImages[activeIndex]}`}
          src={validImages[Math.min(activeIndex, validImages.length - 1)]}
          alt={`${alt} photo ${activeIndex + 1}`}
          loading="lazy"
          style={{
            animation: "hotelPhotoReveal 450ms cubic-bezier(.2,.75,.25,1) both",
          }}
          className="block h-full w-full max-w-full object-contain"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
        {validImages.length > 1 && (
          <>
            <button
              type="button"
              aria-label={`Previous ${alt} photo`}
              onClick={() =>
                setActiveIndex(
                  (index) =>
                    (index - 1 + validImages.length) % validImages.length,
                )
              }
              className="absolute left-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-white/90 text-2xl text-stone-900 shadow-lg backdrop-blur transition duration-200 hover:scale-105 hover:bg-white"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label={`Next ${alt} photo`}
              onClick={() =>
                setActiveIndex((index) => (index + 1) % validImages.length)
              }
              className="absolute right-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-white/90 text-2xl text-stone-900 shadow-lg backdrop-blur transition duration-200 hover:scale-105 hover:bg-white"
            >
              ›
            </button>
            <span className="absolute bottom-4 right-4 rounded-full border border-white/20 bg-black/60 px-3 py-2 text-sm font-medium text-white shadow backdrop-blur">
              {activeIndex + 1} / {validImages.length} photos
            </span>
          </>
        )}
      </div>
      {validImages.length > 1 && (
        <div className="mt-3 flex gap-3 overflow-x-auto rounded-xl bg-stone-100/80 p-3 pb-4 [scrollbar-width:thin]">
          {validImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`View ${alt} photo ${index + 1}`}
              aria-pressed={activeIndex === index}
              className={`h-24 w-36 shrink-0 overflow-hidden rounded-xl bg-stone-100 border-2 shadow-sm transition duration-300 sm:h-28 sm:w-44 ${activeIndex === index ? "scale-[1.02] border-emerald-800 ring-2 ring-emerald-800/15" : "border-transparent opacity-80 hover:scale-[1.02] hover:opacity-100"}`}
            >
              <img
                src={image}
                alt=""
                loading="lazy"
                className="h-full w-full object-contain"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HotelDetails() {
  const { hotelId } = useParams();
  const navigate = useNavigate();

  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [phone, setPhone] = useState("");
  const [roomsBooked, setRoomsBooked] = useState(1);
  const [bookingBusy, setBookingBusy] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [hotelReviews, setHotelReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewPagination, setReviewPagination] = useState(null);

  const nights =
    checkIn && checkOut && checkOut > checkIn
      ? Math.round(
          (new Date(`${checkOut}T00:00:00`) - new Date(`${checkIn}T00:00:00`)) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

  const totalPrice =
    selectedRoom && nights > 0
      ? Number(selectedRoom.pricePerNight) * nights * Number(roomsBooked)
      : 0;

  useEffect(() => {
    let active = true;

    async function loadHotel() {
      setLoading(true);
      setError("");

      try {
        const [hotelData, roomData] = await Promise.all([
          apiRequest(`/api/hotels/${hotelId}`),
          apiRequest(`/api/rooms/hotel/${hotelId}`),
        ]);

        if (!active) return;

        setHotel(hotelData.hotel);
        setRooms(Array.isArray(roomData.rooms) ? roomData.rooms : []);
        setActiveImage(0);
      } catch (err) {
        if (active) {
          setError(err.message || "Unable to load this hotel.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadHotel();

    return () => {
      active = false;
    };
  }, [hotelId]);

  useEffect(() => {
    let active = true;

    async function loadReviews() {
      setReviewsLoading(true);
      setReviewError("");

      try {
        const data = await apiRequest(
          `/api/reviews/hotel/${hotelId}?page=${reviewPage}&limit=10`,
        );

        if (!active) return;

        setHotelReviews(Array.isArray(data.reviews) ? data.reviews : []);

        setReviewPagination(data.pagination || null);
      } catch (err) {
        if (active) {
          setReviewError(err.message || "Unable to load guest reviews.");
        }
      } finally {
        if (active) setReviewsLoading(false);
      }
    }

    loadReviews();

    return () => {
      active = false;
    };
  }, [hotelId, reviewPage]);

  async function createBooking(event) {
    event.preventDefault();
    setBookingError("");
    setBookingMessage("");

    if (!phone.trim() || !/^\+?[0-9\s()-]{7,20}$/.test(phone.trim())) {
      setBookingError("Please enter a valid phone number.");
      return;
    }

    if (!selectedRoom) {
      setBookingError("Please select a room first.");
      return;
    }

    const today = new Date();
    const todayString = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");

    if (!checkIn || !checkOut || checkIn < todayString || checkOut <= checkIn) {
      setBookingError(
        "Select a valid check-in date and a check-out date after check-in.",
      );
      return;
    }

    const adultCount = Number(adults);
    const childCount = Number(children);
    const roomCount = Number(roomsBooked);

    if (
      !Number.isInteger(adultCount) ||
      adultCount < 1 ||
      adultCount > (selectedRoom.capacity?.adults || 10)
    ) {
      setBookingError("Please enter a valid number of adults for this room.");
      return;
    }

    if (
      !Number.isInteger(childCount) ||
      childCount < 0 ||
      childCount > (selectedRoom.capacity?.children ?? 10)
    ) {
      setBookingError("Please enter a valid number of children for this room.");
      return;
    }

    if (
      !Number.isInteger(roomCount) ||
      roomCount < 1 ||
      roomCount > (selectedRoom.totalRooms || 1)
    ) {
      setBookingError("Please select a valid number of rooms.");
      return;
    }

    setBookingBusy(true);

    try {
      const data = await apiRequest("/api/bookings", {
        method: "POST",
        body: JSON.stringify({
          roomId: selectedRoom._id,
          checkIn,
          checkOut,
          guests: {
            adults: adultCount,
            children: childCount,
          },
          roomsBooked: roomCount,
          phone: phone.trim(),
        }),
      });

      if (!data.booking?._id) {
        throw new Error("Booking was created but the booking ID is missing.");
      }

     navigate("/my-payments", {
        state: {
          success: "Booking created successfully. Payment is still pending.",
          bookingId: data.booking._id,
        },
      });
    } catch (err) {
      setBookingError(err.message || "Unable to create booking.");
    } finally {
      setBookingBusy(false);
    }
  }

  async function submitReview(event) {
    event.preventDefault();

    setReviewError("");
    setReviewMessage("");

    const comment = reviewComment.trim();

    if (
      !Number.isInteger(Number(reviewRating)) ||
      Number(reviewRating) < 1 ||
      Number(reviewRating) > 5
    ) {
      setReviewError("Please select a rating from 1 to 5 stars.");
      return;
    }

    if (comment.length < 5 || comment.length > 2000) {
      setReviewError("Feedback must contain between 5 and 2000 characters.");
      return;
    }

    setReviewBusy(true);

    try {
      await apiRequest(`/api/reviews/hotel/${hotelId}`, {
        method: "POST",
        body: JSON.stringify({
          rating: Number(reviewRating),
          comment,
        }),
      });

      setReviewMessage("Your review has been saved successfully.");

      setReviewComment("");
      setReviewPage(1);

      const data = await apiRequest(
        `/api/reviews/hotel/${hotelId}?page=1&limit=10`,
      );

      setHotelReviews(Array.isArray(data.reviews) ? data.reviews : []);

      setReviewPagination(data.pagination || null);

      // Refresh hotel rating displayed on the page.
      const refreshedHotel = await apiRequest(`/api/hotels/${hotelId}`);

      if (refreshedHotel.hotel) {
        setHotel(refreshedHotel.hotel);
      }
    } catch (err) {
      setReviewError(
        err.message ||
          "Unable to submit your review. Please log in and try again.",
      );
    } finally {
      setReviewBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="hotel-details-dark min-h-screen bg-[#fbfaf7]">
        <style>{HOTEL_DETAILS_DARK_STYLES}</style>
        <Navbar />
        <div className="grid min-h-[60vh] place-items-center text-emerald-900">
          Loading hotel details...
        </div>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="hotel-details-dark min-h-screen bg-[#fbfaf7]">
        <style>{HOTEL_DETAILS_DARK_STYLES}</style>
        <Navbar />
        <div className="mx-auto max-w-3xl px-5 py-20 text-center">
          <p className="text-red-700">{error || "Hotel not found."}</p>
          <Link
            to="/hotels"
            className="mt-5 inline-block font-semibold text-emerald-900"
          >
            ← Back to hotels
          </Link>
        </div>
      </div>
    );
  }

  const location = hotel.location;

  const locationText = [
    location?.address,
    location?.city,
    location?.state,
    location?.country,
  ]
    .filter(Boolean)
    .join(", ");

  const fallbackHotelImage =
    "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1600&q=80";

  const hotelImages =
    Array.isArray(hotel.images) && hotel.images.filter(Boolean).length
      ? hotel.images.filter(Boolean)
      : [fallbackHotelImage];

  const foodItems = Array.isArray(hotel.food)
    ? hotel.food
    : Array.isArray(hotel.dining)
      ? hotel.dining
      : [];
  const experience = hotel.experience || {};
  const foodPhotos = Array.isArray(experience.foodAndDining)
    ? experience.foodAndDining
    : [];
  const staffPhotos = Array.isArray(experience.staffAndHospitality)
    ? experience.staffAndHospitality
    : [];
  const viewPhotos = Array.isArray(experience.viewsAndSurroundings)
    ? experience.viewsAndSurroundings
    : [];
  const bedroomPhotos = Array.isArray(experience.bedrooms)
    ? experience.bedrooms
    : [];

  const staffItems = Array.isArray(hotel.staff)
    ? hotel.staff
    : Array.isArray(hotel.services)
      ? hotel.services
      : [];

  const viewItems = Array.isArray(hotel.views) ? hotel.views : [];

  const reviews = Array.isArray(hotel.reviews)
    ? hotel.reviews
    : Array.isArray(hotel.feedback)
      ? hotel.feedback
      : [];

  return (
    <div className="hotel-details-dark min-h-screen bg-[#fbfaf7]">
      <style>{HOTEL_DETAILS_DARK_STYLES}</style>
      <Navbar />

      <main className="mx-auto w-full min-w-0 max-w-7xl overflow-x-clip px-3 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
        <Link to="/hotels" className="text-sm font-semibold text-emerald-900">
          ← All hotels
        </Link>

        {/* Hotel image gallery */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-md">
          <style>{`@keyframes hotelPhotoReveal { from { opacity: .45; transform: scale(1.035); } to { opacity: 1; transform: scale(1); } }`}</style>
          <div className="relative h-[260px] w-full min-w-0 overflow-hidden bg-stone-100 sm:h-[400px] md:h-[500px] lg:h-[620px]">
            <img
              src={hotelImages[Math.min(activeImage, hotelImages.length - 1)]}
              alt={`${hotel.name || "Hotel"} photo ${activeImage + 1}`}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = fallbackHotelImage;
              }}
              className="h-full w-full object-contain"
            />

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

            <span className="absolute left-5 top-5 rounded-full bg-white/95 px-4 py-2 text-xs font-bold tracking-wide text-emerald-950 shadow">
              HOTELHUB · YOUR STAY
            </span>

            {hotelImages.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous hotel photo"
                  onClick={() =>
                    setActiveImage(
                      (index) =>
                        (index - 1 + hotelImages.length) % hotelImages.length,
                    )
                  }
                  className="absolute left-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-2xl text-stone-900 shadow transition hover:bg-white"
                >
                  ‹
                </button>

                <button
                  type="button"
                  aria-label="Next hotel photo"
                  onClick={() =>
                    setActiveImage((index) => (index + 1) % hotelImages.length)
                  }
                  className="absolute right-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-2xl text-stone-900 shadow transition hover:bg-white"
                >
                  ›
                </button>

                <span className="absolute bottom-5 right-5 rounded-full bg-black/55 px-3 py-2 text-xs font-semibold text-white backdrop-blur">
                  {activeImage + 1} / {hotelImages.length} photos
                </span>
              </>
            )}
          </div>

          {hotelImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto bg-stone-50 p-3 sm:p-4">
              {hotelImages.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  aria-label={`View hotel photo ${index + 1}`}
                  aria-pressed={activeImage === index}
                  className={`h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-stone-200 border-2 shadow-sm transition duration-300 sm:h-24 sm:w-36 ${
                    activeImage === index
                      ? "border-emerald-800"
                      : "border-transparent opacity-75 hover:opacity-100"
                  }`}
                >
                  <img
                    src={image}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Hotel information */}
          <div className="p-6 sm:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">
              Discover your next stay
            </p>

            <h1 className="mt-3 font-serif text-4xl text-stone-900 sm:text-5xl">
              {hotel.name}
            </h1>
            {Number(hotel.totalReviews) > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800">
                  ★ {Number(hotel.rating || 0).toFixed(1)} / 5
                </span>

                <span className="text-sm text-stone-500">
                  {hotel.totalReviews}{" "}
                  {Number(hotel.totalReviews) === 1 ? "review" : "reviews"}
                </span>
              </div>
            )}

            {locationText && (
              <p className="mt-3 text-sm text-stone-500">{locationText}</p>
            )}

            {hotel.description && (
              <p className="mt-5 max-w-3xl text-sm leading-7 text-stone-600">
                {hotel.description}
              </p>
            )}

            {hotel.amenities?.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {hotel.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="rounded-full bg-emerald-50 px-3 py-2 text-xs text-emerald-900"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Food, staff and views */}
        <section className="py-12">
          <div className="mb-7">
            <p className="text-xs font-bold tracking-[0.2em] text-emerald-800">
              THE EXPERIENCE
            </p>
            <h2 className="mt-3 font-serif text-3xl text-stone-900 sm:text-4xl">
              More to enjoy during your stay
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-500">
              Explore the facilities and experiences listed for this property.
            </p>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
            {/* Food and dining */}
            <article className="min-w-0 rounded-2xl border border-stone-200 bg-white p-4 sm:p-6 lg:p-7">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-xl"
                aria-hidden="true"
              >
                ♨
              </div>

              <h3 className="mt-4 font-serif text-2xl text-stone-900">
                Food & dining
              </h3>

              <PhotoGallery images={foodPhotos} alt="Food and dining" />

              {foodItems.length > 0 ? (
                <ul className="mt-4 space-y-2 text-sm text-stone-600">
                  {foodItems.map((item, index) => (
                    <li
                      key={item?._id || item?.name || item?.title || index}
                      className="rounded-lg bg-stone-50 px-3 py-2"
                    >
                      {typeof item === "string"
                        ? item
                        : item.name ||
                          item.title ||
                          item.description ||
                          "Dining option"}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm leading-6 text-stone-500">
                  Dining details have not been added for this property yet.
                  Contact the property to confirm available food options.
                </p>
              )}
            </article>

            {/* Staff and hospitality */}
            <article className="min-w-0 rounded-2xl border border-stone-200 bg-white p-4 sm:p-6 lg:p-7">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl"
                aria-hidden="true"
              >
                ✦
              </div>

              <h3 className="mt-4 font-serif text-2xl text-stone-900">
                Staff & hospitality
              </h3>

              <PhotoGallery images={staffPhotos} alt="Staff and hospitality" />

              {staffItems.length > 0 ? (
                <ul className="mt-4 space-y-2 text-sm text-stone-600">
                  {staffItems.map((item, index) => (
                    <li
                      key={item?._id || item?.name || item?.title || index}
                      className="rounded-lg bg-stone-50 px-3 py-2"
                    >
                      {typeof item === "string"
                        ? item
                        : item.name ||
                          item.title ||
                          item.description ||
                          "Service"}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm leading-6 text-stone-500">
                  Hospitality information is not available yet.
                  Property-specific staff and service details can be shown here
                  once provided by the hotel.
                </p>
              )}
            </article>

            {/* Bedrooms gallery: property-level bedroom photos only. Room-specific photos remain in Rooms & Suites below. */}
            <article className="min-w-0 rounded-2xl border border-stone-200 bg-white p-4 sm:p-6 lg:p-7 md:col-span-2">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-xl"
                aria-hidden="true"
              >
                ▰
              </div>
              <h3 className="mt-4 font-serif text-2xl text-stone-900">
                Bedrooms
              </h3>
              <p className="mt-2 text-sm leading-6 text-stone-500">
                Explore the bedroom photos added by the property.
              </p>

              {bedroomPhotos.length > 0 ? (
                <PhotoGallery
                  images={bedroomPhotos}
                  alt="Bedrooms"
                  className="mx-auto mt-3 w-full max-w-none"
                />
              ) : (
                <p className="mt-3 text-sm leading-6 text-stone-500">
                  Bedroom photos have not been added for this property yet.
                </p>
              )}
            </article>

            {/* Views and surroundings */}
            <article className="min-w-0 rounded-2xl border border-stone-200 bg-white p-4 sm:p-6 lg:p-7 md:col-span-2">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-xl"
                  aria-hidden="true"
                >
                  ⌖
                </div>

                <div className="flex-1">
                  <h3 className="font-serif text-2xl text-stone-900">
                    Views & surroundings
                  </h3>

                  <PhotoGallery
                    images={viewPhotos}
                    alt="Views and surroundings"
                    className="mx-auto w-full max-w-none"
                  />

                  {viewItems.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {viewItems.map((item, index) => (
                        <span
                          key={item?._id || item?.name || index}
                          className="rounded-full bg-sky-50 px-3 py-2 text-xs font-medium text-sky-900"
                        >
                          {typeof item === "string"
                            ? item
                            : item.name ||
                              item.title ||
                              item.description ||
                              "View"}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-stone-500">
                      Specific view details have not been provided for this
                      property. Browse the photo gallery above for the images
                      currently available.
                    </p>
                  )}
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* Reviews and feedback */}
        {/* Reviews and feedback */}
        <section className="pb-12" id="reviews">
          <div className="mb-6">
            <p className="text-xs font-bold tracking-[0.2em] text-emerald-800">
              GUEST EXPERIENCES
            </p>

            <h2 className="mt-3 font-serif text-3xl text-stone-900 sm:text-4xl">
              Reviews & feedback
            </h2>

            <p className="mt-2 text-sm text-stone-500">
              Read guest experiences and share your own feedback.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.75fr)]">
            {/* Existing reviews */}
            <div className="min-w-0 rounded-2xl border border-stone-200 bg-white p-5 sm:p-7">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-serif text-2xl text-stone-900">
                  Guest reviews
                </h3>

                {Number(hotel.totalReviews) > 0 && (
                  <span className="text-sm font-semibold text-amber-700">
                    ★ {Number(hotel.rating || 0).toFixed(1)} / 5
                  </span>
                )}
              </div>

              {reviewsLoading ? (
                <p className="py-8 text-center text-sm text-stone-500">
                  Loading guest reviews...
                </p>
              ) : reviewError && hotelReviews.length === 0 ? (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 p-4 text-sm text-red-700"
                >
                  {reviewError}
                </p>
              ) : hotelReviews.length > 0 ? (
                <div className="space-y-4">
                  {hotelReviews.map((review) => (
                    <article
                      key={review._id}
                      className="rounded-xl border border-stone-100 bg-stone-50 p-4 sm:p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h4 className="font-semibold text-stone-900">
                            {review.user?.name || "Guest"}
                          </h4>

                          {review.createdAt && (
                            <p className="mt-1 text-xs text-stone-500">
                              {new Date(review.createdAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </p>
                          )}
                        </div>

                        <span
                          className="shrink-0 rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-bold text-amber-800"
                          aria-label={`${review.rating} out of 5 stars`}
                        >
                          ★ {review.rating} / 5
                        </span>
                      </div>

                      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-stone-600">
                        {review.comment}
                      </p>
                    </article>
                  ))}

                  {reviewPagination &&
                    Number(reviewPagination.totalPages) > 1 && (
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-5">
                        <button
                          type="button"
                          disabled={reviewPage <= 1}
                          onClick={() =>
                            setReviewPage((page) => Math.max(1, page - 1))
                          }
                          className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Previous
                        </button>

                        <span className="text-sm text-stone-500">
                          Page {reviewPage} of {reviewPagination.totalPages}
                        </span>

                        <button
                          type="button"
                          disabled={reviewPage >= reviewPagination.totalPages}
                          onClick={() =>
                            setReviewPage((page) =>
                              Math.min(reviewPagination.totalPages, page + 1),
                            )
                          }
                          className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    )}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-2xl tracking-widest text-amber-500">
                    ☆ ☆ ☆ ☆ ☆
                  </p>

                  <h4 className="mt-3 font-serif text-xl text-stone-900">
                    Be the first to review this hotel
                  </h4>

                  <p className="mt-2 text-sm leading-6 text-stone-500">
                    No guest reviews have been submitted yet.
                  </p>
                </div>
              )}
            </div>

            {/* Submit or update review */}
            <div className="h-fit min-w-0 rounded-2xl border border-stone-200 bg-white p-5 sm:p-7">
              <h3 className="font-serif text-2xl text-stone-900">
                Share your experience
              </h3>

              <p className="mt-2 text-sm leading-6 text-stone-500">
                Rate your stay and tell other guests about your experience.
              </p>

              <form onSubmit={submitReview} className="mt-6 space-y-5">
                <fieldset>
                  <legend className="text-sm font-semibold text-stone-700">
                    Your rating
                  </legend>

                  <div
                    className="mt-3 flex flex-wrap gap-2"
                    role="radiogroup"
                    aria-label="Hotel rating"
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        role="radio"
                        aria-checked={reviewRating === star}
                        aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
                        onClick={() => setReviewRating(star)}
                        className={`grid h-11 w-11 place-items-center rounded-lg border text-2xl transition ${
                          star <= reviewRating
                            ? "border-amber-300 bg-amber-50 text-amber-500"
                            : "border-stone-200 bg-white text-stone-300 hover:border-amber-200"
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>

                  <p className="mt-2 text-xs text-stone-500">
                    {reviewRating} out of 5 stars selected
                  </p>
                </fieldset>

                <label className="block text-sm font-semibold text-stone-700">
                  Your feedback
                  <textarea
                    value={reviewComment}
                    onChange={(event) => setReviewComment(event.target.value)}
                    required
                    minLength={5}
                    maxLength={2000}
                    rows={5}
                    placeholder="What did you like about your experience?"
                    className="mt-2 block w-full resize-y rounded-xl border border-stone-300 px-3 py-3 text-sm font-normal text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10"
                  />
                  <span className="mt-1 block text-right text-xs font-normal text-stone-500">
                    {reviewComment.length}/2000 characters
                  </span>
                </label>

                {reviewError && (
                  <p
                    role="alert"
                    className="rounded-lg bg-red-50 p-3 text-sm leading-6 text-red-700"
                  >
                    {reviewError}
                  </p>
                )}

                {reviewMessage && (
                  <p
                    role="status"
                    className="rounded-lg bg-emerald-50 p-3 text-sm leading-6 text-emerald-900"
                  >
                    {reviewMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={reviewBusy}
                  className="w-full rounded-xl bg-emerald-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {reviewBusy ? "Saving review..." : "Submit / update review"}
                </button>

                <p className="text-xs leading-5 text-stone-500">
                  You must be logged in to submit a review. Submitting another
                  review for the same hotel updates your existing review.
                </p>
              </form>
            </div>
          </div>
        </section>

        {/* Rooms and suites */}
        <section className="py-12 sm:py-14 lg:py-16">
          <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-800">
              Rooms & Suites
            </p>
            <h2 className="mt-3 font-serif text-3xl leading-tight text-stone-900 sm:text-4xl lg:text-5xl">
              Choose your room
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-stone-500 sm:text-base sm:leading-7">
              Explore the available rooms, compare their features, and choose
              the space that suits your stay.
            </p>
            <div className="mx-auto mt-5 h-1 w-14 rounded-full bg-emerald-800" />
          </div>

          {rooms.length === 0 ? (
            <div className="mx-auto max-w-2xl rounded-2xl border border-stone-200 bg-white px-5 py-10 text-center shadow-sm sm:px-8">
              <h3 className="font-serif text-xl text-stone-900">
                No rooms available
              </h3>
              <p className="mt-2 text-sm leading-6 text-stone-500">
                No active rooms are available for this hotel right now. Please
                check again later.
              </p>
            </div>
          ) : (
            <div className="mx-auto grid w-full min-w-0 max-w-6xl grid-cols-1 justify-items-stretch gap-5 sm:gap-7 lg:grid-cols-2 lg:gap-8">
              {rooms.map((room) => (
                <article
                  key={room._id}
                  className="flex h-full w-full min-w-0 max-w-2xl flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg"
                >
                  <div className="p-3 pb-0 sm:p-4 sm:pb-0">
                    <PhotoGallery
                      images={
                        Array.isArray(room.images) && room.images.length
                          ? room.images
                          : hotel.images?.length
                            ? [hotel.images[0]]
                            : [
                                "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1400&q=90",
                              ]
                      }
                      alt={room.name || "Room"}
                      className="mt-0"
                    />
                  </div>

                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
                          {room.roomType || "Guest room"}
                        </p>
                        <h3 className="mt-2 break-words font-serif text-2xl leading-snug text-stone-900 sm:text-3xl">
                          {room.name || "Guest room"}
                        </h3>
                      </div>
                      {Number(room.totalRooms) > 0 && (
                        <span className="shrink-0 rounded-full border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600">
                          {room.totalRooms}{" "}
                          {Number(room.totalRooms) === 1 ? "room" : "rooms"}
                        </span>
                      )}
                    </div>

                    <p className="mt-3 text-sm leading-6 text-stone-600 sm:text-base sm:leading-7">
                      {room.description ||
                        "A comfortable room designed for a relaxing stay."}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-b border-stone-100 pb-4 text-sm text-stone-600">
                      <span>
                        Capacity: {room.capacity?.adults ?? 1}{" "}
                        {Number(room.capacity?.adults ?? 1) === 1
                          ? "adult"
                          : "adults"}
                      </span>
                      {room.capacity?.children != null && (
                        <span>
                          {room.capacity.children}{" "}
                          {Number(room.capacity.children) === 1
                            ? "child"
                            : "children"}
                        </span>
                      )}
                    </div>

                    {Array.isArray(room.amenities) &&
                      room.amenities.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {room.amenities.slice(0, 5).map((amenity) => (
                            <span
                              key={amenity}
                              className="rounded-full bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-600 ring-1 ring-inset ring-stone-200"
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>
                      )}

                    <div className="mt-auto flex flex-col gap-4 pt-6 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-xs text-stone-500">
                          Price per room / night
                        </p>
                        <p className="mt-1 text-2xl font-semibold tabular-nums text-stone-900 sm:text-3xl">
                          ₹
                          {Number(room.pricePerNight || 0).toLocaleString(
                            "en-IN",
                          )}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRoom(room);
                          setBookingMessage("");
                          setBookingError("");
                        }}
                        className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-900 px-5 py-3.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2 sm:w-auto"
                      >
                        Select room
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Booking form */}
        {selectedRoom && (
          <section className="mx-auto max-w-2xl rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
            <button
              type="button"
              onClick={() => setSelectedRoom(null)}
              className="float-right text-sm text-stone-500 hover:text-stone-900"
            >
              Cancel
            </button>

            <p className="text-xs font-bold tracking-[0.2em] text-emerald-800">
              YOUR STAY
            </p>

            <h2 className="mt-2 font-serif text-3xl text-stone-900">
              Book {selectedRoom.name}
            </h2>

            <form onSubmit={createBooking} className="mt-6 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-stone-700">
                  Contact phone number
                  <input
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    inputMode="tel"
                    required
                    maxLength={20}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    className="mt-2 block h-12 w-full rounded-lg border border-stone-300 px-3 font-normal"
                  />
                  <span className="mt-1 block text-xs font-normal text-stone-500">
                    Used for booking-related communication.
                  </span>
                </label>

                <label className="block text-sm font-semibold text-stone-700">
                  Check-in
                  <input
                    type="date"
                    required
                    min={new Date().toLocaleDateString("en-CA")}
                    value={checkIn}
                    onChange={(e) => {
                      setCheckIn(e.target.value);

                      if (
                        checkOut &&
                        e.target.value &&
                        checkOut <= e.target.value
                      ) {
                        setCheckOut("");
                      }
                    }}
                    className="mt-2 block h-12 w-full rounded-lg border border-stone-300 px-3 font-normal"
                  />
                </label>

                <label className="block text-sm font-semibold text-stone-700">
                  Check-out
                  <input
                    type="date"
                    required
                    min={checkIn || new Date().toLocaleDateString("en-CA")}
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="mt-2 block h-12 w-full rounded-lg border border-stone-300 px-3 font-normal"
                  />
                </label>

                <label className="block text-sm font-semibold text-stone-700">
                  Adults
                  <input
                    type="number"
                    min="1"
                    max={selectedRoom.capacity?.adults || 10}
                    required
                    value={adults}
                    onChange={(e) => setAdults(e.target.value)}
                    className="mt-2 block h-12 w-full rounded-lg border border-stone-300 px-3 font-normal"
                  />
                </label>

                <label className="block text-sm font-semibold text-stone-700">
                  Children
                  <input
                    type="number"
                    min="0"
                    max={selectedRoom.capacity?.children ?? 10}
                    required
                    value={children}
                    onChange={(e) => setChildren(e.target.value)}
                    className="mt-2 block h-12 w-full rounded-lg border border-stone-300 px-3 font-normal"
                  />
                </label>

                <label className="block text-sm font-semibold text-stone-700 sm:col-span-2">
                  Number of rooms
                  <input
                    type="number"
                    min="1"
                    max={selectedRoom.totalRooms || 1}
                    required
                    value={roomsBooked}
                    onChange={(e) => setRoomsBooked(e.target.value)}
                    className="mt-2 block h-12 w-full rounded-lg border border-stone-300 px-3 font-normal"
                  />
                </label>
              </div>

              {nights > 0 && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                  <p className="text-sm text-emerald-900">
                    {nights} {nights === 1 ? "night" : "nights"} × ₹
                    {Number(selectedRoom.pricePerNight).toLocaleString("en-IN")}{" "}
                    × {roomsBooked}{" "}
                    {Number(roomsBooked) === 1 ? "room" : "rooms"}
                  </p>

                  <div className="mt-3 flex items-center justify-between border-t border-emerald-200 pt-3">
                    <span className="font-semibold text-emerald-950">
                      Estimated total
                    </span>

                    <span className="text-2xl font-bold text-emerald-950">
                      ₹{totalPrice.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-emerald-800">
                    Final charges and applicable taxes will be confirmed before
                    payment.
                  </p>
                </div>
              )}

              {bookingError && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                >
                  {bookingError}
                </p>
              )}

              {bookingMessage && (
                <p
                  role="status"
                  className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900"
                >
                  {bookingMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={bookingBusy}
                className="w-full rounded-lg bg-emerald-900 px-5 py-3.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {bookingBusy
                  ? "Creating booking..."
                  : "Confirm booking request"}
              </button>

              <p className="text-xs leading-5 text-stone-500">
                This creates a pending booking only. Payment will be connected
                in the next step.
              </p>
            </form>
          </section>
        )}
      </main>
        <HotelLiveChat hotelId={hotel._id} />
    </div>
  );
}
