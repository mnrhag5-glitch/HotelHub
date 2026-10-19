
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [dark, setDark] = useState(
    () => localStorage.getItem('hotelhub-theme') === 'dark'
  )
  const [profileOpen, setProfileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('hotelhub-theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    const closeMenu = (event) => {
      if (event.key === 'Escape') setProfileOpen(false)
    }

    window.addEventListener('keydown', closeMenu)
    return () => window.removeEventListener('keydown', closeMenu)
  }, [])

  const handleLogout = async () => {
    if (loggingOut) return

    setLoggingOut(true)

    try {
      const response = await fetch(
        'http://localhost:3000/api/users/logout',
        {
          method: 'POST',
          credentials: 'include',
        }
      )

      if (!response.ok) {
        throw new Error('Logout failed')
      }

      setProfileOpen(false)
      navigate('/login', { replace: true })
      window.location.reload()
    } catch (error) {
      console.error('Logout error:', error)
      setLoggingOut(false)
    }
  }

  const userInitial = (user?.name || user?.email || 'U')
    .charAt(0)
    .toUpperCase()

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-white/95 backdrop-blur-xl dark:border-stone-800 dark:bg-stone-950/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 lg:px-8">

        {/* Logo */}
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2.5 text-2xl font-bold tracking-tight text-stone-900 dark:text-white"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl rounded-bl-sm bg-emerald-900 font-serif text-xl text-white shadow-sm">
            H
          </span>

          <span>
            Hotel<span className="text-emerald-700 dark:text-emerald-400">Hub</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-8 text-sm font-medium text-stone-600 dark:text-stone-300 md:flex">
          <Link
            to="/hotels"
            className="transition-colors hover:text-emerald-800 dark:hover:text-emerald-400"
          >
            Explore stays
          </Link>

          <a
            href="/#destinations"
            className="transition-colors hover:text-emerald-800 dark:hover:text-emerald-400"
          >
            Destinations
          </a>
        </nav>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">

          {/* Dark / Light Theme */}

{/* Professional Dark / Light Theme Toggle */}
<button
  type="button"
  onClick={() => setDark((current) => !current)}
  aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
  title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
  className="group grid h-10 w-10 place-items-center rounded-xl border border-stone-200 bg-white text-stone-600 transition-all duration-200 hover:border-emerald-700/40 hover:bg-emerald-50 hover:text-emerald-800 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-amber-300"
>
  {dark ? (
    /* Sun icon — Light Mode */
    <svg
      className="h-5 w-5 transition-transform duration-300 group-hover:rotate-45"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.42 1.42" />
      <path d="m17.65 17.65 1.42 1.42" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.35 17.65-1.42 1.42" />
      <path d="m19.07 4.93-1.42 1.42" />
    </svg>
  ) : (
    /* Moon icon — Dark Mode */
    <svg
      className="h-5 w-5 transition-transform duration-300 group-hover:-rotate-12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />
    </svg>
  )}
</button>


          {user ? (
            /* Logged-in Profile */
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                aria-expanded={profileOpen}
                aria-haspopup="true"
                className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white p-1.5 pr-2.5 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:hover:bg-stone-800 sm:gap-3 sm:pr-3"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-900 text-sm font-semibold text-white">
                  {userInitial}
                </span>

                <span className="hidden max-w-32 text-left sm:block">
                  <span className="block truncate text-sm font-semibold text-stone-900 dark:text-white">
                    {user.name || 'My Account'}
                  </span>
                  <span className="block text-xs text-stone-500 dark:text-stone-400">
                    My account
                  </span>
                </span>

                <svg
                  className={`hidden h-4 w-4 text-stone-500 transition-transform sm:block ${
                    profileOpen ? 'rotate-180' : ''
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {profileOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close profile menu"
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setProfileOpen(false)}
                  />

                  <div className="absolute right-0 top-full z-50 mt-3 w-64 overflow-hidden rounded-2xl border border-stone-200 bg-white p-2 shadow-xl shadow-stone-900/10 dark:border-stone-700 dark:bg-stone-900">
                    <div className="border-b border-stone-100 px-3 py-3 dark:border-stone-800">
                      <p className="truncate text-sm font-semibold text-stone-900 dark:text-white">
                        {user.name || 'Welcome'}
                      </p>
                      <p className="mt-1 truncate text-xs text-stone-500 dark:text-stone-400">
                        {user.email}
                      </p>
                    </div>

                    
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setProfileOpen(false)}
                        className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-emerald-50 hover:text-emerald-900 dark:text-stone-200 dark:hover:bg-stone-800 dark:hover:text-emerald-400"
                      >
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          aria-hidden="true"
                        >
                          <rect x="3" y="4" width="18" height="16" rx="2" />
                          <path d="M3 10h18M9 20V10" />
                        </svg>
                        Admin Dashboard
                      </Link>
                    )}


                    <Link
                      to="/hotels"
                      onClick={() => setProfileOpen(false)}
                      className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800"
                    >
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      >
                        <path d="M3 10.5 12 3l9 7.5" />
                        <path d="M5.5 9v11h13V9M9 20v-6h6v6" />
                      </svg>
                      Explore stays
                    </Link>

                    


<Link
  to="/my-payments"
  onClick={() => setProfileOpen(false)}
  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 10h18" />
    <path d="M7 15h3" />
  </svg>
  Bookings & Payments
</Link>


                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-stone-700 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60 dark:text-stone-200 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                    >
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      >
                        <path d="M10 17l5-5-5-5M15 12H3" />
                        <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
                      </svg>
                      {loggingOut ? 'Signing out...' : 'Sign out'}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Logged-out Actions */
            <>
              <Link
                to="/login"
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-stone-700 transition hover:text-emerald-800 dark:text-stone-200 dark:hover:text-emerald-400 sm:px-4"
              >
                Sign in
              </Link>

              <Link
                to="/register"
                className="rounded-lg bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2 dark:focus:ring-offset-stone-950 sm:px-5"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
