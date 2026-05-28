"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";

interface Incident {
  _id: string;
  category: string;
  status: string;
  createdAt: string;
}

interface User {
  id: string;
  username: string;
  email: string;
}

const STATUS_COLORS: Record<string, string> = {
  Open: "bg-blue-100 text-blue-700",
  "In Progress": "bg-yellow-100 text-yellow-700",
  Escalated: "bg-red-100 text-red-700",
  Resolved: "bg-green-100 text-green-700",
};

const FILTERS = ["All", "Open", "In Progress", "Escalated", "Resolved"];

export default function IncidentsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me").then(async (r) => { if (r.ok) { const d = await r.json(); setUser(d.user); } });
    fetch("/api/incidents").then(async (r) => {
      if (r.ok) { const d = await r.json(); setIncidents(d.incidents); }
      setLoading(false);
    });
  }, []);

  const filtered = filter === "All" ? incidents : incidents.filter((i) => i.status === filter);

  return (
    <div className="flex flex-col min-h-screen" data-testid="incidents-page">
      {user && <Header user={user} />}

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <h1 data-testid="incidents-heading" className="text-2xl font-bold text-gray-900 mb-6">Incidents</h1>

        <nav data-testid="incidents-filter-nav" className="flex gap-2 mb-6 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              data-testid={`filter-${f.toLowerCase().replace(" ", "-")}`}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f ? "bg-orange-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f}
            </button>
          ))}
        </nav>

        {loading ? (
          <p className="text-gray-500 text-sm" data-testid="incidents-loading">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500 text-sm" data-testid="incidents-empty">No incidents found.</p>
        ) : (
          <div data-testid="incidents-list" className="space-y-3">
            {filtered.map((incident) => (
              <div
                key={incident._id}
                data-testid={`incident-card-${incident._id}`}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center gap-4 flex-wrap">
                  <span data-testid="incident-card-id" className="font-mono text-xs text-gray-500">
                    #{incident._id.slice(-8)}
                  </span>
                  <span data-testid="incident-card-category" className="text-sm font-medium text-gray-900">
                    {incident.category}
                  </span>
                  <span data-testid="incident-card-date" className="text-xs text-gray-500">
                    {new Date(incident.createdAt).toLocaleDateString()}
                  </span>
                  <span
                    data-testid="incident-card-status"
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[incident.status] || "bg-gray-100 text-gray-600"}`}
                  >
                    {incident.status}
                  </span>
                </div>
                <Link
                  href={`/incidents/${incident._id}`}
                  data-testid="incident-card-view-btn"
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
