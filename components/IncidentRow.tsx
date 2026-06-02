import Link from 'next/link';
import { formatDate, getAge } from '@/lib/utils';

interface IncidentRowProps {
  incident: {
    incidentId: string;
    category: string;
    status: 'Open' | 'Escalated' | 'Resolved';
    createdAt: Date | string;
    updatedAt: Date | string;
    priority?: string;
  };
}

const statusColors: Record<string, string> = {
  Open: 'bg-blue-100 text-blue-700',
  Escalated: 'bg-orange-100 text-orange-700',
  Resolved: 'bg-green-100 text-green-700',
};

export default function IncidentRow({ incident }: IncidentRowProps) {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="py-3 px-4 text-sm font-mono text-gray-700">{incident.incidentId}</td>
      <td className="py-3 px-4 text-sm text-gray-900 capitalize">{incident.category}</td>
      <td className="py-3 px-4">
        <span
          className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
            statusColors[incident.status] || 'bg-gray-100 text-gray-600'
          }`}
        >
          {incident.status}
        </span>
      </td>
      <td className="py-3 px-4 text-sm text-gray-500">{formatDate(incident.createdAt)}</td>
      <td className="py-3 px-4 text-sm text-gray-400">{getAge(incident.updatedAt)}</td>
      <td className="py-3 px-4">
        <Link
          href={`/incidents/${incident.incidentId}`}
          className="text-sm text-red-600 font-medium hover:underline"
        >
          View
        </Link>
      </td>
    </tr>
  );
}
