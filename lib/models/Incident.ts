import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface IConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface ITimelineEvent {
  status: string
  timestamp: Date
  actor: string
}

export interface IIncident extends Document {
  incidentId: string
  userId: Types.ObjectId
  status: 'Open' | 'Escalated' | 'Resolved'
  category: string
  subCategory: string
  priority: number
  urgency: number
  impact: number
  conversationHistory: IConversationMessage[]
  timeline: ITimelineEvent[]
  escalationReason?: string
  assignedGroup?: string
  feedbackRating?: number
  feedbackComments?: string
  feedbackSubmittedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const ConversationMessageSchema = new Schema<IConversationMessage>(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
)

const TimelineEventSchema = new Schema<ITimelineEvent>(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    actor: { type: String, required: true },
  },
  { _id: false }
)

const IncidentSchema = new Schema<IIncident>(
  {
    incidentId: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['Open', 'Escalated', 'Resolved'], default: 'Open' },
    category: { type: String, default: '' },
    subCategory: { type: String, default: '' },
    priority: { type: Number, default: 5 },
    urgency: { type: Number, default: 3 },
    impact: { type: Number, default: 3 },
    conversationHistory: { type: [ConversationMessageSchema], default: [] },
    timeline: { type: [TimelineEventSchema], default: [] },
    escalationReason: { type: String },
    assignedGroup: { type: String },
    feedbackRating: { type: Number },
    feedbackComments: { type: String },
    feedbackSubmittedAt: { type: Date },
  },
  { timestamps: true }
)

const Incident: Model<IIncident> =
  mongoose.models.Incident || mongoose.model<IIncident>('Incident', IncidentSchema)

export default Incident
