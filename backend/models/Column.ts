import { Schema, model } from 'mongoose';

const columnSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    cardIds: { type: [String], default: [] },
  },
  { toJSON: { virtuals: true, versionKey: false, transform: (_doc, ret) => { delete ret._id; } } }
);

export default model('Column', columnSchema);
