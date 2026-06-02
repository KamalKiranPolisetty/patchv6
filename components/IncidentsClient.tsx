"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Incident {
  incidentId: string;
  status: "Open" | "Escalated" | "Resolved";
  category: string;
  createdAt: string;
  updatedAt: string;
  feedback?: { stars: number; comment: string } | null;
}

type Filter = "All" | "Open" | "Escalated" | "Resolved";

// PATCH-20: Open=yellow, Escalated=red, Resolved=green
const STATUS_STYLES: Record<string, string> = {
  Open: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Escalated: "bg-red-100 text-red-700 border-red-200",
  Resolved: "bg-green-100 text-green-700 border-green-200",
};

function humanAge(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} day${days !== 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months !== 1 ? "s" : ""} ago`;
}

const FILTERS: Filter[] = ["All", "Open", "Escalated", "Resolved"];

export default function IncidentsClient() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("All");

  useEffect(() => {
    fetch("/api/incidents")
      .then((r) => r.ok ? r.json() : { incidents: [] })
      .then((data: { incidents: Incident[] }) => setIncidents(data.incidents ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === "All" ? incidents : incidents.filter((inc) => inc.status === filter);

  return (
    <div className="min-h-full bg-[#FAFAF8] px-6 py-10" data-testid="incidents-page">
      <div className="max-w-3xl mx-auto">
        <h1
          className="text-2xl font-bold text-gray-900 mb-6"
          data-testid="incidents-heading"
        >
          Your Incidents
        </h1>

        {/* Filter tabs */}
        <div
          className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-6 w-fit shadow-sm"
          data-testid="incidents-filter-tabs"
          role="tablist"
        >
          {FILTERS.map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={`text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors ${
                filter === f
                  ? "bg-[#CC0000] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              }`}
              data-testid={`filter-tab-${f.toLowerCase()}`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-sm text-gray-400" data-testid="incidents-loading">
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="text-sm text-gray-400 text-center py-20"
            data-testid="incidents-empty"
          >
            No incidents yet.
          </div>
        ) : (
          <div className="flex flex-col gap-3" data-testid="incidents-list">
            {filtered.map((inc) => (
              <div
                key={inc.incidentId}
                className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between shadow-sm"
                data-testid={`incident-item-${inc.incidentId}`}
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className="text-xs font-medium text-gray-400 font-mono"
                      data-testid="incident-id"
                    >
                      #{inc.incidentId.slice(0, 8)}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded border ${STATUS_STYLES[inc.status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}
                      data-testid="incident-status"
                    >
                      {inc.status}
                    </span>
                  </div>
                  <span
                    className="text-sm font-medium text-gray-700 capitalize"
                    data-testid="incident-category"
                  >
                    {inc.category || "General"}
                  </span>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-xs text-gray-500" data-testid="incident-date">
                      {new Date(inc.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="text-xs text-gray-400" data-testid="incident-age">
                      {humanAge(inc.createdAt)}
                    </span>
                  </div>
                  <Link
                    href={`/incidents/${inc.incidentId}`}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#CC0000] hover:bg-[#AA0000] text-white transition-colors"
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
