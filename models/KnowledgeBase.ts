import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IKnowledgeBase extends Document {
  category: 'VDI' | 'Printer';
  fileName: string;
  extractedText: string;
  uploadDate: Date;
  userId: mongoose.Types.ObjectId;
}

const KnowledgeBaseSchema = new Schema<IKnowledgeBase>({
  category: { type: String, required: true, enum: ['VDI', 'Printer'] },
  fileName: { type: String, required: true },
  extractedText: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

const KnowledgeBase: Model<IKnowledgeBase> =
  mongoose.models.KnowledgeBase ||
  mongoose.model<IKnowledgeBase>('KnowledgeBase', KnowledgeBaseSchema);
export default KnowledgeBase;
