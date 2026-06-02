import mongoose, { Schema, Document, Types } from 'mongoose';

export interface MessageControl {
  type: 'probable_options' | 'single_select' | 'input_cards';
  options?: string[];
  inputCardVariables?: Array<{ label: string; key: string; required: boolean }>;
  totalCards?: number;
  partialValues?: Record<string, Record<string, string>>;
  status: 'awaiting' | 'completed';
}

export interface IMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  control?: MessageControl;
}

export interface IEscalationData {
  reason: string;
  group: string;
  priority: string;
  urgency: string;
  impact: string;
  timestamp?: Date;
}

export interface IResolutionData {
  timestamp: Date;
  summary: string;
}

export interface IFeedback {
  rating?: number;
  comment?: string;
  submittedAt?: Date;
}

export interface ITimelineEvent {
  event: string;
  timestamp: Date;
}

export interface IIncident extends Document {
  incidentId: string;
  userId: Types.ObjectId;
  username: string;
  email: string;
  category: string;
  status: 'Open' | 'Escalated' | 'Resolved';
  history: IMessage[];
  kbReferences: string[];
  escalationData?: IEscalationData;
  resolutionData?: IResolutionData;
  feedback?: IFeedback;
  priority: string;
  urgency: string;
  impact: string;
  storeNumber: string;
  lastupdatedby: string;
  createdAt: Date;
  updatedAt: Date;
  timeline: ITimelineEvent[];
}

const MessageControlSchema = new Schema<MessageControl>(
  {
    type: { type: String, enum: ['probable_options', 'single_select', 'input_cards'], required: true },
    options: [String],
    inputCardVariables: [
      {
        label: String,
        key: String,
        required: Boolean,
      },
    ],
    totalCards: Number,
    partialValues: { type: Schema.Types.Mixed },
    status: { type: String, enum: ['awaiting', 'completed'], required: true },
  },
  { _id: false }
);

const MessageSchema = new Schema<IMessage>(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    control: MessageControlSchema,
  },
  { _id: false }
);

const EscalationDataSchema = new Schema<IEscalationData>(
  {
    reason: { type: String, default: '' },
    group: { type: String, default: '' },
    priority: { type: String, default: 'Medium' },
    urgency: { type: String, default: 'Medium' },
    impact: { type: String, default: 'Individual' },
    timestamp: Date,
  },
  { _id: false }
);

const ResolutionDataSchema = new Schema<IResolutionData>(
  {
    timestamp: { type: Date, default: Date.now },
    summary: { type: String, default: '' },
  },
  { _id: false }
);

const FeedbackSchema = new Schema<IFeedback>(
  {
    rating: Number,
    comment: String,
    submittedAt: Date,
  },
  { _id: false }
);

const TimelineEventSchema = new Schema<ITimelineEvent>(
  {
    event: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const IncidentSchema = new Schema<IIncident>(
  {
    incidentId: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    email: { type: String, required: true },
    category: { type: String, required: true },
    status: { type: String, enum: ['Open', 'Escalated', 'Resolved'], default: 'Open' },
    history: [MessageSchema],
    kbReferences: [String],
    escalationData: EscalationDataSchema,
    resolutionData: ResolutionDataSchema,
    feedback: FeedbackSchema,
    priority: { type: String, default: 'Medium' },
    urgency: { type: String, default: 'Medium' },
    impact: { type: String, default: 'Individual' },
    storeNumber: { type: String, default: '' },
    lastupdatedby: { type: String, default: '' },
    timeline: [TimelineEventSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Incident || mongoose.model<IIncident>('Incident', IncidentSchema);
