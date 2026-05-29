import { ObjectId } from "mongodb";

export interface User {
  _id?: ObjectId;
  username: string;
  email: string;
  password: string;
  createdAt: Date;
}

export type IncidentStatus = "Open" | "Escalated" | "Resolved";

export interface HistoryEntry {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface KbReference {
  file: string;
  text: string;
}

export interface EscalationData {
  category: string;
  subcategory: string;
  priority: string;
  urgency: string;
  impact: string;
  configuration_item: string;
  reason: string;
  support_group: string;
  incident_number: string;
}

export interface FeedbackData {
  rating: number;
  comment: string;
  submittedAt: Date;
}

export interface Incident {
  _id?: ObjectId;
  incidentId: string;
  userId: string;
  userEmail: string;
  username: string;
  category: string;
  status: IncidentStatus;
  history: HistoryEntry[];
  kbContext: KbReference[];
  escalation: EscalationData | null;
  resolution: { details: string; timestamp: Date } | null;
  feedback: FeedbackData | null;
  lastUpdatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}
