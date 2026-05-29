import { getSession } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Incident from '@/models/Incident';
import { redirect } from 'next/navigation';
import IncidentListClient from './IncidentListClient';

export default async function IncidentsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  await connectDB();
  const rawIncidents = await Incident.find({ userId: session.userId }).sort({ createdAt: -1 }).lean();

  const incidents = rawIncidents.map(i => ({
    incidentId: i.incidentId,
    status: i.status,
    category: i.category,
    createdAt: i.createdAt ? i.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: i.updatedAt ? i.updatedAt.toISOString() : new Date().toISOString(),
  }));

  return <IncidentListClient incidents={incidents} username={session.username} />;
}
