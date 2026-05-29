"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import Header from "@/components/Header";
import StatusBadge from "@/components/StatusBadge";
import type { IncidentStatus } from "@/lib/types";

interface IncidentRow {
  _id: string;
  incidentId: string;
  category: string;
  status: IncidentStatus;
  createdAt: string;
}

type Filter = "All" | IncidentStatus;

export default function IncidentsPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [filter, setFilter] = useState<Filter>("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/incidents")
      .then((r) => {
        if (r.status === 401) { router.push("/login"); return null; }
        return r.json();
      })
      .then((data) => {
        if (data) setIncidents(data);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const tabs: Filter[] = ["All", "Open", "Escalated", "Resolved"];

  const filtered = filter === "All" ? incidents : incidents.filter((i) => i.status === filter);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#F5F5F5" }}>
      <Header incidentCount={incidents.length} />

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6" style={{ color: "#111111" }} data-testid="incidents-heading">
            Incidents
          </h1>

          {/* Filter Tabs */}
          <div className="flex gap-1 mb-6" data-testid="filter-tabs">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className="px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  color: filter === tab ? "#DC2626" : "#6B7280",
                  borderBottom: filter === tab ? "2px solid #DC2626" : "2px solid transparent",
                  borderRadius: 0,
                  background: "transparent",
                }}
                data-testid={`filter-tab-${tab.toLowerCase()}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Table */}
          <div
            className="bg-white rounded-xl overflow-hidden"
            style={{ border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
            data-testid="incidents-table"
          >
            {loading ? (
              <div className="p-8 text-center text-sm" style={{ color: "#6B7280" }} data-testid="incidents-loading">
                Loading…
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-sm" style={{ color: "#6B7280" }} data-testid="incidents-empty">
                No incidents yet.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid #E5E7EB" }}>
                    {["Incident ID", "Category", "Status", "Created", "Age", ""].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "#9CA3AF" }}
                        data-testid={`th-${h.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inc) => (
                    <tr
                      key={inc._id}
                      style={{ borderBottom: "1px solid #F3F4F6" }}
                      data-testid={`incident-row-${inc.incidentId}`}
                    >
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: "#111111" }} data-testid="incident-row-id">
                        {inc.incidentId}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "#374151" }} data-testid="incident-row-category">
                        {inc.category}
                      </td>
                      <td className="px-4 py-3" data-testid="incident-row-status">
                        <StatusBadge status={inc.status} />
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "#6B7280" }} data-testid="incident-row-date">
                        {new Date(inc.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "#6B7280" }} data-testid="incident-row-age">
                        {formatDistanceToNow(new Date(inc.createdAt), { addSuffix: true })}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/incidents/${inc._id}`}
                          className="text-sm font-medium hover:underline"
                          style={{ color: "#DC2626" }}
                          data-testid={`incident-row-view-btn-${inc.incidentId}`}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
