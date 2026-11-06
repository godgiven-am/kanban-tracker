import { Schema, model } from 'mongoose';

const cardSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    columnId: { type: String, required: true },
  },
  { toJSON: { virtuals: true, versionKey: false, transform: (_doc, ret) => { delete ret._id; } } }
);

export default model('Card', cardSchema);
