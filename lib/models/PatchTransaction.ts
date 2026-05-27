import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IConversationEntry {
  role: string;
  content: string;
  timestamp: Date;
  feedback?: {
    rating: number;
    timestamp: Date;
  };
}

export interface ITimelineEntry {
  event: string;
  timestamp: Date;
  details: string;
}

export interface IMetadata {
  priority: string;
  urgency: string;
  impact: string;
  type: string;
}

export interface IEscalationDetails {
  reason: string;
  group: string;
  timestamp: Date;
}

export interface IResolutionDetails {
  timestamp: Date;
  notes: string;
}

export interface IPatchTransaction extends Document {
  incidentId: string;
  userId: string;
  status: 'Open' | 'In Progress' | 'Escalated' | 'Resolved';
  category: string;
  conversation: IConversationEntry[];
  timeline: ITimelineEntry[];
  metadata: IMetadata;
  escalationDetails?: IEscalationDetails;
  resolutionDetails?: IResolutionDetails;
  documents: string[];
  createdAt: Date;
}

const ConversationEntrySchema = new Schema<IConversationEntry>(
  {
    role: { type: String, required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    feedback: {
      rating: { type: Number },
      timestamp: { type: Date },
    },
  },
  { _id: false }
);

const TimelineEntrySchema = new Schema<ITimelineEntry>(
  {
    event: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    details: { type: String },
  },
  { _id: false }
);

const PatchTransactionSchema = new Schema<IPatchTransaction>({
  incidentId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Escalated', 'Resolved'],
    required: true,
    default: 'Open',
  },
  category: { type: String },
  conversation: { type: [ConversationEntrySchema], default: [] },
  timeline: { type: [TimelineEntrySchema], default: [] },
  metadata: {
    priority: { type: String },
    urgency: { type: String },
    impact: { type: String },
    type: { type: String },
  },
  escalationDetails: {
    reason: { type: String },
    group: { type: String },
    timestamp: { type: Date },
  },
  resolutionDetails: {
    timestamp: { type: Date },
    notes: { type: String },
  },
  documents: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});

const PatchTransaction: Model<IPatchTransaction> =
  mongoose.models.PatchTransaction ??
  mongoose.model<IPatchTransaction>('PatchTransaction', PatchTransactionSchema);

export default PatchTransaction;
