import { Schema, model } from "mongoose";
import { idJsonPlugin } from "./plugins.js";

export type AssessmentSectionName =
  | "Aptitude"
  | "Logical Reasoning"
  | "Technical"
  | "Coding"
  | "Verbal"
  | "Quants"
  | "Logical"
  | "C/C++"
  | "OOPs"
  | "SQL"
  | "HTML/CSS/JS"
  | "Subjective"
  | "SQL Query";

export interface AssessmentSection {
  name: AssessmentSectionName;
  questionCount: number;
  marks: number;
}

export interface AssessmentDoc {
  _id: string;
  name: string;
  type: "Coding" | "Aptitude" | "Technical" | "Combined";
  duration: number;
  totalMarks: number;
  candidatesAssignedCount: number;
  status: "Draft" | "Active" | "Closed";
  sections: AssessmentSection[];
  questionIds: string[];
  slug?: string;
  accessPassword?: string;
}

const assessmentSectionSchema = new Schema<AssessmentSection>(
  {
    name: { type: String, required: true },
    questionCount: { type: Number, required: true },
    marks: { type: Number, required: true },
  },
  { _id: false },
);

const assessmentSchema = new Schema<AssessmentDoc>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ["Coding", "Aptitude", "Technical", "Combined"], required: true },
    duration: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    candidatesAssignedCount: { type: Number, default: 0 },
    status: { type: String, enum: ["Draft", "Active", "Closed"], default: "Draft" },
    sections: [assessmentSectionSchema],
    questionIds: [{ type: String, ref: "Question" }],
    slug: { type: String, unique: true, sparse: true, index: true },
    accessPassword: String,
  },
  { _id: false },
);

assessmentSchema.plugin(idJsonPlugin);

export const Assessment = model<AssessmentDoc>("Assessment", assessmentSchema);
