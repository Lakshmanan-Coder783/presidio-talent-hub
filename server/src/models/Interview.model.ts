import { Schema, model } from "mongoose";
import { idJsonPlugin } from "./plugins.js";

export interface InterviewDoc {
  _id: string;
  candidateId: string;
  candidateName: string;
  panelName: string;
  date: string;
  time: string;
  stage: "Interview" | "Coding Exercise" | "Whiteboard Interview";
  status: "Scheduled" | "Completed" | "Cancelled";
  feedback?: string;
  rating?: number;
}

const interviewSchema = new Schema<InterviewDoc>(
  {
    _id: { type: String, required: true },
    candidateId: { type: String, required: true, ref: "Candidate", index: true },
    candidateName: { type: String, required: true },
    panelName: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    stage: { type: String, enum: ["Interview", "Coding Exercise", "Whiteboard Interview"], required: true },
    status: { type: String, enum: ["Scheduled", "Completed", "Cancelled"], default: "Scheduled" },
    feedback: String,
    rating: Number,
  },
  { _id: false },
);

interviewSchema.plugin(idJsonPlugin);

export const Interview = model<InterviewDoc>("Interview", interviewSchema);
