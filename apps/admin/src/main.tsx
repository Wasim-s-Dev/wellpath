import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import './index.css'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Users } from './pages/Users'
import { Foods } from './pages/Foods'
import { Exercises } from './pages/Exercises'
import { SafetyRules } from './pages/SafetyRules'
import { AiSettings } from './pages/AiSettings'
import { AuditLog } from './pages/AuditLog'
import { Settings } from './pages/Settings'
import { refreshSession, useAuth } from './lib/auth'

/** Sends signed-out visitors to the login page, after checking for a saved session. */
function RequireAdmin({ children }: { children: ReactNode }) {
  const auth = useAuth()
  if (auth.status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted" role="status">Checking your session…</div>
  }
  return auth.status === 'signed-in' ? children : <Navigate to="/login" replace />
}

void refreshSession()

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    path: '/',
    element: <RequireAdmin><Layout /></RequireAdmin>,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'users', element: <Users /> },
      { path: 'foods', element: <Foods /> },
      { path: 'exercises', element: <Exercises /> },
      { path: 'safety', element: <SafetyRules /> },
      { path: 'ai', element: <AiSettings /> },
      { path: 'audit', element: <AuditLog /> },
      { path: 'settings', element: <Settings /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
