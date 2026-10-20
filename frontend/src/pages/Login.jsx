import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_BASE } from '../api/client'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)

    try {
      await login(form)
      navigate('/hotels', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden min-h-screen overflow-hidden bg-emerald-950 lg:block">
        <img
          src="https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1600&q=85"
          alt="Peaceful holiday retreat"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-950/30 to-emerald-950/10" />
        <div className="absolute bottom-16 left-12 right-12 text-white xl:left-20 xl:right-20">
          <p className="mb-5 text-xs font-bold tracking-[0.25em] text-emerald-100">
            YOUR JOURNEY STARTS HERE
          </p>
          <h1 className="max-w-xl font-serif text-6xl leading-tight xl:text-7xl">
            Find your place to <i className="text-emerald-200">slow down.</i>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/80">
            Discover thoughtful stays, beautiful destinations, and little
            moments that turn a trip into a memory.
          </p>
        </div>
      </section>

<section className="flex min-h-screen items-center justify-center bg-[#fbfaf7] px-6 py-10 text-stone-900 transition-colors dark:bg-stone-950 dark:text-stone-100 sm:px-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-14 inline-flex items-center gap-2 text-2xl font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-xl rounded-bl-sm bg-emerald-900 font-serif text-white">H</span>
            Hotel<span className="text-emerald-700">Hub</span>
          </Link>

          <p className="text-xs font-bold tracking-[0.2em] text-emerald-800">WELCOME BACK</p>
<h2 className="mt-3 font-serif text-4xl text-stone-900 dark:text-stone-100">Good to see you.</h2>
        <p className="mt-3 text-sm leading-6 text-stone-500 dark:text-stone-400">
  Log in to discover your next favourite stay.
</p>

          <button
            type="button"
            onClick={() => {
              window.location.href = `${API_BASE}/api/auth/google`
            }}
className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-stone-300 bg-white text-sm font-semibold text-stone-900 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800"          >
            <span className="font-bold text-blue-600">G</span>
            Continue with Google
          </button>

          <div className="my-7 flex items-center gap-4 text-xs text-stone-400">
            <span className="h-px flex-1 bg-stone-200" />
            OR CONTINUE WITH EMAIL
            <span className="h-px flex-1 bg-stone-200" />
          </div>

          <form onSubmit={submit} className="space-y-5">
            <label className="block text-sm font-semibold text-stone-700">
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={update}
                placeholder="you@example.com"
className="mt-2 h-12 w-full rounded-lg border border-stone-300 bg-white px-4 text-stone-900 placeholder:text-stone-400 font-normal outline-none focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-emerald-500"              />
            </label>

            <label className="block text-sm font-semibold text-stone-700">
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={form.password}
                onChange={update}
                placeholder="Enter your password"
                className="mt-2 h-12 w-full rounded-lg border border-stone-300 bg-white px-4 text-stone-900 placeholder:text-stone-400 font-normal outline-none focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-emerald-500"
              />
            </label>

            {error && (
              <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              disabled={busy}
              className="flex h-12 w-full items-center justify-between rounded-lg bg-emerald-900 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
            >
              {busy ? 'Logging in...' : 'Log in'}
              <span>↗</span>
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-stone-500">
            New to HotelHub?{' '}
            <Link to="/register" className="font-bold text-emerald-800 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}