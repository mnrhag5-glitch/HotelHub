
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { apiRequest } from '../api/client'

const destinations = [
  {
    name: 'Manali',
    country: 'Himachal Pradesh, India',
    image:
      'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=900&q=85',
  },
  {
    name: 'Goa',
    country: 'India',
    image:
      'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=900&q=85',
  },
  {
    name: 'Udaipur',
    country: 'Rajasthan, India',
    image:
      'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=900&q=85',
  },
  {
    name: 'Shimla',
    country: 'Himachal Pradesh, India',
    image:
      'https://images.unsplash.com/photo-1597074866923-dc0589150358?auto=format&fit=crop&w=900&q=85',
  },
]

const benefits = [
  {
    icon: '⌕',
    title: 'Find your perfect stay',
    description:
      'Explore stays and discover places that fit your travel plans.',
  },
  {
    icon: '♡',
    title: 'Travel with confidence',
    description:
      'View property details and amenities before making your decision.',
  },
  {
    icon: '✳',
    title: 'Easy booking experience',
    description:
      'A smooth journey from exploring properties to managing bookings.',
  },
]

const testimonials = [
  {
    quote:
      'The best trips start with finding a place that feels right. HotelHub makes exploring your options easier.',
    name: 'A better way to travel',
    detail: 'Made for curious travellers',
  },
  {
    quote:
      'From peaceful mountain escapes to relaxing beach stays, there is always somewhere new to discover.',
    name: 'Your next adventure',
    detail: 'Find your kind of getaway',
  },
  {
    quote:
      'Less time figuring things out, more time looking forward to the journey ahead.',
    name: 'Travel made simpler',
    detail: 'Your journey, your way',
  },
]

function SectionHeading({ eyebrow, title, description, light = false }) {
  return (
    <div className="max-w-2xl">
      <p
        className={`text-xs font-bold uppercase tracking-[0.22em] ${
          light
            ? 'text-emerald-200'
            : 'text-emerald-800 dark:text-emerald-300'
        }`}
      >
        {eyebrow}
      </p>

      <h2
        className={`mt-3 font-serif text-3xl leading-tight sm:text-4xl lg:text-5xl ${
          light ? 'text-white' : 'text-stone-900 dark:text-stone-100'
        }`}
      >
        {title}
      </h2>

      {description && (
        <p
          className={`mt-4 max-w-xl text-sm leading-7 sm:text-base ${
            light
              ? 'text-white/70'
              : 'text-stone-500 dark:text-stone-400'
          }`}
        >
          {description}
        </p>
      )}
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const [hotels, setHotels] = useState([])
  const [destination, setDestination] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState('2 guests')
  const [loadingHotels, setLoadingHotels] = useState(true)

  useEffect(() => {
    let active = true

    apiRequest('/api/hotels')
      .then((data) => {
        if (!active) return
        const list = Array.isArray(data) ? data : data?.hotels
        setHotels(Array.isArray(list) ? list.slice(0, 3) : [])
      })
      .catch((error) => {
        console.error('Unable to load featured hotels:', error)
        if (active) setHotels([])
      })
      .finally(() => {
        if (active) setLoadingHotels(false)
      })

    return () => {
      active = false
    }
  }, [])

  function handleSearch(event) {
    event.preventDefault()

    const params = new URLSearchParams()
    if (destination.trim()) params.set('search', destination.trim())
    if (checkIn) params.set('checkIn', checkIn)
    if (checkOut) params.set('checkOut', checkOut)
    params.set('guests', guests)

    navigate(`/hotels?${params.toString()}`)
  }

  const today = new Date().toISOString().split('T')[0]

  const inputClass =
    'h-12 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-900 outline-none transition-colors focus:border-emerald-800 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:[color-scheme:dark]'

  const labelClass =
    'mb-2 block text-xs font-bold text-stone-800 dark:text-stone-200'

  return (
    <div className="min-h-screen bg-[#fbfaf7] text-stone-900 transition-colors duration-300 dark:bg-stone-950 dark:text-stone-100">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative isolate min-h-[650px] overflow-hidden bg-emerald-950 sm:min-h-[700px]">
          <img
            src="https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=2400&q=90"
            alt="Beautiful peaceful holiday retreat surrounded by nature"
            fetchPriority="high"
            className="absolute inset-0 -z-20 h-full w-full object-cover"
          />

          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-emerald-950/90 via-emerald-950/55 to-emerald-950/20" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-emerald-950/70 via-transparent to-emerald-950/10" />

          <div className="mx-auto flex min-h-[650px] max-w-7xl flex-col justify-center px-5 pb-24 pt-20 sm:min-h-[700px] sm:px-8 lg:px-12">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-medium tracking-wide text-white backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                A little closer to your next escape
              </div>

              <h1 className="mt-7 font-serif text-5xl leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-8xl">
                Stay somewhere
                <br />
                <span className="italic text-emerald-200">
                  wonderful.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-sm leading-7 text-white/80 sm:text-base sm:leading-8">
                From quiet mountain hideaways to sunlit coastal retreats,
                discover stays that make the journey just as special as
                the destination.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#find-your-stay"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-emerald-300 px-6 text-sm font-bold text-emerald-950 transition hover:bg-emerald-200"
                >
                  Find your stay <span aria-hidden="true">↗</span>
                </a>

                <Link
                  to="/hotels"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/35 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  Explore all stays
                </Link>
              </div>
            </div>

            <div className="mt-14 flex flex-wrap gap-x-8 gap-y-3 text-xs text-white/80 sm:text-sm">
              <span className="flex items-center gap-2">
                <span className="text-emerald-200">✳</span>
                Handpicked destinations
              </span>
              <span className="flex items-center gap-2">
                <span className="text-emerald-200">♡</span>
                Stays for every journey
              </span>
              <span className="flex items-center gap-2">
                <span className="text-emerald-200">↗</span>
                Easy exploration
              </span>
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-0 right-0 hidden h-48 w-48 translate-x-1/4 translate-y-1/4 rounded-full border border-white/15 lg:block" />
          <div className="pointer-events-none absolute bottom-8 right-16 hidden h-28 w-28 rounded-full border border-white/15 lg:block" />
        </section>

        {/* Search */}
        <section
          id="find-your-stay"
          className="relative z-10 mx-auto -mt-10 max-w-7xl px-4 sm:px-8 lg:px-12"
        >
          <form
            onSubmit={handleSearch}
            className="grid gap-4 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-[0_20px_70px_-30px_rgba(28,45,35,0.3)] transition-colors duration-300 dark:border-stone-700 dark:bg-stone-900 sm:grid-cols-2 sm:p-6 lg:grid-cols-[1.5fr_1fr_1fr_0.9fr_auto] lg:items-end lg:gap-5"
          >
            <div>
              <label htmlFor="destination" className={labelClass}>
                Where to?
              </label>

              <div className="flex h-12 items-center gap-3 rounded-lg border border-stone-200 px-3 transition-colors focus-within:border-emerald-800 dark:border-stone-700 dark:bg-stone-800 dark:focus-within:border-emerald-400">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  className="h-5 w-5 shrink-0 text-emerald-800 dark:text-emerald-300"
                >
                  <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>

                <input
                  id="destination"
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  placeholder="City or destination"
                  className="min-w-0 w-full bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400 dark:text-stone-100 dark:placeholder:text-stone-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="checkin" className={labelClass}>
                Check-in
              </label>
              <input
                id="checkin"
                type="date"
                min={today}
                value={checkIn}
                onChange={(event) => {
                  setCheckIn(event.target.value)
                  if (checkOut && event.target.value >= checkOut) {
                    setCheckOut('')
                  }
                }}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="checkout" className={labelClass}>
                Check-out
              </label>
              <input
                id="checkout"
                type="date"
                min={checkIn || today}
                value={checkOut}
                onChange={(event) => setCheckOut(event.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="guests" className={labelClass}>
                Travellers
              </label>
              <select
                id="guests"
                value={guests}
                onChange={(event) => setGuests(event.target.value)}
                className={inputClass}
              >
                <option>1 guest</option>
                <option>2 guests</option>
                <option>3 guests</option>
                <option>4 guests</option>
                <option>5+ guests</option>
              </select>
            </div>

            <button
              type="submit"
              className="h-12 rounded-lg bg-emerald-900 px-6 text-sm font-bold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2 lg:px-7"
            >
              Search stays
            </button>
          </form>
        </section>

        {/* Destinations */}
        <section
          id="destinations"
          className="mx-auto max-w-7xl px-5 py-20 transition-colors duration-300 sm:px-8 sm:py-24 lg:px-12 lg:py-28"
        >
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <SectionHeading
              eyebrow="Places worth discovering"
              title="Where will you go next?"
              description="A change of scenery can change everything. Find inspiration for the journey you've been dreaming about."
            />
            <Link
              to="/hotels"
              className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-emerald-900 hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-200"
            >
              Explore stays <span aria-hidden="true">↗</span>
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {destinations.map((place, index) => (
              <Link
                key={place.name}
                to={`/hotels?search=${encodeURIComponent(place.name)}`}
                className={`group relative isolate overflow-hidden rounded-2xl bg-stone-200 ${
                  index % 2 === 0
                    ? 'h-64 sm:h-80'
                    : 'h-64 sm:mt-8 sm:h-80'
                }`}
              >
                <img
                  src={place.image}
                  alt={`${place.name} travel destination`}
                  loading="lazy"
                  className="absolute inset-0 -z-20 h-full w-full object-cover transition duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/10 to-black/5" />
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                  <p className="text-xs text-white/75">{place.country}</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <h3 className="font-serif text-xl text-white sm:text-2xl">
                      {place.name}
                    </h3>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/60 text-white transition group-hover:bg-white group-hover:text-emerald-950">
                      ↗
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <p className="mt-5 text-xs leading-5 text-stone-400 dark:text-stone-500">
            Destination cards are travel inspiration. Available properties
            are shown in the live hotel listings.
          </p>
        </section>

        {/* Featured stays */}
        <section className="bg-[#f1f0e9] transition-colors duration-300 dark:bg-stone-900">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <SectionHeading
                eyebrow="Your next favourite place"
                title="Stays to fall in love with."
                description="Explore available properties and find the right place to slow down, recharge, and make memories."
              />
              <Link
                to="/hotels"
                className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-emerald-900 hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-200"
              >
                View all hotels <span aria-hidden="true">↗</span>
              </Link>
            </div>

            {loadingHotels ? (
              <div className="mt-10 grid gap-6 md:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="overflow-hidden rounded-2xl bg-white dark:bg-stone-800"
                  >
                    <div className="h-56 animate-pulse bg-stone-200 dark:bg-stone-700" />
                    <div className="space-y-3 p-5">
                      <div className="h-3 w-1/3 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
                      <div className="h-5 w-2/3 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
                      <div className="h-3 w-full animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
                    </div>
                  </div>
                ))}
              </div>
            ) : hotels.length > 0 ? (
              <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {hotels.map((hotel) => (
                  <article
                    key={hotel._id || hotel.id}
                    className="group overflow-hidden rounded-2xl border border-stone-200/80 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-900/5 dark:border-stone-700 dark:bg-stone-800"
                  >
                    <Link
                      to={`/hotels/${hotel._id || hotel.id}`}
                      className="block"
                    >
                      <div className="relative h-56 overflow-hidden bg-stone-200 dark:bg-stone-700">
                        <img
                          src={
                            hotel.images?.[0] ||
                            'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=85'
                          }
                          alt={hotel.name || 'Hotel property'}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        />
                        <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-bold text-emerald-900">
                          Available stay
                        </span>
                      </div>
                    </Link>

                    <div className="p-5">
                      <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
                        {[hotel.location?.city, hotel.location?.state]
                          .filter(Boolean)
                          .join(', ')}
                      </p>

                      <Link to={`/hotels/${hotel._id || hotel.id}`}>
                        <h3 className="mt-2 font-serif text-2xl text-stone-900 transition group-hover:text-emerald-800 dark:text-stone-100 dark:group-hover:text-emerald-300">
                          {hotel.name}
                        </h3>
                      </Link>

                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-stone-500 dark:text-stone-400">
                        {hotel.description}
                      </p>

                      {hotel.amenities?.length > 0 && (
                        <p className="mt-4 text-xs text-emerald-800 dark:text-emerald-300">
                          {hotel.amenities.slice(0, 3).join(' · ')}
                        </p>
                      )}

                      <Link
                        to={`/hotels/${hotel._id || hotel.id}`}
                        className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-emerald-900 dark:text-emerald-300"
                      >
                        View property <span aria-hidden="true">↗</span>
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-10 rounded-2xl border border-dashed border-stone-300 bg-white/70 px-6 py-12 text-center transition-colors dark:border-stone-700 dark:bg-stone-800/70 sm:px-10">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-300">
                  ♧
                </div>
                <h3 className="mt-5 font-serif text-2xl text-stone-900 dark:text-stone-100">
                  Your next stay is waiting to be discovered.
                </h3>
                <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-stone-500 dark:text-stone-400">
                  We're getting our collection ready. Explore destinations
                  for inspiration, or check back as new properties become
                  available.
                </p>
                <Link
                  to="/hotels"
                  className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-900 px-5 text-sm font-bold text-white hover:bg-emerald-800"
                >
                  Explore hotels
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Brand story */}
        <section
          id="about"
          className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28"
        >
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="relative">
              <div className="absolute -left-3 -top-3 h-28 w-28 rounded-tl-3xl border-l-2 border-t-2 border-emerald-800/35 dark:border-emerald-400/35 sm:-left-5 sm:-top-5" />
              <img
                src="https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1400&q=90"
                alt="Warm, inviting hotel room with a view"
                loading="lazy"
                className="relative h-[350px] w-full rounded-2xl object-cover sm:h-[470px]"
              />
              <div className="absolute -bottom-5 right-3 max-w-[230px] rounded-xl bg-white p-4 shadow-xl dark:bg-stone-800 sm:right-6 sm:p-5">
                <p className="font-serif text-xl text-emerald-950 dark:text-emerald-200">
                  Make room for wonder.
                </p>
                <p className="mt-1 text-xs leading-5 text-stone-500 dark:text-stone-400">
                  Every journey starts somewhere.
                </p>
              </div>
            </div>

            <div className="pt-4 lg:pl-4">
              <SectionHeading
                eyebrow="A more thoughtful way to travel"
                title="It's not just where you stay. It's how you feel."
                description="We believe the right place can turn a simple trip into something unforgettable. HotelHub helps you explore places to stay, discover destinations, and plan your next escape with confidence."
              />

              <div className="mt-8 space-y-5">
                {[
                  [
                    '01',
                    'Discover your possibilities',
                    'Explore destinations and available properties in one place.',
                  ],
                  [
                    '02',
                    'Find the details that matter',
                    'Compare location, amenities, and property information.',
                  ],
                  [
                    '03',
                    'Make the journey yours',
                    'Choose the stay that feels right for your plans.',
                  ],
                ].map(([number, title, description]) => (
                  <div
                    key={number}
                    className="flex gap-4 border-b border-stone-200 pb-5 dark:border-stone-800"
                  >
                    <span className="pt-1 text-xs font-bold tracking-widest text-emerald-800 dark:text-emerald-300">
                      {number}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                        {title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-stone-500 dark:text-stone-400">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                to="/hotels"
                className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-lg bg-emerald-900 px-6 text-sm font-bold text-white transition hover:bg-emerald-800"
              >
                Start exploring <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="bg-emerald-950">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
            <SectionHeading
              eyebrow="The HotelHub difference"
              title="A little more ease. A lot more adventure."
              description="Travel planning should feel exciting, not complicated. We're building an experience that puts your next journey first."
              light
            />

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {benefits.map((benefit, index) => (
                <article
                  key={benefit.title}
                  className="rounded-2xl border border-white/15 bg-white/[0.05] p-7 transition hover:border-emerald-300/50 hover:bg-white/[0.08] sm:p-8"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-300 text-2xl text-emerald-950">
                    {benefit.icon}
                  </span>
                  <p className="mt-7 text-xs font-bold tracking-widest text-emerald-200">
                    0{index + 1}
                  </p>
                  <h3 className="mt-2 font-serif text-2xl text-white">
                    {benefit.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-white/65">
                    {benefit.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Inspiration */}
        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14">
            <SectionHeading
              eyebrow="Collect moments, not just plans"
              title="Some places stay with you."
              description="A sunrise from the mountains. An afternoon by the sea. A quiet morning with nowhere else to be. Your next favourite memory could start with a stay you haven't discovered yet."
            />

            <div className="grid grid-cols-2 gap-4">
              <img
                src="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=900&q=85"
                alt="Peaceful mountain lake surrounded by nature"
                loading="lazy"
                className="h-52 w-full rounded-2xl object-cover sm:h-72"
              />
              <img
                src="https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=900&q=85"
                alt="Ocean waves on a sunny coast"
                loading="lazy"
                className="mt-8 h-52 w-full rounded-2xl object-cover sm:mt-12 sm:h-72"
              />
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="border-y border-stone-200 bg-white transition-colors dark:border-stone-800 dark:bg-stone-900">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24 lg:px-12">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-800 dark:text-emerald-300">
                Made for the moments ahead
              </p>
              <h2 className="mt-3 font-serif text-3xl text-stone-900 dark:text-stone-100 sm:text-4xl">
                Your journey deserves a good beginning.
              </h2>
              <p className="mt-4 text-sm leading-7 text-stone-500 dark:text-stone-400">
                Find inspiration, explore real properties, and plan a stay
                that feels like yours.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {testimonials.map((item) => (
                <article
                  key={item.name}
                  className="rounded-2xl bg-[#fbfaf7] p-6 transition-colors dark:bg-stone-800 sm:p-7"
                >
                  <div
                    className="text-3xl text-emerald-800 dark:text-emerald-300"
                    aria-hidden="true"
                  >
                    “
                  </div>
                  <p className="mt-2 text-sm leading-7 text-stone-600 dark:text-stone-300">
                    {item.quote}
                  </p>
                  <div className="mt-6 border-t border-stone-200 pt-4 dark:border-stone-700">
                    <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      {item.name}
                    </p>
                    <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                      {item.detail}
                    </p>
                  </div>
                </article>
              ))}
            </div>

            <p className="mt-5 text-center text-xs text-stone-400 dark:text-stone-500">
              These are brand messages, not customer reviews.
            </p>
          </div>
        </section>

        {/* Contact CTA */}
        <section
          id="contact"
          className="px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28"
        >
          <div className="relative isolate mx-auto max-w-7xl overflow-hidden rounded-3xl bg-emerald-900 px-6 py-12 sm:px-12 sm:py-16 lg:px-16 lg:py-20">
            <div className="absolute -right-16 -top-24 -z-10 h-80 w-80 rounded-full border border-white/15" />
            <div className="absolute -right-2 -top-10 -z-10 h-52 w-52 rounded-full border border-white/15" />

            <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-200">
                  Your next chapter awaits
                </p>
                <h2 className="mt-4 font-serif text-3xl leading-tight text-white sm:text-5xl">
                  Ready to find your happy place?
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-white/75 sm:text-base">
                  Start exploring destinations and discover the places that
                  could make your next trip unforgettable.
                </p>
              </div>

              <Link
                to="/hotels"
                className="inline-flex min-h-12 items-center justify-center gap-3 rounded-lg bg-emerald-200 px-6 text-sm font-bold text-emerald-950 transition hover:bg-white"
              >
                Explore hotels <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#172a22] text-white">
        <div className="mx-auto max-w-7xl px-5 pb-8 pt-14 sm:px-8 sm:pt-16 lg:px-12">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr] lg:gap-12">
            <div>
              <Link to="/" className="inline-flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-300 font-serif text-xl font-bold text-emerald-950">
                  H
                </span>
                <span className="font-serif text-2xl">HotelHub</span>
              </Link>
              <p className="mt-5 max-w-xs text-sm leading-7 text-white/60">
                Find places to stay, discover new destinations, and make
                room for the journeys that matter.
              </p>
              <a
                href="mailto:support@hotelhub.com"
                className="mt-5 inline-flex text-sm text-emerald-200 transition hover:text-white"
              >
                Contact support ↗
              </a>
            </div>

            <div>
              <h3 className="text-sm font-bold">Explore</h3>
              <ul className="mt-5 space-y-3 text-sm text-white/60">
                <li>
                  <Link className="transition hover:text-white" to="/hotels">
                    All hotels
                  </Link>
                </li>
                <li>
                  <a className="transition hover:text-white" href="#destinations">
                    Destinations
                  </a>
                </li>
                <li>
                  <a className="transition hover:text-white" href="#find-your-stay">
                    Find a stay
                  </a>
                </li>
                <li>
                  <Link className="transition hover:text-white" to="/login">
                    Your account
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold">About HotelHub</h3>
              <ul className="mt-5 space-y-3 text-sm text-white/60">
                <li>
                  <a className="transition hover:text-white" href="#about">
                    Our story
                  </a>
                </li>
                <li>
                  <a className="transition hover:text-white" href="#contact">
                    Contact us
                  </a>
                </li>
                <li>
                  <a className="transition hover:text-white" href="#faqs">
                    FAQs
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold">Need a hand?</h3>
              <p className="mt-5 text-sm leading-7 text-white/60">
                Have a question about exploring or booking a stay? Get in
                touch with our support team.
              </p>
              <a
                href="mailto:support@hotelhub.com"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-200 hover:text-white"
              >
                support@hotelhub.com <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-4 border-t border-white/15 pt-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} HotelHub. All rights reserved.</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <span>Travel thoughtfully.</span>
              <span>Discover wonderfully.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
