"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import StatusBadge from "@/components/StatusBadge";

interface Incident {
  incidentId: string;
  status: "Open" | "Escalated" | "Resolved";
  category: string;
  subCategory: string;
  createdAt: string;
  updatedAt: string;
  priority: number;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const TABS = ["All", "Open", "Escalated", "Resolved"] as const;
type Tab = (typeof TABS)[number];

export default function IncidentsPage() {
  const [tab, setTab] = useState<Tab>("All");
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/incidents?status=${tab}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) {
          setIncidents(d.incidents || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [tab]);

  return (
    <div data-testid="incidents-page" className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-1 px-4 py-8" style={{ maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <h1 data-testid="incidents-heading" className="text-2xl font-bold text-gray-900 mb-6">Incidents</h1>

          {/* Tabs */}
          <div data-testid="incidents-tabs" className="flex gap-1 mb-6 border-b border-gray-200">
            {TABS.map((t) => (
              <button
                key={t}
                data-testid={`tab-${t.toLowerCase()}`}
                onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  tab === t
                    ? "border-red-600 text-red-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {loading ? (
            <div data-testid="incidents-loading" className="text-center py-16 text-gray-400">Loading...</div>
          ) : incidents.length === 0 ? (
            <div data-testid="incidents-empty" className="text-center py-16">
              <p className="text-gray-400 text-sm">No incidents found.</p>
            </div>
          ) : (
            <div data-testid="incidents-list" className="space-y-3">
              {incidents.map((incident) => (
                <div
                  key={incident.incidentId}
                  data-testid={`incident-row-${incident.incidentId}`}
                  className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p data-testid={`incident-id-${incident.incidentId}`} className="text-sm font-semibold text-gray-900">
                        {incident.incidentId}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {incident.category || "—"} · {timeAgo(incident.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={incident.status} />
                  </div>
                  <Link
                    href={`/incidents/${incident.incidentId}`}
                    data-testid={`view-incident-${incident.incidentId}`}
                    className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
