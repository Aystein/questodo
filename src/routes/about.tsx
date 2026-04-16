import { createFileRoute } from '@tanstack/react-router'
import { requireAuthenticatedUser } from '../lib/auth'

export const Route = createFileRoute('/about')({
  beforeLoad: async ({ context, location }) => {
    await requireAuthenticatedUser(context.auth, location.href)
  },
  component: About,
})

function About() {
  return (
    <section className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white/90 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.06)]">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
        About
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
        Private application area
      </h1>
      <p className="mt-4 text-sm leading-7 text-slate-600">
        This page is only available to users with a valid Supabase session.
        Anyone without a session is redirected to the login screen and then sent
        back here after a successful sign-in.
      </p>
    </section>
  )
}