import { Schema, model } from "mongoose";
import { idJsonPlugin } from "./plugins.js";

export type DriveRole = "SPOC" | "Panel" | "Evaluator";

export interface DriveMembershipDoc {
  _id: string;
  driveId: string;
  userId: string;
  role: DriveRole;
  addedAt: Date;
  addedByUserId: string;
}

const driveMembershipSchema = new Schema<DriveMembershipDoc>(
  {
    _id: { type: String, required: true },
    driveId: { type: String, required: true, ref: "CampusDrive", index: true },
    userId: { type: String, required: true, ref: "User", index: true },
    role: { type: String, enum: ["SPOC", "Panel", "Evaluator"], required: true },
    addedAt: { type: Date, default: Date.now },
    addedByUserId: { type: String, required: true, ref: "User" },
  },
  { _id: false },
);

driveMembershipSchema.index({ driveId: 1, userId: 1, role: 1 });

driveMembershipSchema.plugin(idJsonPlugin);

export const DriveMembership = model<DriveMembershipDoc>("DriveMembership", driveMembershipSchema);
