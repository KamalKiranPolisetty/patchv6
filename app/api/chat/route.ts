import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { connectDB } from '@/lib/mongodb';
import { getKbContent } from '@/lib/kb';
import { callLLM } from '@/lib/llm';
import { generateIncidentId } from '@/lib/utils';
import Incident from '@/models/Incident';
import { Types } from 'mongoose';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json() as {
      message?: string;
      incidentId?: string;
      category?: string;
    };
    const { message, incidentId, category } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    await connectDB();

    let incident = incidentId ? await Incident.findOne({ incidentId }) : null;

    const resolvedCategory = category || incident?.category || 'general';

    // Create new incident if none found
    if (!incident) {
      const newIncidentId = generateIncidentId();
      incident = new Incident({
        incidentId: newIncidentId,
        userId: new Types.ObjectId(session.userId),
        username: session.username,
        email: session.email,
        category: resolvedCategory,
        status: 'Open',
        history: [],
        kbReferences: [],
        priority: 'Medium',
        urgency: 'Medium',
        impact: 'Individual',
        storeNumber: '',
        lastupdatedby: session.username,
        timeline: [{ event: 'Incident created', timestamp: new Date() }],
      });
    }

    // Build history for LLM (only role+content)
    const llmHistory = incident.history.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    }));

    const kbContent = getKbContent(resolvedCategory !== 'general' ? resolvedCategory : undefined);

    const llmResponse = await callLLM({
      kbContent,
      history: llmHistory,
      userMessage: message,
      category: resolvedCategory,
    });

    // Append user message
    incident.history.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
    });

    // Build control for assistant message
    let control = undefined;
    const optionCount = llmResponse.user_probable_options.length;
    const hasInputCards = llmResponse.input_card_variables.length > 0;

    if (hasInputCards && !llmResponse.needs_count_first) {
      control = {
        type: 'input_cards' as const,
        inputCardVariables: llmResponse.input_card_variables,
        totalCards: llmResponse.total_cards || 1,
        status: 'awaiting' as const,
      };
    } else if (optionCount > 0 && optionCount <= 4) {
      control = {
        type: 'probable_options' as const,
        options: llmResponse.user_probable_options,
        status: 'awaiting' as const,
      };
    } else if (optionCount > 4) {
      control = {
        type: 'single_select' as const,
        options: llmResponse.user_probable_options,
        status: 'awaiting' as const,
      };
    }

    // Append assistant message
    incident.history.push({
      role: 'assistant',
      content: llmResponse.response,
      timestamp: new Date(),
      control,
    });

    // Handle escalation
    if (llmResponse.should_escalate && incident.status === 'Open') {
      incident.status = 'Escalated';
      incident.escalationData = {
        ...llmResponse.escalation_data,
        timestamp: new Date(),
      };
      incident.timeline.push({ event: 'Incident escalated', timestamp: new Date() });
    }

    // Handle resolution
    if (llmResponse.should_resolve && incident.status !== 'Escalated') {
      incident.status = 'Resolved';
      incident.resolutionData = {
        timestamp: new Date(),
        summary: llmResponse.response.slice(0, 500),
      };
      incident.timeline.push({ event: 'Incident resolved', timestamp: new Date() });
    }

    incident.lastupdatedby = session.username;
    await incident.save();

    // Build controls response
    let controls: {
      type: string;
      options?: string[];
      inputCardVariables?: Array<{ label: string; key: string; required: boolean }>;
      needsCountFirst?: boolean;
      countPrompt?: string;
      totalCards?: number;
    } = { type: 'none' };

    if (llmResponse.needs_count_first) {
      controls = {
        type: 'needs_count',
        needsCountFirst: true,
        countPrompt: llmResponse.count_prompt,
      };
    } else if (hasInputCards) {
      controls = {
        type: 'input_cards',
        inputCardVariables: llmResponse.input_card_variables,
        totalCards: llmResponse.total_cards || 1,
      };
    } else if (optionCount > 0 && optionCount <= 4) {
      controls = {
        type: 'probable_options',
        options: llmResponse.user_probable_options,
      };
    } else if (optionCount > 4) {
      controls = {
        type: 'single_select',
        options: llmResponse.user_probable_options,
      };
    }

    return NextResponse.json({
      incidentId: incident.incidentId,
      response: llmResponse.response,
      controls,
      status: incident.status,
      incidentData: {
        incidentId: incident.incidentId,
        category: incident.category,
        status: incident.status,
        escalationData: incident.escalationData,
        resolutionData: incident.resolutionData,
      },
    });
  } catch (err) {
    console.error('Chat error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
