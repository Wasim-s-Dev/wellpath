import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate, RouterProvider, useLocation } from 'react-router'
import './index.css'
import App from './App.tsx'
import { SignUp } from './pages/SignUp.tsx'
import { Login } from './pages/Login.tsx'
import { ForgotPassword } from './pages/ForgotPassword.tsx'
import { ResetPassword } from './pages/ResetPassword.tsx'
import { Home } from './pages/Home.tsx'
import { Onboarding } from './pages/Onboarding.tsx'
import { Settings } from './pages/Settings.tsx'
import { Toaster } from './components/Toaster.tsx'
import { restoreSession, useAuth, wasSignedOutOnPurpose } from './lib/auth.ts'

/**
 * Sends signed-out visitors to the login page, then back here after they sign in.
 * After a logout or account deletion, it goes to the home page instead.
 */
function RequireUser({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const location = useLocation()
  if (auth.status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted" role="status">Loading…</div>
  }
  if (auth.status === 'signed-in') return children
  if (wasSignedOutOnPurpose()) return <Navigate to="/" replace />
  return <Navigate to="/login" replace state={{ from: location.pathname }} />
}

const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/signup', element: <SignUp /> },
  { path: '/login', element: <Login /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password', element: <ResetPassword /> },
  { path: '/app', element: <RequireUser><Home /></RequireUser> },
  { path: '/onboarding', element: <RequireUser><Onboarding /></RequireUser> },
  { path: '/settings', element: <RequireUser><Settings /></RequireUser> },
  { path: '*', element: <Navigate to="/" replace /> },
])

void restoreSession()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
    <Toaster />
  </StrictMode>,
)
