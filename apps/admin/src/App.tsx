/**
 * WellPath admin panel (placeholder).
 * Confirms the frontend can reach the API. Replace with admin login and dashboard next.
 */
import { useEffect, useState } from 'react'
import type { HealthResponse } from '@wellpath/shared'

export default function App() {
  const [api, setApi] = useState<'checking' | 'online' | 'offline'>('checking')

  useEffect(() => {
    fetch('/health')
      .then((r) => r.json() as Promise<HealthResponse>)
      .then((d) => setApi(d.status === 'ok' ? 'online' : 'offline'))
      .catch(() => setApi('offline'))
  }, [])

  return (
    <main style={{ maxWidth: 560, margin: '80px auto', padding: 16 }}>
      <h1>WellPath Admin</h1>
      <p>Manage foods, exercises, safety rules, users and AI limits.</p>
      <p>API status: <strong>{api}</strong></p>
    </main>
  )
}
