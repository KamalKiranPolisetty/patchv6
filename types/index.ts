export interface User {
  _id: string;
  username: string;
  email: string;
  password: string;
  createdAt: Date;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface EscalationDetails {
  category: string;
  subcategory: string;
  priority: string;
  urgency: string;
  impact: string;
  reason: string;
  status: string;
  timestamp?: Date;
  supportGroup?: string;
}

export interface Incident {
  _id: string;
  incidentNumber: string;
  userId: string;
  username: string;
  status: "Open" | "Escalated" | "Resolved";
  category: string;
  conversationHistory: Message[];
  kbReferences: string[];
  escalationDetails?: EscalationDetails | null;
  resolutionDetails?: { summary: string; timestamp: Date } | null;
  feedback?: { rating: number; comments: string } | null;
  timeline: { event: string; timestamp: Date }[];
  currentState?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LLMResponse {
  response: string;
  user_probable_options: string[];
  input_card_variables: string[];
  total_cards: number;
  should_escalate: boolean;
  escalation_data: EscalationDetails | null;
  is_resolved?: boolean;
}

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
}
