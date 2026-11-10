import { Schema, model } from 'mongoose';

const commentSchema = new Schema(
  {
    cardId: { type: String, required: true, index: true },
    parentId: { type: String, index: true },
    text: { type: String, required: true, trim: true, minlength: 1, maxlength: 500 },
    timestamp: { type: Number, default: Date.now },
    updatedAt: { type: Number }, // set on edit; the UI shows "(изменено)"
    authorId: { type: String, index: true },
    authorName: { type: String, trim: true, maxlength: 50 },
    hidden: { type: Boolean, default: false, index: true },
    hiddenReason: { type: String, trim: true, maxlength: 200 },
  },
  { toJSON: { virtuals: true, versionKey: false, transform: (_doc, ret) => { delete ret._id; } } }
);

export default model('Comment', commentSchema);
