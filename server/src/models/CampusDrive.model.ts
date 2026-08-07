import { Schema, model } from "mongoose";
import { idJsonPlugin } from "./plugins.js";

export interface ScoreBandCutoffs {
  average: number;
  good: number;
  excellent: number;
}

export interface ExperienceSettings {
  testWindow: "anytime" | "scheduled";
  reminderEnabled: boolean;
  shareReport: boolean;
  greetingNote: string;
  allowedDevices: "computers" | "all";
  integrityLevel: "basic" | "ai-proctoring" | "custom";

  testNavigation: "fixed-section-order" | "section-switch";
  testType: "multiple-mark-for-review" | "single-question";
  practiceTest: boolean;
  enableCalculator: boolean;
  sessionTimeoutHours: number;
  maxRestartAllowed: number;

  randomQuestions: boolean;
  randomAnswers: boolean;
  showQuestionScore: boolean;

  displayTimeLeftAlert: boolean;
  allowCandidateFeedback: boolean;
  emailOnReportGeneration: boolean;

  allowCopyPasteInDescriptiveCoding: boolean;
  displayWindowViolationPopup: boolean;
  terminateOnWindowViolation: boolean;
  windowViolationTerminateAfter: number;

  imageProctoringConsecutiveImages: number;
  imageProctoringGreenMax: number;
  imageProctoringYellowMin: number;
  imageProctoringYellowMax: number;
  imageProctoringRedMin: number;
  terminateOnImageViolation: boolean;
  imageViolationTerminateAfterWarnings: number;
}

export interface CampusDriveDoc {
  _id: string;
  name: string;
  college: string;
  role?: string;
  date: string;
  day2Date?: string;
  location: string;
  targetHiring?: number;
  registered: number;
  selected: number;
  description: string;
  createdAt: Date;
  createdByUserId?: string;
  deletedAt?: Date | null;
  status: "Draft" | "Ongoing" | "Completed";
  // Whether this drive runs one online-assessment session or two (e.g. a morning
  // and afternoon batch when the college lacks enough systems to test everyone at
  // once). Defaults to "single" — the pre-two-batch experience.
  oaBatchMode: "single" | "two";
  questionIds?: string[];
  assessmentId?: string;
  examDate?: string;
  examStartTime?: string;
  examEndTime?: string;
  cutoffPercentage?: number;
  scoreBandCutoffs?: ScoreBandCutoffs;
  experienceSettings?: ExperienceSettings;
  // Optional second batch (e.g. an afternoon session) — own test link/password/question
  // set, published independently. Absent means the drive runs a single batch.
  assessmentIdBatch2?: string;
  questionIdsBatch2?: string[];
  examStartTimeBatch2?: string;
  examEndTimeBatch2?: string;
  cutoffPercentageBatch2?: number;
  scoreBandCutoffsBatch2?: ScoreBandCutoffs;
}

const scoreBandCutoffsSchema = new Schema<ScoreBandCutoffs>(
  { average: Number, good: Number, excellent: Number },
  { _id: false },
);

const experienceSettingsSchema = new Schema<ExperienceSettings>(
  {
    testWindow: { type: String, enum: ["anytime", "scheduled"] },
    reminderEnabled: Boolean,
    shareReport: Boolean,
    greetingNote: String,
    allowedDevices: { type: String, enum: ["computers", "all"] },
    integrityLevel: { type: String, enum: ["basic", "ai-proctoring", "custom"] },

    testNavigation: { type: String, enum: ["fixed-section-order", "section-switch"] },
    testType: { type: String, enum: ["multiple-mark-for-review", "single-question"] },
    practiceTest: Boolean,
    enableCalculator: Boolean,
    sessionTimeoutHours: Number,
    maxRestartAllowed: Number,

    randomQuestions: Boolean,
    randomAnswers: Boolean,
    showQuestionScore: Boolean,

    displayTimeLeftAlert: Boolean,
    allowCandidateFeedback: Boolean,
    emailOnReportGeneration: Boolean,

    allowCopyPasteInDescriptiveCoding: Boolean,
    displayWindowViolationPopup: Boolean,
    terminateOnWindowViolation: Boolean,
    windowViolationTerminateAfter: Number,

    imageProctoringConsecutiveImages: Number,
    imageProctoringGreenMax: Number,
    imageProctoringYellowMin: Number,
    imageProctoringYellowMax: Number,
    imageProctoringRedMin: Number,
    terminateOnImageViolation: Boolean,
    imageViolationTerminateAfterWarnings: Number,
  },
  { _id: false },
);

const campusDriveSchema = new Schema<CampusDriveDoc>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    college: { type: String, required: true, index: true },
    role: String,
    date: { type: String, required: true },
    day2Date: String,
    location: { type: String, required: true },
    targetHiring: Number,
    registered: { type: Number, default: 0 },
    selected: { type: Number, default: 0 },
    description: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now, index: true },
    createdByUserId: { type: String, ref: "User" },
    deletedAt: { type: Date, default: null, index: true },
    status: { type: String, enum: ["Draft", "Ongoing", "Completed"], default: "Draft" },
    oaBatchMode: { type: String, enum: ["single", "two"], default: "single" },
    questionIds: [{ type: String, ref: "Question" }],
    assessmentId: { type: String, ref: "Assessment", index: true },
    examDate: String,
    examStartTime: String,
    examEndTime: String,
    cutoffPercentage: Number,
    scoreBandCutoffs: scoreBandCutoffsSchema,
    experienceSettings: experienceSettingsSchema,
    assessmentIdBatch2: { type: String, ref: "Assessment", index: true },
    questionIdsBatch2: [{ type: String, ref: "Question" }],
    examStartTimeBatch2: String,
    examEndTimeBatch2: String,
    cutoffPercentageBatch2: Number,
    scoreBandCutoffsBatch2: scoreBandCutoffsSchema,
  },
  { _id: false },
);

campusDriveSchema.plugin(idJsonPlugin);

export const CampusDrive = model<CampusDriveDoc>("CampusDrive", campusDriveSchema);
