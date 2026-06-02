"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Incident {
  incidentId: string;
  status: "Open" | "Escalated" | "Resolved";
  category: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  Open: "bg-blue-50 text-blue-700",
  Escalated: "bg-amber-50 text-amber-700",
  Resolved: "bg-green-50 text-green-700",
};

export default function IncidentsClient() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/incidents")
      .then((r) => r.ok ? r.json() : { incidents: [] })
      .then((data: { incidents: Incident[] }) => setIncidents(data.incidents ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      className="min-h-full bg-[#FAFAF8] px-6 py-10"
      data-testid="incidents-page"
    >
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6" data-testid="incidents-heading">
          Your Incidents
        </h1>

        {loading ? (
          <div className="text-sm text-gray-400" data-testid="incidents-loading">Loading…</div>
        ) : incidents.length === 0 ? (
          <div
            className="text-sm text-gray-400 text-center py-20"
            data-testid="incidents-empty"
          >
            No incidents yet. Start a chat to create one.
          </div>
        ) : (
          <div className="flex flex-col gap-3" data-testid="incidents-list">
            {incidents.map((inc) => (
              <div
                key={inc.incidentId}
                className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between shadow-sm"
                data-testid={`incident-item-${inc.incidentId}`}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs font-medium text-gray-400 font-mono"
                      data-testid="incident-id"
                    >
                      #{inc.incidentId.slice(0, 8)}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[inc.status] ?? "bg-gray-100 text-gray-600"}`}
                      data-testid="incident-status"
                    >
                      {inc.status}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 capitalize" data-testid="incident-category">
                    {inc.category || "General"}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-gray-400" data-testid="incident-date">
                    {new Date(inc.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <Link
                    href={`/incidents/${inc.incidentId}`}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                    data-testid={`incident-view-btn-${inc.incidentId}`}
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
