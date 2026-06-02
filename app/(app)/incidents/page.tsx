import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/session';
import { connectDB } from '@/lib/mongodb';
import Incident from '@/models/Incident';
import IncidentRow from '@/components/IncidentRow';

interface IncidentDoc {
  incidentId: string;
  category: string;
  status: 'Open' | 'Escalated' | 'Resolved';
  createdAt: Date | string;
  updatedAt: Date | string;
  priority?: string;
}

const FILTERS = ['All', 'Open', 'Escalated', 'Resolved'] as const;

export default async function IncidentsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { filter } = await searchParams;
  const activeFilter = filter || 'All';

  await connectDB();

  const query: Record<string, string> = { email: session.email };
  if (activeFilter !== 'All') {
    query.status = activeFilter;
  }

  const incidents = await Incident.find(query)
    .sort({ updatedAt: -1 })
    .select('incidentId category status createdAt updatedAt priority')
    .lean() as unknown as IncidentDoc[];

  return (
    <div className="max-w-5xl w-full mx-auto px-4 py-8" data-testid="incidents-list">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">My Incidents</h1>
        <p className="text-gray-500 text-sm">Track and manage your IT support requests.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === 'All' ? '/incidents' : `/incidents?filter=${f}`}
            data-testid={`incidents-filter-${f.toLowerCase()}`}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeFilter === f
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            {f}
          </Link>
        ))}
      </div>

      {incidents.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-medium text-gray-600 mb-1">No incidents found</p>
          <p className="text-sm">
            {activeFilter !== 'All'
              ? `No ${activeFilter} incidents.`
              : 'Start a new chat to create your first incident.'}
          </p>
          <Link href="/" className="inline-block mt-4 text-sm text-red-600 font-medium hover:underline">
            New Chat →
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">ID</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Age</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {incidents.map((incident) => (
                <IncidentRow key={incident.incidentId} incident={incident} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
