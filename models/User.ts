import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name?: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, index: true, maxlength: 255 },
  password: { type: String, required: true },
  name: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
