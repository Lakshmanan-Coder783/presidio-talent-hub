import { Schema, model } from "mongoose";
import { idJsonPlugin } from "./plugins.js";

export interface SectionScores {
  aptitude?: number;
  logical?: number;
  technical?: number;
  coding?: number;
  verbal?: number;
  quants?: number;
  cpp?: number;
  oops?: number;
  sql?: number;
  htmlcssjs?: number;
  subjective?: number;
  sqlQuery?: number;
}

export interface PracticalAiEvaluation {
  codingScore?: number;
  codingFeedback?: string;
  sqlScore?: number;
  sqlFeedback?: string;
  subjectiveScore?: number;
  subjectiveFeedback?: string;
  overallPracticalScore?: number;
  summary?: string;
  evaluatedAt?: string;
}

export interface CandidateDoc {
  _id: string;
  name: string;
  driveId: string;
  college: string;
  degree: string;
  cgpa: number;
  email: string;
  phone: string;
  gender: "Male" | "Female" | "Other";

  assessmentStatus: "Not Invited" | "Pending" | "InProgress" | "Completed";
  assessmentPassword?: string;
  assessmentId?: string;
  accessMode?: "remote" | "in-person";
  inviteToken?: string;
  assessmentScore?: number;
  assessmentPercentile?: number;
  assessmentRank?: number;
  assessmentDurationUsed?: number;
  assessmentSubmissionDate?: string;
  extraTimeMinutes?: number;
  sectionScores?: SectionScores;

  interviewStatus: "Not Scheduled" | "Scheduled" | "Ongoing" | "Passed" | "Failed";
  interviewFeedback?: string;
  offerStatus: "None" | "Offered" | "Accepted" | "Declined" | "Joined";
  funnelStage:
    | "Applied"
    | "Online Test"
    | "Interview"
    | "Coding Exercise"
    | "Whiteboard Interview"
    | "Offered"
    | "Joined";

  registrationNumber?: string;
  specialization?: string;
  dateOfBirth?: string;
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

  attendanceMarked?: boolean;
  inviteEmailSentAt?: string;

  restartCount?: number;
  feedbackRating?: number;
  feedbackComment?: string;

  windowViolationCount?: number;
  imageViolationCount?: number;
  proctoringTerminated?: boolean;

  deviceBrowser?: string;
  deviceOS?: string;
  mockIpAddress?: string;

  oaShortlisted?: boolean;
  practicalAiEvaluation?: PracticalAiEvaluation;

  interviewPrimaryPanelistId?: string;
  interviewSecondaryPanelistId?: string;
  interviewTimeSlot?: string;
  interviewAptitudeScore?: number;
  interviewAptitudeComments?: string;
  interviewTechnicalScore?: number;
  interviewTechnicalComments?: string;
  interviewProblemSolvingScore?: number;
  interviewProblemSolvingComments?: string;
  interviewCommunicationScore?: number;
  interviewCommunicationComments?: string;
  interviewAnyOther?: string;
  interviewOverallFeedback?: string;
  interviewShortlisted?: boolean;

  codingTopic?: string;
  codingExerciseStartTime?: string;
  codingTechStack?: string;
  codingExerciseReview?: string;
  codingCheckpoint1?: string;
  codingCheckpoint2?: string;
  codingCheckpoint3?: string;
  codingScore?: number;
  codingShortlisted?: boolean;

  whiteboardComments?: string;
  whiteboardFinalResult?: "Selected" | "Not Selected";
}

const sectionScoresSchema = new Schema<SectionScores>(
  {
    aptitude: Number,
    logical: Number,
    technical: Number,
    coding: Number,
    verbal: Number,
    quants: Number,
    cpp: Number,
    oops: Number,
    sql: Number,
    htmlcssjs: Number,
    subjective: Number,
    sqlQuery: Number,
  },
  { _id: false },
);

const practicalAiEvaluationSchema = new Schema<PracticalAiEvaluation>(
  {
    codingScore: Number,
    codingFeedback: String,
    sqlScore: Number,
    sqlFeedback: String,
    subjectiveScore: Number,
    subjectiveFeedback: String,
    overallPracticalScore: Number,
    summary: String,
    evaluatedAt: String,
  },
  { _id: false },
);

const candidateSchema = new Schema<CandidateDoc>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    driveId: { type: String, required: true, ref: "CampusDrive", index: true },
    college: { type: String, required: true },
    degree: { type: String, required: true },
    cgpa: Number,
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: String,
    gender: { type: String, enum: ["Male", "Female", "Other"] },

    assessmentStatus: {
      type: String,
      enum: ["Not Invited", "Pending", "InProgress", "Completed"],
      default: "Not Invited",
    },
    assessmentPassword: String,
    assessmentId: { type: String, ref: "Assessment", index: true },
    accessMode: { type: String, enum: ["remote", "in-person"] },
    inviteToken: { type: String, index: true, sparse: true },
    assessmentScore: Number,
    assessmentPercentile: Number,
    assessmentRank: Number,
    assessmentDurationUsed: Number,
    assessmentSubmissionDate: String,
    extraTimeMinutes: Number,
    sectionScores: sectionScoresSchema,

    interviewStatus: {
      type: String,
      enum: ["Not Scheduled", "Scheduled", "Ongoing", "Passed", "Failed"],
      default: "Not Scheduled",
    },
    interviewFeedback: String,
    offerStatus: {
      type: String,
      enum: ["None", "Offered", "Accepted", "Declined", "Joined"],
      default: "None",
    },
    funnelStage: {
      type: String,
      enum: [
        "Applied",
        "Online Test",
        "Interview",
        "Coding Exercise",
        "Whiteboard Interview",
        "Offered",
        "Joined",
      ],
      default: "Applied",
    },

    registrationNumber: String,
    specialization: String,
    dateOfBirth: String,
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

    attendanceMarked: Boolean,
    inviteEmailSentAt: String,

    restartCount: Number,
    feedbackRating: Number,
    feedbackComment: String,

    windowViolationCount: Number,
    imageViolationCount: Number,
    proctoringTerminated: Boolean,

    deviceBrowser: String,
    deviceOS: String,
    mockIpAddress: String,

    oaShortlisted: Boolean,
    practicalAiEvaluation: practicalAiEvaluationSchema,

    interviewPrimaryPanelistId: { type: String, ref: "User" },
    interviewSecondaryPanelistId: { type: String, ref: "User" },
    interviewTimeSlot: String,
    interviewAptitudeScore: Number,
    interviewAptitudeComments: String,
    interviewTechnicalScore: Number,
    interviewTechnicalComments: String,
    interviewProblemSolvingScore: Number,
    interviewProblemSolvingComments: String,
    interviewCommunicationScore: Number,
    interviewCommunicationComments: String,
    interviewAnyOther: String,
    interviewOverallFeedback: String,
    interviewShortlisted: Boolean,

    codingTopic: String,
    codingExerciseStartTime: String,
    codingTechStack: String,
    codingExerciseReview: String,
    codingCheckpoint1: String,
    codingCheckpoint2: String,
    codingCheckpoint3: String,
    codingScore: Number,
    codingShortlisted: Boolean,

    whiteboardComments: String,
    whiteboardFinalResult: { type: String, enum: ["Selected", "Not Selected"] },
  },
  { _id: false },
);

// NOT unique: the real historical seed corpus contains legitimate repeat
// (driveId, email) pairs (candidates re-registering across the same drive's
// re-run years apart etc.) — dedup-within-an-import-batch stays an
// application-layer rule (bulkImportCandidates), not a hard DB constraint.
candidateSchema.index({ driveId: 1, email: 1 });
// Exact lookup used by loginCandidateByTestSlug.
candidateSchema.index({ email: 1, assessmentId: 1 });
candidateSchema.index({ funnelStage: 1 });
candidateSchema.index({ offerStatus: 1 });

candidateSchema.plugin(idJsonPlugin);

export const Candidate = model<CandidateDoc>("Candidate", candidateSchema);
