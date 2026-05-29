import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ITimelineEntry {
  status: string;
  timestamp: Date;
  actor: string;
}

export interface IEscalationData {
  category?: string;
  subcategory?: string;
  priority?: string;
  urgency?: string;
  impact?: string;
  reason?: string;
  status?: string;
}

export interface IFeedback {
  rating: number;
  comment: string;
  submittedAt: Date;
}

export interface IIncident extends Document {
  incidentId: string;
  userId: mongoose.Types.ObjectId;
  status: 'Open' | 'Escalated' | 'Resolved';
  category: string;
  subcategory: string;
  priority: number;
  urgency: number;
  impact: number;
  conversationHistory: IConversationMessage[];
  timeline: ITimelineEntry[];
  kbReferences: string[];
  escalationData?: IEscalationData;
  feedback?: IFeedback;
  lastUpdatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationMessageSchema = new Schema<IConversationMessage>({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const TimelineSchema = new Schema<ITimelineEntry>({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  actor: { type: String, required: true },
}, { _id: false });

const EscalationDataSchema = new Schema<IEscalationData>({
  category: String,
  subcategory: String,
  priority: String,
  urgency: String,
  impact: String,
  reason: String,
  status: String,
}, { _id: false });

const FeedbackSchema = new Schema<IFeedback>({
  rating: { type: Number, min: 1, max: 5 },
  comment: String,
  submittedAt: { type: Date, default: Date.now },
}, { _id: false });

const IncidentSchema = new Schema<IIncident>({
  incidentId: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['Open', 'Escalated', 'Resolved'], default: 'Open' },
  category: { type: String, default: '' },
  subcategory: { type: String, default: '' },
  priority: { type: Number, default: 3 },
  urgency: { type: Number, default: 3 },
  impact: { type: Number, default: 3 },
  conversationHistory: [ConversationMessageSchema],
  timeline: [TimelineSchema],
  kbReferences: [String],
  escalationData: EscalationDataSchema,
  feedback: FeedbackSchema,
  lastUpdatedBy: { type: String, default: 'Patch' },
}, { timestamps: true });

const Incident: Model<IIncident> = mongoose.models['Patch Transactions'] ||
  mongoose.model<IIncident>('Patch Transactions', IncidentSchema);
export default Incident;
