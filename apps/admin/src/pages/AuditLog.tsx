import { useMemo, useState } from 'react'
import { Card, Empty, PageHeader, SearchInput, td, th } from '../components/ui'
import { useStore } from '../lib/store'
import { timeAgo } from '../lib/format'

export function AuditLog() {
  const audit = useStore((s) => s.audit)
  const [q, setQ] = useState('')
  const rows = useMemo(() => audit.filter((a) => `${a.action} ${a.target} ${a.actor}`.toLowerCase().includes(q.toLowerCase())), [audit, q])
  return (
    <div className="fade-in">
      <PageHeader title="Audit log" sub="Every admin change, newest first. Kept for accountability and your FYP evaluation." />
      <Card>
        <div className="border-b border-line p-4"><SearchInput value={q} onChange={setQ} placeholder="Search actions" /></div>
        {rows.length === 0 ? <Empty title="Nothing here yet" body="Admin actions will appear as they happen." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-ink-2/60"><tr><th className={th}>When</th><th className={th}>Action</th><th className={th}>Target</th><th className={th}>By</th></tr></thead>
              <tbody className="divide-y divide-line">
                {rows.map((a) => (
                  <tr key={a.id} className="hover:bg-ink-2/60">
                    <td className={`${td} whitespace-nowrap text-muted`} title={new Date(a.at).toLocaleString()}>{timeAgo(a.at)}</td>
                    <td className={`${td} font-medium text-heading`}>{a.action}</td>
                    <td className={`${td} text-text`}>{a.target}</td>
                    <td className={`${td} text-muted`}>{a.actor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
