import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { getSafeRedirectPath } from '../lib/auth'
import { supabase } from '../lib/supabase'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  component: LoginPage,
})

function LoginPage() {
  const { auth } = Route.useRouteContext()
  const search = Route.useSearch()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated) {
      router.history.replace(getSafeRedirectPath(search.redirect))
    }
  }, [auth.isAuthenticated, auth.isLoading, router, search.redirect])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    setIsSubmitting(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: username.trim(),
      password,
    })

    setIsSubmitting(false)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    router.history.push(getSafeRedirectPath(search.redirect))
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-14rem)] max-w-md items-center justify-center">
      <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            Login
          </h1>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Username</span>
            <input
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-slate-950"
              placeholder="Username"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-slate-950"
              placeholder="Enter your password"
            />
          </label>

          {errorMessage ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || auth.isLoading}
            className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </section>
  )
}
