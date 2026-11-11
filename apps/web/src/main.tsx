import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate, RouterProvider, useLocation } from 'react-router'
import './index.css'
import App from './App.tsx'
import { SignUp } from './pages/SignUp.tsx'
import { Login } from './pages/Login.tsx'
import { Home } from './pages/Home.tsx'
import { restoreSession, useAuth } from './lib/auth.ts'

/** Sends signed-out visitors to the login page, then back here after they sign in. */
function RequireUser({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const location = useLocation()
  if (auth.status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted" role="status">Loading…</div>
  }
  return auth.status === 'signed-in' ? children : <Navigate to="/login" replace state={{ from: location.pathname }} />
}

const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/signup', element: <SignUp /> },
  { path: '/login', element: <Login /> },
  { path: '/app', element: <RequireUser><Home /></RequireUser> },
  { path: '*', element: <Navigate to="/" replace /> },
])

void restoreSession()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
