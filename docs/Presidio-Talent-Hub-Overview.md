# Presidio Talent Hub

**Campus Recruitment & Assessment Platform — Product & Technical Overview**

---

## 1. The Problem

Campus recruitment at scale involves a lot of moving, disconnected parts: student rosters
from partner colleges, online assessments, interview scheduling, coding/whiteboard rounds,
offer tracking, and reporting back to leadership — traditionally spread across spreadsheets,
email threads, and ad-hoc tools. That makes it hard to answer simple questions quickly
("how many candidates are mid-pipeline right now?", "who still needs to be interviewed?")
and creates inconsistent candidate experiences across drives and colleges.

## 2. The Solution

Presidio Talent Hub is a single, unified web application covering the entire campus hiring
lifecycle for the Talent Acquisition team:

- Creating and configuring campus drives (per college, per role)
- Uploading and managing student/candidate rosters
- Building a shared, reusable Question Bank and assigning assessments
- Candidates taking online assessments (remote or in-person) with proctoring controls
- Advancing shortlisted candidates through Interview → Coding → Whiteboard rounds
- Releasing and tracking offers
- Reporting and executive-level analytics, in real time, from one dashboard

## 3. Who Uses It

| Role | Scope |
|---|---|
| **Super Admin** | Full control — every drive, question bank, assessment settings, user/membership management |
| **SPOC** (Single Point of Contact) | Owns one or more specific drives; can manage Panel/Evaluator members on their drive(s), advance candidates, release offers |
| **Panel** | Interviewer on a specific drive; can advance candidates through Interview and Coding Exercise stages |
| **Evaluator** | Can create their own drives; scores candidates; broader read access on drives they're assigned to |
| **Candidate** | Registers for a drive, logs in (passwordless or shared-password, depending on invite method), takes the assessment |

Access is scoped **per drive**, not global — a SPOC or Panel member only sees and acts on
the drives they're actually assigned to (`getVisibleDrives` in
`src/utils/permissions.ts`), except Super Admins, who see everything.

## 4. End-to-End Hiring Funnel

```
Applied → Online Test → Interview → Coding Exercise → Whiteboard Interview → Offered → Joined
```

Every candidate record carries a `funnelStage`, and the Executive Dashboard's Hiring Funnel
chart is a live, cumulative conversion view across these stages — computed directly from
the candidate collection, not a static report.

## 5. Core Modules

### Campus Drive Management
Create a drive per college/role, configure test duration and scoring bands, upload student
rosters (bulk import via spreadsheet), track registered vs. selected counts, and monitor
per-drive progress (Online Test → Whiteboarding) at a glance from the Campus Drive list.

### Question Bank
A shared, reusable pool of assessment questions (aptitude, technical, coding), tagged by
topic, type, and difficulty, that any drive's assessment can be assembled from.

### Online Assessment (Candidate Experience)
Candidates log in with a drive-specific test link — either a **passwordless magic link**
(remote invites, emailed per-candidate with a unique high-entropy token) or a
**shared password** (in-person drives, one password for the room). The test runs with
configurable proctoring: fullscreen enforcement, tab-switch/window-violation detection, and
optional AI proctoring, all logged per candidate.

### Candidate Pipeline & Evaluation
A single view per drive of every candidate's current stage, assessment score, and
interview/coding/offer status, with sortable/searchable tables and CSV export.

### Interview Round, Coding Round, Whiteboard Round
Shortlisting candidates forward stage-by-stage, with panelists recording structured scores
and comments (aptitude, communication, problem-solving, technical) per candidate.

### Offers & Reports
Releasing offer decisions, and two dedicated reporting views — Candidate Pipeline Report
and Evaluate Report — for drilling into scores, pass rates, and pooled cross-drive
averages.

### Executive Dashboard
Real-time KPIs (total candidates, active drives, active assessments, joining rate), the
Hiring Funnel chart, per-college registered-vs-selected comparison, score distribution, and
gender/degree breakdowns — filterable by year and college.

## 6. Security & Data Handling

- **Passwordless candidate access**: remote invites carry a per-candidate, high-entropy
  `inviteToken` (a cryptographically random magic-link secret embedded in the invite email
  URL) — anyone without that exact token cannot access another candidate's test session.
- **Field-level redaction**: a candidate's email and phone are redacted (`••••••••`) for any
  viewer without sufficient role/drive access (`redactCandidateForViewer`), so, e.g., a
  Panel member on one drive cannot see contact details they don't need.
- **Server-authoritative scoring**: assessment score and total marks are snapshotted at
  submission time server-side, not trusted from the client, and capped at 100% as a safety
  net.

## 7. Technical Architecture

```
┌────────────────────┐        ┌──────────────────────┐        ┌─────────────────┐
│   React 19 + Vite   │  REST  │   Express 5 API       │        │   MongoDB        │
│   Frontend (SPA)    │ ─────▶ │   (Node.js, TS)        │ ─────▶ │   (Mongoose ODM) │
└────────────────────┘        └──────────────────────┘        └─────────────────┘
```

- **Frontend**: React 19, TypeScript, Vite, React Router v6, Tailwind, Radix UI, Recharts
- **Backend**: Express 5, Mongoose 9 (MongoDB), Zod validation, JWT/MSAL scaffolding for
  Microsoft Entra ID SSO
- **State**: a single `AppContext` holds the app's shared data (`drives`, `candidates`,
  `assessments`, `questions`, `interviews`, `offers`, `users`, `driveMemberships`,
  `collegeStudents`), hydrated on demand from the real backend per page/module rather than
  fetched all at once at login.

## 8. Engineering Highlight: On-Demand, Per-Module Data Loading

Earlier iterations fetched every data collection the app could possibly need the moment a
user logged in. This was reworked to an on-demand model (`ensureLoaded` in
`src/context/AppContext.tsx`): each page declares exactly which fields it needs, fetched
only when that page is actually opened, refetched fresh on every revisit so data never goes
stale, and consolidated into single combined endpoints where a page's data has repeat
dependencies (e.g. the Campus Drive list and Executive Dashboard each now load in **one**
API call instead of 5 and 3 respectively). Every stage of this work was verified with
live, scripted browser checks (Playwright) confirming the exact network requests fired per
click, not just a code read-through.

## 9. What's Next

Natural next steps building on the current foundation:
- Wire the existing MSAL/JWT scaffolding through to real Microsoft Entra ID SSO login
- Role-scoped drive visibility enforced server-side (currently enforced in the frontend;
  the backend `listDrives` endpoint notes this as a follow-up)
- Automated email/notification digests for pipeline stage changes

---
*Generated from the current codebase — every module, role, and mechanism described above
reflects what's actually implemented, not aspirational features.*
