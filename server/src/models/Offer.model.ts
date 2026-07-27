import { Schema, model } from "mongoose";
import { idJsonPlugin } from "./plugins.js";

export interface OfferDoc {
  _id: string;
  candidateId: string;
  candidateName: string;
  college: string;
  ctc: number;
  status: "Offered" | "Accepted" | "Declined" | "Joined";
  dateReleased: string;
  joiningDate?: string;
}

const offerSchema = new Schema<OfferDoc>(
  {
    _id: { type: String, required: true },
    candidateId: { type: String, required: true, ref: "Candidate", unique: true },
    candidateName: { type: String, required: true },
    college: { type: String, required: true },
    ctc: { type: Number, required: true },
    status: { type: String, enum: ["Offered", "Accepted", "Declined", "Joined"], default: "Offered" },
    dateReleased: { type: String, required: true },
    joiningDate: String,
  },
  { _id: false },
);

offerSchema.plugin(idJsonPlugin);

export const Offer = model<OfferDoc>("Offer", offerSchema);
