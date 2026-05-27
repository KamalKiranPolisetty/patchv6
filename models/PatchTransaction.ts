import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface TimelineEvent {
  event: string;
  timestamp: Date;
  updatedBy?: string;
}

export interface IPatchTransaction extends Document {
  incidentId: string;
  userId: mongoose.Types.ObjectId;
  status: 'Open' | 'In Progress' | 'Escalated' | 'Resolved';
  category: 'VDI' | 'Printer' | null;
  priority: number;
  urgency: number;
  impact: number;
  conversationHistory: ConversationMessage[];
  timeline: TimelineEvent[];
  lastUpdatedBy: string;
  feedbackRating?: number;
  escalationReason?: string;
  assignedSupportGroup?: string;
  escalationTimestamp?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PatchTransactionSchema = new Schema<IPatchTransaction>(
  {
    incidentId: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Escalated', 'Resolved'],
      default: 'Open',
    },
    category: { type: String, enum: ['VDI', 'Printer', null], default: null },
    priority: { type: Number, default: 5 },
    urgency: { type: Number, default: 3 },
    impact: { type: Number, default: 3 },
    conversationHistory: [
      {
        role: { type: String, enum: ['user', 'assistant'] },
        content: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    timeline: [
      {
        event: String,
        timestamp: { type: Date, default: Date.now },
        updatedBy: String,
      },
    ],
    lastUpdatedBy: { type: String, default: 'Patch' },
    feedbackRating: { type: Number, min: 1, max: 5 },
    escalationReason: String,
    assignedSupportGroup: String,
    escalationTimestamp: Date,
  },
  { timestamps: true }
);

const PatchTransaction: Model<IPatchTransaction> =
  mongoose.models.PatchTransaction ||
  mongoose.model<IPatchTransaction>('PatchTransaction', PatchTransactionSchema);
export default PatchTransaction;
