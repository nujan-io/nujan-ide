import { Project } from '@/interfaces/workspace.interface';
import mongoose, { model, Schema } from 'mongoose';

const ProjectSchema = new Schema<Project>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'users' },
    name: { type: String, required: false },
    template: { type: String, required: false },
    contractAddress: { type: String, required: false },
  },
  { timestamps: true }
);

// ProjectSchema.set('toJSON', {
//   transform: function (doc, ret, options) {
//     ret.id = ret._id;
//     delete ret._id;
//     delete ret.__v;
//   },
// });

ProjectSchema.set('toJSON', {
  virtuals: true,
});

ProjectSchema.set('toObject', {
  virtuals: true,
});

export const ProjectModel =
  mongoose.models.project || model('project', ProjectSchema);
