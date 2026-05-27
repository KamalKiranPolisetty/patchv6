import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import PatchTransaction, { IPatchTransaction } from '@/models/PatchTransaction';
import KnowledgeBase from '@/models/KnowledgeBase';
import { getAuthUser } from '@/lib/auth';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const MODEL = 'gemma4:31b-cloud';

async function callOllama(messages: Array<{ role: string; content: string }>): Promise<string> {
  const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, messages, stream: false }),
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error('Ollama request failed');
  const data = await res.json();
  return data.message?.content || '';
}

function detectResolution(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes('incident is now resolved') ||
    lower.includes('glad that worked') ||
    lower.includes('problem is resolved')
  );
}

function detectEscalation(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("wasn't able to resolve") ||
    lower.includes('escalating') ||
    lower.includes('trusted experts')
  );
}

function generateIncidentId(): string {
  return `INC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, incidentId, category } = await req.json();
    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    await connectToDatabase();

    let transaction: IPatchTransaction | null = null;
    if (incidentId) {
      transaction = await PatchTransaction.findOne({ incidentId, userId: user.userId });
    }

    const isNew = !transaction;
    if (isNew) {
      const newId = generateIncidentId();
      const cat = (category as 'VDI' | 'Printer' | null) || null;
      transaction = await PatchTransaction.create({
        incidentId: newId,
        userId: user.userId,
        status: 'Open',
        category: cat,
        priority: cat ? 5 : 5,
        urgency: 3,
        impact: 3,
        conversationHistory: [],
        timeline: [{ event: 'Incident created', timestamp: new Date(), updatedBy: 'Patch' }],
        lastUpdatedBy: 'Patch',
      });
    }

    if (!transaction) {
      return NextResponse.json({ error: 'Failed to create or find incident.' }, { status: 500 });
    }

    if (transaction.status === 'Resolved' || transaction.status === 'Escalated') {
      return NextResponse.json({ error: 'This incident is closed.', status: transaction.status }, { status: 400 });
    }

    const activeCategory = transaction.category || (category as 'VDI' | 'Printer' | null);
    let context = '';
    if (activeCategory) {
      const docs = await KnowledgeBase.find({ category: activeCategory }).limit(3);
      context = docs.map((d) => d.extractedText).join('\n\n');
    } else {
      const docs = await KnowledgeBase.find().limit(5);
      context = docs.map((d) => `[${d.category}]: ${d.extractedText}`).join('\n\n');
    }

    const systemPrompt = `You are Patch, an AI IT support assistant for store associates.
Help troubleshoot VDI and Printer issues step by step.
${context ? `\nKnowledge Base Context:\n${context}` : ''}

When you resolve an issue, say: "Awesome, glad that worked! This incident is now resolved. Start a New Chat if you need help with something else."
When you cannot resolve an issue after exhausting options, say: "I wasn't able to resolve the issue. I'm escalating this to our Trusted Experts for hands-on support."
Keep responses concise and professional.`;

    const ollamaMessages = [
      { role: 'system', content: systemPrompt },
      ...transaction.conversationHistory.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    let aiResponse: string;
    try {
      aiResponse = await callOllama(ollamaMessages);
    } catch {
      return NextResponse.json(
        { error: 'Patch is having trouble thinking. Please try again in a moment.' },
        { status: 503 }
      );
    }

    const now = new Date();
    transaction.conversationHistory.push(
      { role: 'user', content: message, timestamp: now },
      { role: 'assistant', content: aiResponse, timestamp: now }
    );
    transaction.timeline.push(
      { event: `User: ${message.substring(0, 80)}`, timestamp: now, updatedBy: 'User' },
      { event: 'Patch responded', timestamp: now, updatedBy: 'Patch' }
    );

    if (transaction.status === 'Open') {
      transaction.status = 'In Progress';
    }

    let newStatus: string = transaction.status;
    if (detectResolution(aiResponse)) {
      transaction.status = 'Resolved';
      transaction.lastUpdatedBy = 'Patch';
      transaction.timeline.push({ event: 'Incident resolved', timestamp: now, updatedBy: 'Patch' });
      newStatus = 'Resolved';
    } else if (detectEscalation(aiResponse)) {
      transaction.status = 'Escalated';
      transaction.lastUpdatedBy = 'Patch';
      transaction.escalationReason = aiResponse.substring(0, 200);
      transaction.assignedSupportGroup = 'Trusted Experts';
      transaction.escalationTimestamp = now;
      transaction.timeline.push({ event: 'Incident escalated', timestamp: now, updatedBy: 'Patch' });
      newStatus = 'Escalated';
    }

    await transaction.save();

    return NextResponse.json({
      incidentId: transaction.incidentId,
      response: aiResponse,
      status: newStatus,
      isNew,
    });
  } catch {
    return NextResponse.json(
      { error: 'Patch is having trouble thinking. Please try again in a moment.' },
      { status: 500 }
    );
  }
}
