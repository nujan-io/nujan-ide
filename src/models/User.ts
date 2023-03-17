import { Project } from '@/interfaces/workspace.interface';
import mongoose, { model, Schema } from 'mongoose';

const UserSchema = new Schema<Project>(
  {
    walletAddress: { type: String, required: true, unique: true },
    name: { type: String, required: false },
  },
  { timestamps: true }
);

UserSchema.set('toJSON', {
  virtuals: true,
});

UserSchema.set('toObject', {
  virtuals: true,
});

export const UserModel = mongoose.models.user || model('user', UserSchema);
