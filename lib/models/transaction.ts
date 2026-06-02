import mongoose, { Schema, Document, Model } from "mongoose";

export type IncidentStatus = "Open" | "Escalated" | "Resolved";

export interface IMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  controlMetadata?: {
    type: "probable_options" | "select_list" | "structured_form";
    options?: string[];
    fieldDefinitions?: object[];
    totalCards?: number;
    partialValues?: object;
    owningMessageId?: string;
    completionStatus: "awaiting" | "completed";
  };
}

export interface ITransaction extends Document {
  incidentId: string;
  sessionId: string;
  userId: string;
  status: IncidentStatus;
  category: string;
  history: IMessage[];
  controls: object;
  escalationDetails: object | null;
  resolutionDetails: object | null;
  feedback: object | null;
  lastUpdatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    controlMetadata: { type: Schema.Types.Mixed },
  },
  { _id: true }
);

const TransactionSchema = new Schema<ITransaction>(
  {
    incidentId: { type: String, required: true, unique: true },
    sessionId: { type: String, required: true },
    userId: { type: String, required: true },
    status: { type: String, enum: ["Open", "Escalated", "Resolved"], default: "Open" },
    category: { type: String, default: "" },
    history: [MessageSchema],
    controls: { type: Schema.Types.Mixed, default: {} },
    escalationDetails: { type: Schema.Types.Mixed, default: null },
    resolutionDetails: { type: Schema.Types.Mixed, default: null },
    feedback: { type: Schema.Types.Mixed, default: null },
    lastUpdatedBy: { type: String, default: "Patch" },
  },
  { timestamps: true }
);

const Transaction: Model<ITransaction> =
  (mongoose.models["Patch Transactions"] as Model<ITransaction>) ||
  mongoose.model<ITransaction>("Patch Transactions", TransactionSchema);

export default Transaction;
