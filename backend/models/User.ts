import { Schema, model } from 'mongoose';

export const ROLES = ['ADMIN', 'VERIFIED', 'UNVERIFIED'] as const;
export type Role = (typeof ROLES)[number];

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'UNVERIFIED' },
    banned: { type: Boolean, default: false },
    bannedUntil: { type: Date }, // temporary comment ban; permanent bans use `banned`
    banReason: { type: String, trim: true, maxlength: 200 },
    verifyTokenHash: { type: String, select: false, index: true },
    verifyExpires: { type: Date, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret) => {
        delete ret._id;
        delete ret.passwordHash;
        delete ret.verifyTokenHash;
        delete ret.verifyExpires;
      },
    },
  }
);

export default model('User', userSchema);
