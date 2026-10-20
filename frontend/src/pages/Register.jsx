import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_BASE } from '../api/client'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setBusy(true)

    try {
      const data = await register(form)
      setMessage(data.message || 'Account created successfully. Please log in.')
      if (data.user) {
        navigate('/login')
      }
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
          src="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1600&q=85"
          alt="Mountain lake destination"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-950/30 to-emerald-950/10" />
        <div className="absolute bottom-16 left-12 right-12 text-white xl:left-20">
          <p className="text-xs font-bold tracking-[0.25em] text-emerald-100">JOIN HOTELHUB</p>
          <h1 className="mt-5 max-w-xl font-serif text-6xl leading-tight">
            More journeys.<br /><i className="text-emerald-200">More memories.</i>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/80">
            Create an account and start planning a getaway worth looking forward to.
          </p>
        </div>
      </section>

<section className="flex min-h-screen items-center justify-center bg-[#fbfaf7] px-6 py-10 text-stone-900 transition-colors dark:bg-stone-950 dark:text-stone-100 sm:px-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-10 inline-flex items-center gap-2 text-2xl font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-xl rounded-bl-sm bg-emerald-900 font-serif text-white">H</span>
            Hotel<span className="text-emerald-700">Hub</span>
          </Link>

          <p className="text-xs font-bold tracking-[0.2em] text-emerald-800">CREATE YOUR ACCOUNT</p>
          <h2 className="mt-3 font-serif text-4xl text-stone-500">Your next chapter.</h2>
          <p className="mt-3 text-sm leading-6 text-stone-500">
            Join us and find your next favourite place.
          </p>

          <button
            type="button"
            onClick={() => {
              window.location.href = `${API_BASE}/api/auth/google`
            }}
className="mt-7 flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-stone-300 bg-white text-sm font-semibold text-stone-900 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800"          >
            <span className="font-bold text-blue-600">G</span>
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-4 text-xs text-stone-400">
            <span className="h-px flex-1 bg-stone-200" />
            OR REGISTER WITH EMAIL
            <span className="h-px flex-1 bg-stone-200" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {[
              { name: 'name', label: 'Full name', placeholder: 'Your full name', type: 'text' },
              { name: 'email', label: 'Email address', placeholder: 'you@example.com', type: 'email' },
              { name: 'phone', label: 'Phone number', placeholder: 'Your phone number', type: 'tel' },
              { name: 'password', label: 'Password', placeholder: 'Create a strong password', type: 'password' },
            ].map((field) => (
              <label key={field.name} className="block text-sm font-semibold text-stone-700 dark:text-stone-300">
                {field.label}
                <input
                  name={field.name}
                  type={field.type}
                  autoComplete={field.name === 'password' ? 'new-password' : field.name}
                  required={field.name !== "phone"}
                  minLength={field.name === 'password' ? 8 : undefined}
                  value={form[field.name]}
                  onChange={update}
                  placeholder={field.placeholder}
               className="mt-2 h-11 w-full rounded-lg border border-stone-300 bg-white px-4 font-normal text-stone-900 placeholder:text-stone-400 outline-none focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-emerald-500"
                />
              </label>
            ))}

            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            {message && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}

            <button
              disabled={busy}
              className="flex h-12 w-full items-center justify-between rounded-lg bg-emerald-900 px-5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {busy ? 'Creating account...' : 'Create account'}
              <span>↗</span>
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-500 dark:text-stone-400">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-emerald-800 hover:underline dark:text-emerald-400">Log in</Link>
          </p>
        </div>
      </section>
    </main>
  )
}