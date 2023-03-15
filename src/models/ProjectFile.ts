import { Tree } from '@/interfaces/workspace.interface';
import mongoose, { model, Schema } from 'mongoose';
import { ProjectModel } from './Project';

const ProjectFileSchema = new Schema<Tree>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: ProjectModel.collection.name,
    },
    name: { type: String, required: false },
    parent: { type: Schema.Types.ObjectId, default: null },
    type: { type: String, required: true },
    path: { type: String, required: true },
    template: { type: String, required: false },
    content: { type: String, required: false },
  },
  { timestamps: true }
);

ProjectFileSchema.set('toJSON', {
  virtuals: true,
});

ProjectFileSchema.set('toObject', {
  virtuals: true,
});

export const ProjectFileModel =
  mongoose.models.projectFile || model('projectFile', ProjectFileSchema);
