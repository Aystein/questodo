import { StrictMode } from 'react'
import { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import './styles.css'
import { useAuth } from './lib/auth'
import { router } from './router'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient();

function AppRouter() {
  const auth = useAuth()

  useEffect(() => {
    void router.invalidate()
  }, [auth.isAuthenticated])

  return <RouterProvider router={router} context={{ auth }} />
}

const root = ReactDOM.createRoot(document.getElementById('root')!)

root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppRouter />
    </QueryClientProvider>
  </StrictMode>,
)