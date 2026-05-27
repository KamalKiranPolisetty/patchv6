import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IKnowledgeBase extends Document {
  documentId: string;
  category: string;
  fileName: string;
  extractedText: string;
  uploadedBy: string;
  createdAt: Date;
}

const KnowledgeBaseSchema = new Schema<IKnowledgeBase>({
  documentId: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  fileName: { type: String, required: true },
  extractedText: { type: String, required: true },
  uploadedBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const KnowledgeBase: Model<IKnowledgeBase> =
  mongoose.models.KnowledgeBase ?? mongoose.model<IKnowledgeBase>('KnowledgeBase', KnowledgeBaseSchema);

export default KnowledgeBase;
