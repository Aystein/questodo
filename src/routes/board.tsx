import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { requireAuthenticatedUser } from '../lib/auth'
import { supabase } from '../lib/supabase'
import {
  useDeleteItem,
  useDeleteMutation,
  useInsertMutation,
  useQuery,
  useUpsertItem,
} from '@supabase-cache-helpers/postgrest-react-query'
import type { Tables } from '../lib/supabase.types'

export const Route = createFileRoute('/board')({
  beforeLoad: async ({ context, location }) => {
    await requireAuthenticatedUser(context.auth, location.href)
  },
  component: RouteComponent,
})

type TodoRecord = Tables<'todo'>

const todosQuery = supabase
  .from('todo')
  .select('id, original_text, created_at, user_id')
  .order('id', { ascending: false })

function RouteComponent() {
  const { auth } = Route.useRouteContext()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | string | null>(null)
  const upsertTodo = useUpsertItem<TodoRecord>({
    primaryKeys: ['id'],
    schema: 'public',
    table: 'todo',
  })
  const deleteTodoFromCache = useDeleteItem<TodoRecord>({
    primaryKeys: ['id'],
    schema: 'public',
    table: 'todo',
  })

  const { data: todos, isLoading } = useQuery(todosQuery)

  const { mutate: createTodo } = useInsertMutation(supabase.from('todo'), ['id'], 'id, original_text, created_at, user_id', {
    onMutate: async (input) => {
      const optimisticTodo: TodoRecord = {
        created_at: new Date().toISOString(),
        id: -Date.now(),
        original_text: input[0]?.original_text ?? 'New todo',
        user_id: auth.user?.id ?? null,
      }

      await upsertTodo(optimisticTodo)

      return { optimisticTodo }
    },
    onError: async (error, _input, context) => {
      const ctx = context as { optimisticTodo?: TodoRecord } | undefined

      if (ctx?.optimisticTodo) {
        await deleteTodoFromCache(ctx.optimisticTodo)
      }

      setErrorMessage(error.message)
    },
    onSuccess: () => {
      setErrorMessage(null)
    },
    onSettled: async (_data, _error, _input, context) => {
      const ctx = context as { optimisticTodo?: TodoRecord } | undefined

      if (ctx?.optimisticTodo) {
        await deleteTodoFromCache(ctx.optimisticTodo)
      }
    },
  })

  const { mutateAsync: deleteTodo } = useDeleteMutation(supabase.from('todo'), ['id'], 'id, original_text, created_at, user_id', {
    onMutate: async (todo) => {
      const previousTodo = todos?.find((currentTodo) => currentTodo.id === todo.id)

      if (previousTodo) {
        await deleteTodoFromCache(previousTodo)
      }

      return { previousTodo }
    },
    onError: async (error, _input, context) => {
      const deleteContext = context as { previousTodo?: TodoRecord } | undefined

      if (deleteContext?.previousTodo) {
        await upsertTodo(deleteContext.previousTodo)
      }

      setErrorMessage(error.message)
    },
    onSuccess: () => {
      setErrorMessage(null)
    },
  })

  const handleAddTodo = () => {
    setErrorMessage(null)
    createTodo([{ original_text: 'New todo' }])
  }

  const handleDeleteTodo = async (todo: TodoRecord) => {
    setDeletingId(todo.id)
    setErrorMessage(null)

    try {
      await deleteTodo(todo)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete todo.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1>Board</h1>
        <button type="button" onClick={() =>  handleAddTodo()}>
          Add todo
        </button>
      </div>

      {errorMessage ? <p>{errorMessage}</p> : null}

      {isLoading ? <p>Loading...</p> : null}

      {!isLoading && todos?.length === 0 ? <p>No todos yet.</p> : null}

      {!isLoading ? (
        <ul>
          {todos?.map((todo) => (
            <li key={todo.id} className="flex items-center justify-between gap-4 py-2">
              <span>{todo.original_text}</span>
              <button
                type="button"
                onClick={() => void handleDeleteTodo(todo)}
                disabled={deletingId === todo.id}
              >
                {deletingId === todo.id ? 'Deleting...' : 'Delete'}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
