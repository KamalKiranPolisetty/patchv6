"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import StatusBadge from "@/components/StatusBadge";
import type { Incident } from "@/types";

const TABS = ["All", "Open", "Escalated", "Resolved"] as const;
type Tab = (typeof TABS)[number];

function timeAgo(date: Date | string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function IncidentsListClient(props: { username: string }) {
  void props; // consumed by parent only
  const [tab, setTab] = useState<Tab>("All");
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const url = tab === "All" ? "/api/incidents" : `/api/incidents?status=${tab}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setIncidents(data);
      })
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div className="flex flex-col h-screen" data-testid="incidents-page">
      <Header />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6" data-testid="incidents-heading">
            Incidents
          </h1>

          {/* Filter tabs */}
          <div className="flex gap-1 mb-6 border-b border-gray-200" data-testid="incidents-tabs">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                  tab === t
                    ? "text-red-600"
                    : "text-gray-500 hover:text-gray-900"
                }`}
                data-testid={`tab-${t.toLowerCase()}`}
              >
                {t}
                {tab === t && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Incident list */}
          {loading ? (
            <div className="text-sm text-gray-400 py-10 text-center" data-testid="loading-indicator">
              Loading...
            </div>
          ) : incidents.length === 0 ? (
            <div className="text-sm text-gray-400 py-10 text-center" data-testid="no-incidents">
              No incidents found.
            </div>
          ) : (
            <div className="space-y-3" data-testid="incidents-list">
              {incidents.map((inc) => (
                <div
                  key={inc._id}
                  className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-between"
                  data-testid={`incident-row-${inc._id}`}
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p
                        className="text-sm font-bold text-gray-900"
                        data-testid="incident-number"
                      >
                        {inc.incidentNumber}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5" data-testid="incident-category">
                        {inc.category}
                      </p>
                    </div>
                    <StatusBadge status={inc.status} />
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-400" data-testid="incident-age">
                      {timeAgo(inc.createdAt)}
                    </span>
                    <Link
                      href={`/incidents/${inc._id}`}
                      className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                      data-testid="view-incident-link"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
