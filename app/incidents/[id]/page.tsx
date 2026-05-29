import { getSession } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Incident from '@/models/Incident';
import { redirect } from 'next/navigation';
import IncidentDetailClient from './IncidentDetailClient';

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { id } = await params;

  await connectDB();
  const incident = await Incident.findOne({ incidentId: id, userId: session.userId }).lean();
  if (!incident) redirect('/incidents');

  const serialized = {
    incidentId: incident.incidentId,
    status: incident.status,
    category: incident.category,
    subcategory: incident.subcategory,
    priority: incident.priority,
    urgency: incident.urgency,
    impact: incident.impact,
    conversationHistory: incident.conversationHistory.map((m: { role: string; content: string; timestamp?: Date }) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp ? m.timestamp.toISOString() : new Date().toISOString(),
    })),
    timeline: incident.timeline.map((t: { status: string; timestamp?: Date; actor: string }) => ({
      status: t.status,
      timestamp: t.timestamp ? t.timestamp.toISOString() : new Date().toISOString(),
      actor: t.actor,
    })),
    kbReferences: incident.kbReferences,
    escalationData: incident.escalationData,
    feedback: incident.feedback ? {
      rating: incident.feedback.rating,
      comment: incident.feedback.comment,
    } : undefined,
    createdAt: incident.createdAt ? incident.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: incident.updatedAt ? incident.updatedAt.toISOString() : new Date().toISOString(),
  };

  return <IncidentDetailClient incident={serialized} username={session.username} />;
}
