import { Link, Outlet, createRootRouteWithContext, useRouter } from '@tanstack/react-router'
import type { RouterContext } from '../router'

function RootLayout() {
  const { auth } = Route.useRouteContext()
  const router = useRouter()

  const handleSignOut = async () => {
    await auth.signOut()
    await router.navigate({
      to: '/login',
      search: { redirect: undefined },
      replace: true,
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        {auth.isAuthenticated ? (
          <header className="mb-4">
            <div className="flex items-center justify-between">
              <nav className="flex items-center gap-4">
                <Link to="/">Home</Link>
                <Link to="/about">About</Link>
                <Link to="/board">Board</Link>
              </nav>

              <button type="button" onClick={() => void handleSignOut()}>
                Logout
              </button>
            </div>
          </header>
        ) : null}

        <main className="flex-1 py-2">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})