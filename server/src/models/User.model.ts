import { Schema, model } from "mongoose";
import { idJsonPlugin } from "./plugins.js";

export interface UserDoc {
  _id: string;
  name: string;
  email: string;
  isSuperAdmin: boolean;
  entraObjectId?: string;
}

const userSchema = new Schema<UserDoc>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    isSuperAdmin: { type: Boolean, default: false },
    entraObjectId: { type: String, unique: true, sparse: true },
  },
  { timestamps: true, _id: false },
);

userSchema.plugin(idJsonPlugin);

export const User = model<UserDoc>("User", userSchema);
