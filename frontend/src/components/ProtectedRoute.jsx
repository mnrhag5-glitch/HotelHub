
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  const isAdminRoute = location.pathname.startsWith('/admin')

  const isAdmin =
    String(user?.role || '').toLowerCase() === 'admin' ||
    user?.isAdmin === true

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf9f6]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-emerald-100 border-t-emerald-800" />
            <span className="font-serif text-2xl font-bold text-emerald-900">
              H
            </span>
          </div>
          <p className="animate-pulse text-sm tracking-wide text-stone-500">
            Preparing your HotelHub experience...
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (isAdminRoute && !isAdmin) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#faf9f6] px-5 py-12">
        {/* Ambient background */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 animate-pulse rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 animate-pulse rounded-full bg-amber-100/50 blur-3xl [animation-delay:1s]" />

        {/* Subtle decorative grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(#064e3b 1px, transparent 1px), linear-gradient(90deg, #064e3b 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />

        <section className="relative w-full max-w-lg animate-[fadeInUp_700ms_ease-out_both] rounded-3xl border border-stone-200/80 bg-white/90 p-8 text-center shadow-[0_24px_80px_-32px_rgba(6,78,59,0.22)] backdrop-blur-xl sm:p-12">
          {/* Animated security icon */}
          <div className="relative mx-auto mb-8 flex h-28 w-28 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full border border-emerald-700/15 [animation-duration:3s]" />
            <div className="absolute inset-2 rounded-full border border-emerald-800/10" />

            <div className="relative flex h-20 w-20 items-center justify-center rounded-[26px] bg-gradient-to-br from-emerald-800 to-emerald-950 text-white shadow-xl shadow-emerald-900/20 transition-transform duration-500 hover:rotate-3 hover:scale-105">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-10 w-10"
                aria-hidden="true"
              >
                <path
                  d="M12 3 19 6v5c0 4.5-2.9 8-7 10-4.1-2-7-5.5-7-10V6l7-3Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path
                  d="M9.5 10.5v-1a2.5 2.5 0 0 1 5 0v1M8.5 10.5h7v5h-7z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <span className="absolute right-0 top-1 flex h-8 w-8 animate-bounce items-center justify-center rounded-full border-4 border-white bg-amber-400 text-sm font-bold text-emerald-950 [animation-duration:2s]">
              !
            </span>
          </div>

          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em] text-emerald-800">
            HotelHub Security
          </p>

          <h1 className="font-serif text-3xl font-medium tracking-tight text-stone-900 sm:text-4xl">
            Admin Access Only
          </h1>

          <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-stone-500 sm:text-base">
            This space is reserved for authorized administrators. Your account
            doesn't have permission to enter this area.
          </p>

          <div className="mx-auto mt-7 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-600" />
            </span>
            ACCESS RESTRICTED
          </div>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-950/10 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-emerald-800/20"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path
                  d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1V10Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
              Return to Home
            </Link>

            <Link
              to="/login"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-stone-200 bg-white px-6 py-3 text-sm font-semibold text-stone-700 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-800/30 hover:bg-emerald-50 focus:outline-none focus:ring-4 focus:ring-emerald-800/10"
            >
              Switch Account
            </Link>
          </div>

          <div className="mt-9 border-t border-stone-100 pt-5">
            <p className="text-xs tracking-wide text-stone-400">
              Protected by HotelHub · Secure stays, trusted service
            </p>
          </div>
        </section>

        <style>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(22px) scale(0.985);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              scroll-behavior: auto !important;
              transition-duration: 0.01ms !important;
            }
          }
        `}</style>
      </main>
    )
  }

  return <Outlet />
}
