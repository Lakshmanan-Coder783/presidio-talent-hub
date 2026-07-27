import { Schema, model } from "mongoose";
import { idJsonPlugin } from "./plugins.js";

export interface CollegeStudentDoc {
  _id: string;
  college: string;
  name: string;
  email: string;
  phone: string;
  registrationNumber?: string;
  degree: string;
  specialization?: string;
  gender: "Male" | "Female" | "Other";
  dateOfBirth?: string;
  cgpa: number;
  githubUrl?: string;
  linkedinUrl?: string;
  resumeUrl?: string;
  codingPlatformUrls?: string;
  tenth?: number;
  twelfth?: number;
  diploma?: number;
  ugMarks?: number;
  pgMarks?: number;
  backlogHistory?: number;
  currentBacklogs?: number;
  importedAt: Date;
}

const collegeStudentSchema = new Schema<CollegeStudentDoc>(
  {
    _id: { type: String, required: true },
    college: { type: String, required: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: String,
    registrationNumber: String,
    degree: { type: String, required: true },
    specialization: String,
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    dateOfBirth: String,
    cgpa: Number,
    githubUrl: String,
    linkedinUrl: String,
    resumeUrl: String,
    codingPlatformUrls: String,
    tenth: Number,
    twelfth: Number,
    diploma: Number,
    ugMarks: Number,
    pgMarks: Number,
    backlogHistory: Number,
    currentBacklogs: Number,
    importedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

collegeStudentSchema.index({ college: 1, email: 1 }, { unique: true });

collegeStudentSchema.plugin(idJsonPlugin);

export const CollegeStudent = model<CollegeStudentDoc>("CollegeStudent", collegeStudentSchema);
