"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";

type IncidentStatus = "Open" | "In Progress" | "Escalated" | "Resolved" | "All";

interface Incident {
  _id: string;
  status: string;
  category: string;
  createdAt: string;
  priority: number;
}

interface User {
  userId: string;
  username?: string;
  email?: string;
}

const STATUS_FILTERS: IncidentStatus[] = ["All", "Open", "In Progress", "Escalated", "Resolved"];

const STATUS_COLORS: Record<string, string> = {
  Open: "bg-blue-100 text-blue-700",
  "In Progress": "bg-yellow-100 text-yellow-700",
  Escalated: "bg-red-100 text-red-700",
  Resolved: "bg-green-100 text-green-700",
};

export default function IncidentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filter, setFilter] = useState<IncidentStatus>("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) router.push("/login");
        else setUser(data.user);
      });

    fetch("/api/incidents")
      .then((r) => r.json())
      .then((data) => {
        if (data.incidents) setIncidents(data.incidents);
        setLoading(false);
      });
  }, [router]);

  const filtered = filter === "All" ? incidents : incidents.filter((i) => i.status === filter);

  if (!user) return null;

  return (
    <div data-testid="incidents-page" className="flex flex-col min-h-screen bg-gray-50">
      <Header username={user.username} email={user.email} />

      <main className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full">
        <h1 data-testid="incidents-heading" className="text-2xl font-bold text-gray-900 mb-6">My Incidents</h1>

        {/* Filter Bar */}
        <div data-testid="filter-bar" className="flex gap-2 mb-6 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              data-testid={`filter-${s.toLowerCase().replace(" ", "-")}`}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === s ? "bg-red-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <p data-testid="incidents-loading" className="text-gray-400 text-center py-12">Loading incidents...</p>
        ) : filtered.length === 0 ? (
          <div data-testid="incidents-empty" className="text-center py-12">
            <p className="text-gray-400">No incidents found.</p>
            <Link href="/" className="mt-4 inline-block text-red-500 hover:underline text-sm">Start a new chat</Link>
          </div>
        ) : (
          <div data-testid="incidents-list" className="space-y-3">
            {filtered.map((incident) => (
              <div
                key={incident._id}
                data-testid={`incident-row-${incident._id}`}
                className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p data-testid={`incident-id-${incident._id}`} className="text-xs text-gray-400 font-mono mb-1">#{incident._id.slice(-8)}</p>
                    <p data-testid={`incident-category-${incident._id}`} className="font-medium text-gray-900">{incident.category || "General"}</p>
                    <p data-testid={`incident-date-${incident._id}`} className="text-xs text-gray-400 mt-0.5">
                      {new Date(incident.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    data-testid={`incident-status-${incident._id}`}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[incident.status] || "bg-gray-100 text-gray-600"}`}
                  >
                    {incident.status}
                  </span>
                  {incident.status !== "Resolved" ? (
                    <Link
                      href={`/incidents/${incident._id}`}
                      data-testid={`resume-chat-${incident._id}`}
                      className="px-3 py-1.5 bg-red-500 hover:bg-orange-500 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      Resume Chat
                    </Link>
                  ) : (
                    <Link
                      href={`/incidents/${incident._id}`}
                      data-testid={`view-incident-${incident._id}`}
                      className="px-3 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg text-xs font-medium transition-colors"
                    >
                      View
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
