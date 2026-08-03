import type { CampusDrive, Candidate, Assessment, Question, Interview, Offer, CollegeStudent, User, DriveMembership } from '../types';

export interface Database {
  drives: CampusDrive[];
  trashedDrives: CampusDrive[];
  candidates: Candidate[];
  assessments: Assessment[];
  questions: Question[];
  interviews: Interview[];
  offers: Offer[];
  collegeStudents: CollegeStudent[];
  users: User[];
  driveMemberships: DriveMembership[];
}

function emptyDatabase(): Database {
  return {
    drives: [],
    trashedDrives: [],
    candidates: [],
    assessments: [],
    questions: [],
    interviews: [],
    offers: [],
    collegeStudents: [],
    users: [],
    driveMemberships: [],
  };
}

const DB_VERSION = '26';

export function getDatabase(): Database {
  if (localStorage.getItem('presidio_talent_hub_db_version') !== DB_VERSION) {
    localStorage.removeItem('presidio_talent_hub_db');
    localStorage.setItem('presidio_talent_hub_db_version', DB_VERSION);
  }
  const data = localStorage.getItem('presidio_talent_hub_db');
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (!parsed.collegeStudents) parsed.collegeStudents = [];
      if (!parsed.users) parsed.users = [];
      if (!parsed.driveMemberships) parsed.driveMemberships = [];
      if (!parsed.trashedDrives) parsed.trashedDrives = [];
      return parsed;
    } catch (e) {
      console.error('Failed to parse database from localStorage, re-seeding.', e);
    }
  }
  const db = emptyDatabase();
  saveDatabase(db);
  return db;
}

export function saveDatabase(db: Database): void {
  localStorage.setItem('presidio_talent_hub_db', JSON.stringify(db));
  window.dispatchEvent(new CustomEvent('presidio-db-updated', { detail: db }));
}

export function resetDatabase(): Database {
  localStorage.removeItem('presidio_talent_hub_db');
  localStorage.removeItem('presidio_talent_hub_db_version');
  return getDatabase();
}
