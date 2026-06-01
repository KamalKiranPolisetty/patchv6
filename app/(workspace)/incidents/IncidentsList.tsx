"use client";

import Link from "next/link";
import { useState } from "react";
import type { Incident } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { formatAge, formatDate } from "@/lib/utils";

type Filter = "All" | "Open" | "Escalated" | "Resolved";

const FILTERS: Filter[] = ["All", "Open", "Escalated", "Resolved"];

export function IncidentsList({ incidents }: { incidents: Incident[] }) {
  const [filter, setFilter] = useState<Filter>("All");

  const visible = incidents
    .filter((i) => filter === "All" || i.status === filter)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return (
    <main data-testid="incidents-list-page" className="flex-1 px-6 py-8">
      <div className="max-w-[960px] mx-auto">
        <div className="mb-6">
          <h1 data-testid="incidents-page-heading" className="text-[26px] font-bold text-gray-900">
            Incidents
          </h1>
          <p className="text-[13px] text-gray-500 mt-1">
            Review your past troubleshooting sessions.
          </p>
        </div>

        <div className="flex items-center gap-1 mb-5" data-testid="incidents-filter-tabs">
          {FILTERS.map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                type="button"
                data-testid={`incidents-filter-${f.toLowerCase()}`}
                onClick={() => setFilter(f)}
                className={[
                  "h-9 px-3 rounded-md text-[13px] font-medium hover-elevate hover:bg-gray-100 border-b-2",
                  active
                    ? "text-patch-red border-patch-red"
                    : "text-gray-500 border-transparent",
                ].join(" ")}
              >
                {f}
              </button>
            );
          })}
        </div>

        {visible.length === 0 ? (
          <Card padding="lg" data-testid="incidents-empty-state">
            <p className="text-center text-[14px] text-gray-500">No incidents yet.</p>
          </Card>
        ) : (
          <Card padding="sm" data-testid="incidents-table">
            <div className="grid grid-cols-12 gap-3 px-2 py-2 text-[11px] uppercase tracking-wider font-semibold text-gray-500 border-b border-gray-100">
              <div className="col-span-3">Incident</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-2">Age</div>
              <div className="col-span-1 text-right">Action</div>
            </div>
            {visible.map((inc) => (
              <div
                key={inc.incidentId}
                data-testid={`incident-row-${inc.incidentId}`}
                className="grid grid-cols-12 gap-3 px-2 py-3 items-center border-b border-gray-100 last:border-0"
              >
                <div className="col-span-3 text-[13px] font-mono text-gray-900 truncate">
                  {inc.incidentId}
                </div>
                <div className="col-span-2 text-[13px] text-gray-700">{inc.category}</div>
                <div className="col-span-2">
                  <StatusBadge status={inc.status} />
                </div>
                <div className="col-span-2 text-[12px] text-gray-600">{formatDate(inc.createdAt)}</div>
                <div className="col-span-2 text-[12px] text-gray-500" data-testid="incident-age">
                  {formatAge(inc.createdAt)}
                </div>
                <div className="col-span-1 text-right">
                  <Link href={`/incidents/${inc.incidentId}`}>
                    <Button
                      variant="secondary"
                      size="sm"
                      data-testid={`incident-view-btn-${inc.incidentId}`}
                    >
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>
    </main>
  );
}
