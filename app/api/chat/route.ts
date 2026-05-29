import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Incident from '@/models/Incident';
import { getSession } from '@/lib/auth';
import { getKBContent } from '@/lib/kb';
import { callLLM } from '@/lib/llm';

function generateIncidentId(): string {
  const num = Math.floor(Math.random() * 9000000) + 1000000;
  return `INC${num}`;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { message, incidentId, category } = await request.json();

  if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

  await connectDB();

  let incident;
  if (incidentId) {
    incident = await Incident.findOne({ incidentId, userId: session.userId });
  }

  if (!incident) {
    const kbRefs = category ? [`${category}/vdi.txt`] : [];
    incident = await Incident.create({
      incidentId: generateIncidentId(),
      userId: session.userId,
      status: 'Open',
      category: category || '',
      kbReferences: kbRefs,
      timeline: [{ status: 'Open', timestamp: new Date(), actor: 'Patch' }],
      conversationHistory: [],
    });
  }

  const kbContent = getKBContent(category || incident.category || undefined);

  incident.conversationHistory.push({ role: 'user', content: message, timestamp: new Date() });

  const history = incident.conversationHistory.slice(0, -1).map((m: { role: 'user' | 'assistant'; content: string }) => ({
    role: m.role,
    content: m.content,
  }));

  const llmResponse = await callLLM(kbContent, history, message);

  incident.conversationHistory.push({
    role: 'assistant',
    content: JSON.stringify(llmResponse),
    timestamp: new Date(),
  });

  if (llmResponse.should_escalate && incident.status === 'Open') {
    incident.status = 'Escalated';
    incident.escalationData = llmResponse.escalation_data;
    incident.timeline.push({ status: 'Escalated', timestamp: new Date(), actor: 'Escalation Team' });
    incident.lastUpdatedBy = 'Escalation Team';
  }

  if (kbContent && !incident.kbReferences?.length) {
    incident.kbReferences = category ? [`${category}/vdi.txt`] : [];
  }

  await incident.save();

  return NextResponse.json({
    incidentId: incident.incidentId,
    status: incident.status,
    llmResponse,
  });
}
