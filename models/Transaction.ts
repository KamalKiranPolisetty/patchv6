import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: "text" | "summary_card" | "feedback_card";
  metadata?: Record<string, unknown>;
}

export interface ITimelineEntry {
  status: string;
  timestamp: Date;
  actor: string;
}

export interface IEscalationDetails {
  reason: string;
  group: string;
  timestamp: Date;
  category?: string;
  subcategory?: string;
  priority?: number;
  urgency?: number;
  impact?: number;
  configItem?: string;
}

export interface IResolutionDetails {
  timestamp: Date;
  resolvedBy: string;
  summary?: string;
}

export interface IFeedback {
  rating: number;
  comments: string;
  submittedAt: Date;
}

export interface ITransaction extends Document {
  incidentId: string;
  sessionId: string;
  userId: Types.ObjectId;
  status: "Open" | "Escalated" | "Resolved";
  category: string;
  subCategory: string;
  priority: number;
  urgency: number;
  impact: number;
  configItem: string;
  conversationHistory: IConversationMessage[];
  timeline: ITimelineEntry[];
  escalationDetails?: IEscalationDetails;
  resolutionDetails?: IResolutionDetails;
  feedback?: IFeedback;
  kbFiles: string[];
  lastupdatedby: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationMessageSchema = new Schema<IConversationMessage>(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    type: {
      type: String,
      enum: ["text", "summary_card", "feedback_card"],
      default: "text",
    },
    metadata: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const TimelineEntrySchema = new Schema<ITimelineEntry>(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    actor: { type: String, required: true },
  },
  { _id: false }
);

const TransactionSchema = new Schema<ITransaction>(
  {
    incidentId: { type: String, required: true, unique: true },
    sessionId: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["Open", "Escalated", "Resolved"],
      default: "Open",
    },
    category: { type: String, default: "" },
    subCategory: { type: String, default: "" },
    priority: { type: Number, default: 5 },
    urgency: { type: Number, default: 3 },
    impact: { type: Number, default: 3 },
    configItem: { type: String, default: "" },
    conversationHistory: [ConversationMessageSchema],
    timeline: [TimelineEntrySchema],
    escalationDetails: {
      type: {
        reason: String,
        group: String,
        timestamp: Date,
        category: String,
        subcategory: String,
        priority: Number,
        urgency: Number,
        impact: Number,
        configItem: String,
      },
      default: undefined,
    },
    resolutionDetails: {
      type: {
        timestamp: Date,
        resolvedBy: String,
        summary: String,
      },
      default: undefined,
    },
    feedback: {
      type: {
        rating: Number,
        comments: String,
        submittedAt: Date,
      },
      default: undefined,
    },
    kbFiles: [{ type: String }],
    lastupdatedby: { type: String, default: "Patch" },
  },
  { timestamps: true }
);

const Transaction: Model<ITransaction> =
  (mongoose.models.Transaction as Model<ITransaction>) ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema, "Patch Transactions");

export default Transaction;
