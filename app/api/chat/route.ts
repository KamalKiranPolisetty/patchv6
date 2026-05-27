import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { incidentId, message, category } = await request.json();

  await connectToDatabase();
  const PatchTransaction = (await import('@/lib/models/PatchTransaction')).default;
  const KnowledgeBase = (await import('@/lib/models/KnowledgeBase')).default;

  const incident = await PatchTransaction.findOne({ incidentId });
  if (!incident) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Add user message
  incident.conversation.push({ role: 'user', content: message, timestamp: new Date() });

  // RAG retrieval
  const query = category
    ? { category: { $regex: new RegExp(`^${category}$`, 'i') } }
    : {};
  const knowledgeDocs = await KnowledgeBase.find(query);

  let context = '';
  const usedDocIds: string[] = [];
  for (const doc of knowledgeDocs) {
    if (context.length >= 8000) break;
    const remaining = 8000 - context.length;
    context += doc.extractedText.slice(0, remaining);
    usedDocIds.push(doc.documentId);
  }

  const systemPrompt = `You are Patch, an AI troubleshooting assistant for store associates.
${context ? `Use the following knowledge base to help answer:\n\n${context}` : 'No specific documentation is available. Use your general knowledge.'}

IMPORTANT:
- If you determine the issue is RESOLVED, end your response with exactly: [STATUS:RESOLVED]
- If you determine the issue CANNOT be resolved and needs escalation, end your response with exactly: [STATUS:ESCALATED]
- Otherwise, continue troubleshooting normally.
- For escalation, also include [GROUP:Trusted Experts] and [REASON:brief reason]`;

  let rawResponse = '';

  try {
    const ollamaRes = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemma4:31b-cloud',
        prompt: `<system>\n${systemPrompt}\n</system>\n\nUser: ${message}`,
        stream: false,
      }),
    });

    if (!ollamaRes.ok) {
      throw new Error(`Ollama returned ${ollamaRes.status}`);
    }

    const ollamaData = await ollamaRes.json();
    rawResponse = ollamaData.response as string;
  } catch {
    rawResponse =
      "I'm having trouble connecting to the AI service. Please try again in a moment.";
    incident.conversation.push({ role: 'assistant', content: rawResponse, timestamp: new Date() });
    const conversationIndex = incident.conversation.length - 1;
    await incident.save();
    return NextResponse.json({ response: rawResponse, incident, conversationIndex });
  }

  let cleanedResponse = rawResponse;

  if (rawResponse.includes('[STATUS:RESOLVED]')) {
    cleanedResponse = 'Awesome, glad that worked! Is there anything else I can help with?';
    incident.status = 'Resolved';
    incident.resolutionDetails = { timestamp: new Date(), notes: '' };
    incident.timeline.push({ event: 'Incident Resolved', timestamp: new Date(), details: 'Resolved by AI' });
  } else if (rawResponse.includes('[STATUS:ESCALATED]')) {
    cleanedResponse =
      "I wasn't able to resolve the issue. I'm escalating this to our Trusted Experts for hands-on support.";

    const groupMatch = rawResponse.match(/\[GROUP:([^\]]+)\]/);
    const reasonMatch = rawResponse.match(/\[REASON:([^\]]+)\]/);
    const group = groupMatch ? groupMatch[1] : 'Trusted Experts';
    const reason = reasonMatch ? reasonMatch[1] : 'Unable to resolve';

    incident.status = 'Escalated';
    incident.escalationDetails = { reason, group, timestamp: new Date() };
    incident.timeline.push({
      event: 'Incident Escalated',
      timestamp: new Date(),
      details: `Group: ${group}, Reason: ${reason}`,
    });
  } else {
    // Strip any stray markers
    cleanedResponse = rawResponse
      .replace(/\[STATUS:[^\]]+\]/g, '')
      .replace(/\[GROUP:[^\]]+\]/g, '')
      .replace(/\[REASON:[^\]]+\]/g, '')
      .trim();

    if (incident.status === 'Open') {
      incident.status = 'In Progress';
    }
  }

  incident.conversation.push({ role: 'assistant', content: cleanedResponse, timestamp: new Date() });
  const conversationIndex = incident.conversation.length - 1;

  // Deduplicated documents
  const existingDocs = new Set(incident.documents);
  for (const docId of usedDocIds) {
    existingDocs.add(docId);
  }
  incident.documents = Array.from(existingDocs);

  await incident.save();

  return NextResponse.json({ response: cleanedResponse, incident, conversationIndex });
}
