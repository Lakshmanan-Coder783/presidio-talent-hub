import type { CampusDrive } from '../types';

export type ExperienceSettings = NonNullable<CampusDrive['experienceSettings']>;

export const DEFAULT_EXPERIENCE_SETTINGS: ExperienceSettings = {
  testWindow: 'anytime',
  reminderEnabled: false,
  testAttempts: 1,
  shareReport: false,
  greetingNote: '',
  allowedDevices: 'computers',
  integrityLevel: 'basic',
  testNavigation: 'section-switch',
  testType: 'multiple-mark-for-review',
  practiceTest: false,
  enableCalculator: false,
  sessionTimeoutHours: 4,
  maxRestartAllowed: 10,
  randomQuestions: true,
  randomAnswers: false,
  showQuestionScore: false,
  displayTimeLeftAlert: true,
  allowCandidateFeedback: true,
  emailOnReportGeneration: false,
  allowCopyPasteInDescriptiveCoding: false,
  displayWindowViolationPopup: true,
  terminateOnWindowViolation: true,
  windowViolationTerminateAfter: 5,
  imageProctoringConsecutiveImages: 3,
  imageProctoringGreenMax: 2,
  imageProctoringYellowMin: 3,
  imageProctoringYellowMax: 5,
  imageProctoringRedMin: 6,
  terminateOnImageViolation: false,
  imageViolationTerminateAfterWarnings: 5,
};

export const resolveExperienceSettings = (drive?: { experienceSettings?: CampusDrive['experienceSettings'] } | null): ExperienceSettings => ({
  ...DEFAULT_EXPERIENCE_SETTINGS,
  ...drive?.experienceSettings,
});
