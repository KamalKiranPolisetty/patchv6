'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Incident {
  incidentId: string
  category: string
  status: 'Open' | 'Escalated' | 'Resolved'
  createdAt: string
}

type FilterTab = 'All' | 'Open' | 'Escalated' | 'Resolved'

function incidentAge(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const statusBadgeClass: Record<string, string> = {
  Open: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  Escalated: 'bg-red-100 text-red-800 border border-red-200',
  Resolved: 'bg-green-100 text-green-800 border border-green-200',
}

export default function IncidentsPage() {
  const router = useRouter()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [filter, setFilter] = useState<FilterTab>('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) router.replace('/login')
      })
      .catch(() => router.replace('/login'))
  }, [router])

  useEffect(() => {
    fetch('/api/incidents')
      .then((r) => r.json())
      .then((data) => {
        if (data.incidents) setIncidents(data.incidents)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'All' ? incidents : incidents.filter((i) => i.status === filter)

  const tabs: FilterTab[] = ['All', 'Open', 'Escalated', 'Resolved']

  return (
    <div className="min-h-screen bg-gray-50" data-testid="incidents-page">
      <div className="h-14" />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6" data-testid="incidents-heading">My Incidents</h1>

        <div className="flex gap-1 mb-6 bg-white border border-gray-200 rounded-xl p-1 w-fit" data-testid="filter-tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === tab
                  ? 'bg-black text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              data-testid={`filter-tab-${tab.toLowerCase()}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-gray-400 text-sm" data-testid="incidents-loading">Loading incidents…</div>
        ) : filtered.length === 0 ? (
          <div className="text-gray-400 text-sm" data-testid="incidents-empty">No incidents found.</div>
        ) : (
          <div className="flex flex-col gap-3" data-testid="incidents-list">
            {filtered.map((incident) => (
              <div
                key={incident.incidentId}
                className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow"
                data-testid={`incident-card-${incident.incidentId}`}
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900" data-testid={`incident-id-${incident.incidentId}`}>
                      {incident.incidentId}
                    </p>
                    <p className="text-xs text-gray-500" data-testid={`incident-category-${incident.incidentId}`}>
                      {incident.category || 'VDI'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500" data-testid={`incident-date-${incident.incidentId}`}>
                      {new Date(incident.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-400" data-testid={`incident-age-${incident.incidentId}`}>
                      {incidentAge(incident.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusBadgeClass[incident.status]}`}
                    data-testid={`incident-status-${incident.incidentId}`}
                  >
                    {incident.status}
                  </span>
                </div>
                <Link
                  href={`/incidents/${incident.incidentId}`}
                  className="text-sm text-red-600 hover:underline font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  data-testid={`incident-view-btn-${incident.incidentId}`}
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
