export interface CampusDrive {
  id: string;
  name: string;
  college: string;
  date: string;
  day2Date?: string;
  location: string;
  targetHiring?: number;
  registered: number;
  selected: number;
  spocName: string;
  spocContact: string;
  description: string;
  status: 'Draft' | 'Published' | 'Completed' | 'Ongoing';
  accessMode: 'in-person' | 'remote';
  questionIds?: string[];
  assessmentId?: string;
  examDate?: string;
  examStartTime?: string; // HH:mm, used for in-person time-window enforcement
  examEndTime?: string;   // HH:mm
  cutoffPercentage?: number; // OA shortlisting cutoff (default 40)
  experienceSettings?: {
    testWindow: 'anytime' | 'scheduled';
    reminderEnabled: boolean;
    testAttempts: 1 | 3;
    shareReport: boolean;
    greetingNote: string;
    allowedDevices: 'computers' | 'all';
    integrityLevel: 'basic' | 'ai-proctoring' | 'custom';
  };
}

export interface Candidate {
  id: string;
  name: string;
  driveId: string;
  college: string;
  degree: string;
  cgpa: number;
  email: string;
  phone: string;
  assessmentStatus: 'Not Invited' | 'Pending' | 'InProgress' | 'Completed';
  assessmentPassword?: string;
  assessmentId?: string;
  assessmentScore?: number;
  assessmentPercentile?: number;
  assessmentRank?: number;
  assessmentDurationUsed?: number; // in seconds
  assessmentSubmissionDate?: string;
  sectionScores?: {
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
  };
  gender: 'Male' | 'Female' | 'Other';
  interviewStatus: 'Not Scheduled' | 'Scheduled' | 'Ongoing' | 'Passed' | 'Failed';
  interviewFeedback?: string;
  offerStatus: 'None' | 'Offered' | 'Accepted' | 'Declined' | 'Joined';
  funnelStage: 'Applied' | 'Online Test' | 'Interview' | 'Coding Exercise' | 'Whiteboard Interview' | 'Offered' | 'Joined';
  // Extended fields from student database import (PDF format)
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
  // Attendance & invite tracking
  attendanceMarked?: boolean;
  inviteEmailSentAt?: string;

  // OA shortlisting
  oaShortlisted?: boolean;
  practicalAiEvaluation?: {
    codingScore?: number;
    codingFeedback?: string;
    sqlScore?: number;
    sqlFeedback?: string;
    subjectiveScore?: number;
    subjectiveFeedback?: string;
    overallPracticalScore?: number;
    summary?: string;
    evaluatedAt?: string;
  };

  // Interview Round
  interviewPanel?: string;
  interviewPanelMembers?: string;
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

  // Coding Round
  codingPanel?: string;
  codingPanelMembers?: string;
  codingTimeSlot?: string;
  codingExerciseStartTime?: string;
  codingTechStack?: string;
  codingExerciseGiven?: boolean;
  codingExerciseReview?: string;
  codingCheckpoint1?: string;
  codingCheckpoint2?: string;
  codingCheckpoint3?: string;
  codingShortlisted?: boolean;

  // Whiteboarding Round
  whiteboardSelectedForCulturalFit?: boolean;
  whiteboardComments?: string;
  whiteboardFinalResult?: 'Selected' | 'Rejected' | 'Waitlisted';
}

export interface CollegeStudent {
  id: string;
  college: string;
  name: string;
  email: string;
  phone: string;
  registrationNumber?: string;
  degree: string;
  specialization?: string;
  gender: 'Male' | 'Female' | 'Other';
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
  importedAt: string;
}

export interface AssessmentSection {
  name: 'Aptitude' | 'Logical Reasoning' | 'Technical' | 'Coding' | 'Verbal'
      | 'Quants' | 'Logical' | 'C/C++' | 'OOPs' | 'SQL' | 'HTML/CSS/JS'
      | 'Subjective' | 'SQL Query';
  questionCount: number;
  marks: number;
}

export interface Assessment {
  id: string;
  name: string;
  type: 'Coding' | 'Aptitude' | 'Technical' | 'Combined';
  duration: number; // in minutes
  totalMarks: number;
  candidatesAssignedCount: number;
  status: 'Draft' | 'Active' | 'Closed';
  sections: AssessmentSection[];
  questionIds: string[];
  slug?: string;
  accessPassword?: string;
}

export interface TestCase {
  input: string;
  output: string;
  isSecret?: boolean;
}

export interface Question {
  id: string;
  text: string;
  type: 'MCQ' | 'Multiple Select' | 'Coding' | 'SQL' | 'Descriptive';
  topic: 'Aptitude' | 'Logical Reasoning' | 'Technical' | 'Coding' | 'Verbal'
       | 'Quants' | 'Logical' | 'C/C++' | 'OOPs' | 'SQL' | 'HTML/CSS/JS'
       | 'Subjective' | 'SQL Query';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  marks: number;
  tags: string[];
  options?: string[]; // MCQs and MSQs
  correctOptions?: number[]; // Indices of correct options (0-indexed)
  codingTemplate?: {
    javascript?: string;
    python?: string;
    java?: string;
    csharp?: string;
  };
  testCases?: TestCase[];
  title?: string;
  skill?: string;
  estimatedTime?: number;
  functionName?: string;
  functionParams?: Array<{ name: string; type: string; description: string }>;
  returnType?: string;
  returnDescription?: string;
  constraints?: string[];
}

export interface Interview {
  id: string;
  candidateId: string;
  candidateName: string;
  panelName: string;
  date: string;
  time: string;
  stage: 'Interview' | 'Coding Exercise' | 'Whiteboard Interview';
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  feedback?: string;
  rating?: number;
}

export interface Offer {
  id: string;
  candidateId: string;
  candidateName: string;
  college: string;
  ctc: number; // LPA
  status: 'Offered' | 'Accepted' | 'Declined' | 'Joined';
  dateReleased: string;
  joiningDate?: string;
}
