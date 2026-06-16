export interface CampusDrive {
  id: string;
  name: string;
  college: string;
  date: string;
  location: string;
  targetHiring: number;
  registered: number;
  shortlisted: number;
  spocName: string;
  spocContact: string;
  description: string;
  status: 'Draft' | 'Published' | 'Completed' | 'Ongoing';
}

export interface Candidate {
  id: string;
  name: string;
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
  };
  interviewStatus: 'Not Scheduled' | 'Scheduled' | 'Ongoing' | 'Passed' | 'Failed';
  interviewFeedback?: string;
  offerStatus: 'None' | 'Offered' | 'Accepted' | 'Declined' | 'Joined';
  funnelStage: 'Applied' | 'Online Test' | 'Interview' | 'Coding Exercise' | 'Whiteboard Interview' | 'Offered' | 'Joined';
}

export interface AssessmentSection {
  name: 'Aptitude' | 'Logical Reasoning' | 'Technical' | 'Coding' | 'Verbal';
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
  topic: 'Aptitude' | 'Logical Reasoning' | 'Technical' | 'Coding' | 'Verbal';
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
