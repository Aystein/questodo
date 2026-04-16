import { createFileRoute } from '@tanstack/react-router'
import { requireAuthenticatedUser } from '../lib/auth'
import { supabase } from '../lib/supabase'

export const Route = createFileRoute('/')({
  beforeLoad: async ({ context, location }) => {
    await requireAuthenticatedUser(context.auth, location.href)
  },
  component: Index,
  loader: async () => {
    const { data: todos, error } = await supabase
      .from('todo')
      .select('*')

    if (error) {
      throw error
    }

    return { todos }
  },
})

function Index() {
  const { todos } = Route.useLoaderData()

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
          Dashboard
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
          Your current todos
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-500">
          This route is protected with TanStack Router `beforeLoad`, so the data
          loader only runs for authenticated users.
        </p>
      </div>

      {todos.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/80 p-10 text-center shadow-sm">
          <p className="text-sm text-slate-500">No todos found.</p>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-[0_20px_80px_rgba(15,23,42,0.06)]">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="flex items-center justify-between border-b border-slate-100 px-5 py-4 last:border-b-0"
            >
              <span
                className={`text-base ${todo.is_completed || todo.completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}
              >
                {todo.title || todo.task || todo.name || 'Untitled Todo'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}