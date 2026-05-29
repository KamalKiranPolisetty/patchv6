"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";

interface Incident {
  _id: string;
  incidentId: string;
  status: "Open" | "Escalated" | "Resolved";
  category: string;
  subCategory: string;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

const TABS = ["All", "Open", "Escalated", "Resolved"] as const;
type Tab = (typeof TABS)[number];

const statusColors: Record<string, string> = {
  Open: "bg-yellow-100 text-yellow-700",
  Escalated: "bg-red-100 text-red-700",
  Resolved: "bg-green-100 text-green-700",
};

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/incidents")
      .then(r => r.json())
      .then(data => { setIncidents(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = activeTab === "All" ? incidents : incidents.filter(i => i.status === activeTab);

  return (
    <div data-testid="incidents-page" className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-14 px-4 py-6 max-w-4xl mx-auto w-full">
        <h1 data-testid="incidents-heading" className="text-2xl font-bold text-gray-900 mb-6">My Incidents</h1>

        <div data-testid="incidents-tabs" className="flex gap-1 mb-6 border-b border-gray-200">
          {TABS.map(tab => (
            <button
              key={tab}
              data-testid={`tab-${tab.toLowerCase()}`}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div data-testid="incidents-loading" className="text-gray-500 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div data-testid="incidents-empty" className="text-gray-500 text-sm">No incidents found.</div>
        ) : (
          <ul data-testid="incidents-list" className="space-y-3">
            {filtered.map(incident => (
              <li
                key={incident._id}
                data-testid={`incident-item-${incident._id}`}
                className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span data-testid={`incident-item-id-${incident._id}`} className="font-semibold text-gray-800 text-sm">#{incident.incidentId}</span>
                      <span
                        data-testid={`incident-item-status-${incident._id}`}
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[incident.status]}`}
                      >
                        {incident.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">{incident.category} / {incident.subCategory}</div>
                    <div data-testid={`incident-item-age-${incident._id}`} className="text-xs text-gray-400 mt-0.5">{timeAgo(incident.createdAt)}</div>
                  </div>
                </div>
                <Link
                  href={`/incidents/${incident._id}`}
                  data-testid={`incident-view-btn-${incident._id}`}
                  className="bg-white border border-gray-300 text-gray-700 text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  View
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
