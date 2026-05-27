'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type FilterType = 'All' | 'Open' | 'In Progress' | 'Escalated' | 'Resolved'

interface Incident {
  incidentId: string
  category: string
  status: 'Open' | 'In Progress' | 'Escalated' | 'Resolved'
  createdAt: string
  conversation: unknown[]
  metadata: { priority: string; urgency: string; impact: string }
}

const STATUS_COLORS: Record<string, string> = {
  Open: 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-yellow-100 text-yellow-700',
  Escalated: 'bg-red-100 text-red-700',
  Resolved: 'bg-green-100 text-green-700',
}

const FILTERS: FilterType[] = ['All', 'Open', 'In Progress', 'Escalated', 'Resolved']
const RESUMABLE = ['Open', 'In Progress', 'Escalated']

export default function IncidentsPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ email: string } | null>(null)
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [filter, setFilter] = useState<FilterType>('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const meRes = await fetch('/api/auth/me')
      if (meRes.status === 401) {
        router.push('/login')
        return
      }
      setUser(await meRes.json())

      const incRes = await fetch('/api/incidents')
      if (incRes.ok) {
        const data = await incRes.json()
        setIncidents(Array.isArray(data) ? data : data.incidents || [])
      }
      setLoading(false)
    }
    init()
  }, [])

  const filtered = filter === 'All' ? incidents : incidents.filter((i) => i.status === filter)

  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div data-testid="incidents-page" className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header
        data-testid="incidents-header"
        className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm"
      >
        <div className="flex items-center gap-3">
          <Link href="/" data-testid="back-home-btn" className="text-slate-500 hover:text-slate-800 text-sm border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors">
            ← Home
          </Link>
          <span className="text-xl font-bold text-blue-600">Patch</span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-700 font-medium">Incidents</span>
        </div>
        <span className="text-sm text-slate-600">{user?.email}</span>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {/* Filter bar */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              data-testid={`filter-${f.toLowerCase().replace(' ', '-')}`}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-slate-500 py-16">Loading incidents...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-slate-400 py-16 bg-white rounded-xl border border-slate-200">
            No incidents found.
          </div>
        ) : (
          <div
            data-testid="incidents-table"
            className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Incident ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Category</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((incident) => (
                  <tr
                    key={incident.incidentId}
                    data-testid={`incident-row-${incident.incidentId}`}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono">
                      <Link
                        href={`/incidents/${incident.incidentId}`}
                        data-testid={`incident-link-${incident.incidentId}`}
                        className="text-blue-600 hover:underline"
                      >
                        {incident.incidentId}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{incident.category}</td>
                    <td className="px-4 py-3">
                      <span
                        data-testid={`incident-status-${incident.incidentId}`}
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[incident.status] || 'bg-slate-100 text-slate-600'}`}
                      >
                        {incident.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(incident.createdAt)}</td>
                    <td className="px-4 py-3">
                      {RESUMABLE.includes(incident.status) && (
                        <Link
                          href={`/?incident=${incident.incidentId}`}
                          data-testid={`resume-chat-${incident.incidentId}`}
                          className="text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-100 transition-colors"
                        >
                          Resume Chat
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
