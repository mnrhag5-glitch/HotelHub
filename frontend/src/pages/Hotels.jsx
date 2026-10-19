
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiRequest } from '../api/client'
import Navbar from '../components/Navbar'

const fallbackImage =
  'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1000&q=80'

function HotelCard({ hotel }) {
  const [imageIndex, setImageIndex] = useState(0)
  const [imageErrors, setImageErrors] = useState([])

  const images = useMemo(() => {
    const list = Array.isArray(hotel.images)
      ? hotel.images.filter(
          (image) => typeof image === 'string' && image.trim(),
        )
      : []

    return list.length ? list : [fallbackImage]
  }, [hotel.images])

  const currentImage = imageErrors.includes(imageIndex)
    ? fallbackImage
    : images[imageIndex]

  const location = [
    hotel.location?.city,
    hotel.location?.state,
  ].filter(Boolean).join(', ')

  const price = hotel.pricePerNight ??
    hotel.minPrice ??
    hotel.startingPrice

  const rating = Number(hotel.rating)

  return (
    <article className="group overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-900/10 dark:border-stone-700 dark:bg-stone-900">
      <div className="relative h-64 overflow-hidden bg-stone-100 dark:bg-stone-800 sm:h-72">
        <img
          src={currentImage}
          alt={`${hotel.name || 'Hotel'}${location ? ` in ${location}` : ''}`}
          loading="lazy"
          decoding="async"
          onError={() => {
            setImageErrors((previous) =>
              previous.includes(imageIndex)
                ? previous
                : [...previous, imageIndex],
            )
          }}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />

        <span className="absolute left-4 top-4 rounded-full border border-white/60 bg-white/95 px-3 py-1.5 text-[11px] font-bold tracking-wide text-emerald-950 shadow-sm">
          HOTELHUB STAY
        </span>

        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous hotel photo"
              onClick={() =>
                setImageIndex((index) =>
                  (index - 1 + images.length) % images.length,
                )
              }
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg text-stone-900 shadow transition hover:bg-white"
            >
              ‹
            </button>

            <button
              type="button"
              aria-label="Next hotel photo"
              onClick={() =>
                setImageIndex((index) =>
                  (index + 1) % images.length,
                )
              }
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg text-stone-900 shadow transition hover:bg-white"
            >
              ›
            </button>

            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
              {images.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Show photo ${index + 1}`}
                  onClick={() => setImageIndex(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === imageIndex
                      ? 'w-6 bg-white'
                      : 'w-1.5 bg-white/60'
                  }`}
                />
              ))}
            </div>

            <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white backdrop-blur-sm">
              {imageIndex + 1}/{images.length} photos
            </span>
          </>
        )}

        {Number.isFinite(rating) && rating > 0 && (
          <span className="absolute bottom-4 left-4 rounded-lg bg-white px-3 py-2 text-sm font-bold text-stone-900 shadow-sm">
            <span className="text-amber-500">★</span>{' '}
            {rating.toFixed(1)}
          </span>
        )}
      </div>

      <div className="p-5 sm:p-6">
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
          <span className="text-emerald-800 dark:text-emerald-400">⌖</span>
          {location || 'Discover this destination'}
        </p>

        <h2 className="mt-2 font-serif text-2xl leading-snug text-stone-900 dark:text-stone-100">
          {hotel.name || 'Beautiful hotel'}
        </h2>

        <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-500 dark:text-stone-400">
          {hotel.description ||
            'Discover a comfortable stay and explore everything this destination has to offer.'}
        </p>

        {hotel.amenities?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {hotel.amenities.slice(0, 3).map((amenity) => (
              <span
                key={amenity}
                className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
              >
                {amenity}
              </span>
            ))}
            {hotel.amenities.length > 3 && (
              <span className="px-1 py-1.5 text-xs text-stone-500 dark:text-stone-400">
                +{hotel.amenities.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="my-5 border-t border-stone-100 dark:border-stone-700" />

        <div className="flex items-end justify-between gap-3">
          <div>
            {price != null && Number.isFinite(Number(price)) ? (
              <>
                <p className="text-[11px] font-medium uppercase tracking-wider text-stone-400 dark:text-stone-500">
                  Starting from
                </p>
                <p className="mt-1 text-xl font-bold text-stone-900 dark:text-stone-100">
                  ₹{Number(price).toLocaleString('en-IN')}
                  <span className="ml-1 text-xs font-normal text-stone-500 dark:text-stone-400">
                    / night
                  </span>
                </p>
              </>
            ) : (
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Explore rooms & pricing
              </p>
            )}
          </div>

          <a
            href={`/hotels/${hotel._id || hotel.id}`}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2 dark:focus:ring-offset-stone-900"
          >
            Explore <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </article>
  )
}

export default function Hotels() {
  const [searchParams] = useSearchParams()
  const [hotels, setHotels] = useState([])
  const [search, setSearch] = useState(
    () => searchParams.get('search') || '',
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [selectedAmenity, setSelectedAmenity] = useState('')

  useEffect(() => {
    let active = true

    apiRequest('/api/hotels')
      .then((data) => {
        if (!active) return
        const list = Array.isArray(data) ? data : data.hotels
        setHotels(Array.isArray(list) ? list : [])
      })
      .catch((err) => {
        if (active) setError(err.message || 'Unable to load hotels.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const amenities = useMemo(
    () => [
      ...new Set(
        hotels.flatMap((hotel) =>
          Array.isArray(hotel.amenities) ? hotel.amenities : [],
        ),
      ),
    ].sort(),
    [hotels],
  )

  const filteredHotels = useMemo(() => {
    const term = search.trim().toLowerCase()

    const result = hotels.filter((hotel) => {
      const searchable = [
        hotel.name,
        hotel.description,
        hotel.location?.city,
        hotel.location?.state,
        hotel.location?.address,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesSearch = !term || searchable.includes(term)

      const matchesAmenity =
        !selectedAmenity ||
        hotel.amenities?.some(
          (amenity) =>
            amenity.toLowerCase() === selectedAmenity.toLowerCase(),
        )

      return matchesSearch && matchesAmenity
    })

    if (sortBy === 'name-asc') {
      result.sort((a, b) =>
        (a.name || '').localeCompare(b.name || ''),
      )
    } else if (sortBy === 'name-desc') {
      result.sort((a, b) =>
        (b.name || '').localeCompare(a.name || ''),
      )
    } else if (sortBy === 'rating') {
      result.sort(
        (a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0),
      )
    }

    return result
  }, [hotels, search, selectedAmenity, sortBy])

  function clearFilters() {
    setSearch('')
    setSortBy('newest')
    setSelectedAmenity('')
  }

  return (
    <div className="min-h-screen bg-[#fbfaf7] transition-colors duration-300 dark:bg-stone-950">
      <Navbar />

      <section className="relative isolate overflow-hidden bg-emerald-950 px-5 py-24 text-white sm:px-8 sm:py-32 lg:px-12 lg:py-36">
        <img
          src="https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=2000&q=85"
          alt="A peaceful mountain retreat"
          fetchPriority="high"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-emerald-950/95 via-emerald-950/70 to-emerald-950/20" />

        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold tracking-[0.28em] text-emerald-200">
            YOUR NEXT ESCAPE
          </p>

          <h1 className="mt-5 max-w-3xl font-serif text-5xl leading-[1.08] sm:text-6xl lg:text-7xl">
            Find your{' '}
            <i className="font-normal text-emerald-200">
              happy place.
            </i>
          </h1>

          <p className="mt-6 max-w-xl text-sm leading-7 text-white/80 sm:text-base">
            From breathtaking views to thoughtful hospitality, discover
            stays that make every journey special.
          </p>

          <a
            href="#explore-stays"
            className="mt-8 inline-flex items-center gap-3 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-emerald-950 transition hover:bg-emerald-50"
          >
            Discover stays <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>

      <main
        id="explore-stays"
        className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-16 lg:px-12 lg:py-20"
      >
        <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-bold tracking-[0.22em] text-emerald-800 dark:text-emerald-400">
              EXPLORE HOTELHUB
            </p>
            <h2 className="mt-3 font-serif text-4xl leading-tight text-stone-900 dark:text-stone-100 sm:text-5xl">
              Stays made for you.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-stone-500 dark:text-stone-400">
              Find your next favourite place, whether it is a peaceful
              mountain escape or a memorable weekend away.
            </p>
          </div>

          <div className="flex w-full items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 shadow-sm transition-colors dark:border-stone-700 dark:bg-stone-900 focus-within:border-emerald-800 focus-within:ring-2 focus-within:ring-emerald-800/10 lg:max-w-md">
            <span className="text-lg text-stone-400" aria-hidden="true">
              ⌕
            </span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search hotels or destinations..."
              aria-label="Search hotels"
              className="h-14 min-w-0 flex-1 bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400 dark:text-stone-100 dark:placeholder:text-stone-500"
            />
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-stone-200 bg-white p-4 transition-colors duration-300 dark:border-stone-700 dark:bg-stone-900 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <div>
              <label
                htmlFor="sort-hotels"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400"
              >
                Sort by
              </label>
              <select
                id="sort-hotels"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="h-12 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm text-stone-900 outline-none focus:border-emerald-800 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
              >
                <option value="newest">Default order</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
                <option value="rating">Highest rated</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="filter-amenity"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400"
              >
                Hotel amenities
              </label>
              <select
                id="filter-amenity"
                value={selectedAmenity}
                onChange={(event) =>
                  setSelectedAmenity(event.target.value)
                }
                className="h-12 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm text-stone-900 outline-none focus:border-emerald-800 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
              >
                <option value="">All amenities</option>
                {amenities.map((amenity) => (
                  <option key={amenity} value={amenity}>
                    {amenity}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="h-12 rounded-xl border border-stone-200 px-5 text-sm font-semibold text-stone-700 transition hover:border-stone-300 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Clear filters
            </button>
          </div>
        </div>

        {!loading && !error && (
          <div className="mb-6 flex items-center justify-between gap-4">
            <p className="text-sm text-stone-600 dark:text-stone-400">
              <span className="font-bold text-stone-900 dark:text-stone-100">
                {filteredHotels.length}
              </span>{' '}
              {filteredHotels.length === 1 ? 'stay' : 'stays'} to explore
            </p>
            {(search || selectedAmenity) && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-semibold text-emerald-900 hover:underline dark:text-emerald-400"
              >
                Reset search
              </button>
            )}
          </div>
        )}

        {loading && (
          <div
            role="status"
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900"
              >
                <div className="h-64 bg-stone-200 dark:bg-stone-700" />
                <div className="space-y-3 p-5">
                  <div className="h-3 w-1/3 rounded bg-stone-200 dark:bg-stone-700" />
                  <div className="h-6 w-3/4 rounded bg-stone-200 dark:bg-stone-700" />
                  <div className="h-4 rounded bg-stone-100 dark:bg-stone-800" />
                  <div className="h-4 w-2/3 rounded bg-stone-100 dark:bg-stone-800" />
                </div>
              </div>
            ))}
            <span className="sr-only">Loading hotels...</span>
          </div>
        )}

        {!loading && error && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800"
          >
            <p>Hotels could not be loaded: {error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-emerald-950 px-4 py-2.5 font-semibold text-white hover:bg-emerald-800"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && filteredHotels.length === 0 && (
          <div className="rounded-2xl border border-stone-200 bg-white px-6 py-16 text-center dark:border-stone-700 dark:bg-stone-900">
            <div className="text-4xl" aria-hidden="true">⌕</div>
            <h3 className="mt-4 font-serif text-2xl text-stone-900 dark:text-stone-100">
              {hotels.length
                ? 'No stays match your search'
                : 'Your next escape is coming soon'}
            </h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-stone-500 dark:text-stone-400">
              {hotels.length
                ? 'Try another destination or remove a filter to see more hotels.'
                : 'There are no hotels available right now. Please check back later.'}
            </p>
            {hotels.length > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 rounded-xl bg-emerald-950 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {!loading && !error && filteredHotels.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredHotels.map((hotel) => (
              <HotelCard
                key={hotel._id || hotel.id}
                hotel={hotel}
              />
            ))}
          </div>
        )}

        <div className="mt-16 rounded-2xl bg-emerald-950 px-6 py-10 text-center text-white sm:px-10 sm:py-12">
          <p className="text-xs font-bold tracking-[0.22em] text-emerald-200">
            YOUR JOURNEY STARTS HERE
          </p>
          <h2 className="mt-3 font-serif text-3xl sm:text-4xl">
            Somewhere wonderful awaits.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/75">
            Explore available stays and find the right setting for your
            next getaway.
          </p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-bold text-emerald-950 transition hover:bg-emerald-50"
          >
            Back to top ↑
          </button>
        </div>
      </main>
    </div>
  )
}
