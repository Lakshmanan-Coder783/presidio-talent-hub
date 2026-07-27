/**
 * Seeds MongoDB with a realistic historical mock dataset for local/dev use.
 * The generator itself lives in server/scripts/mockData.ts (server-only) —
 * the frontend's src/utils/db.ts deliberately ships with no mock data of its
 * own and starts from an empty Database shape.
 *
 * Run with: npm run seed -w server  (or `npm run seed` from repo root)
 */
import type { Model } from "mongoose";
import "../src/config/env.js";
import { connectDB, disconnectDB } from "../src/config/db.js";
import { generateMockDatabase } from "./mockData.js";

import { User } from "../src/models/User.model.js";
import { DriveMembership } from "../src/models/DriveMembership.model.js";
import { CampusDrive } from "../src/models/CampusDrive.model.js";
import { Candidate } from "../src/models/Candidate.model.js";
import { CollegeStudent } from "../src/models/CollegeStudent.model.js";
import { Assessment } from "../src/models/Assessment.model.js";
import { Question } from "../src/models/Question.model.js";
import { Interview } from "../src/models/Interview.model.js";
import { Offer } from "../src/models/Offer.model.js";
import { Counter } from "../src/models/Counter.model.js";

/** Renames the frontend's `id` field to `_id` for every record in the array. */
function withMongoId<T extends { id: string }>(records: T[]): Array<Omit<T, "id"> & { _id: string }> {
  return records.map(({ id, ...rest }) => ({ _id: id, ...rest }));
}

/**
 * After inserting seeded records with their fixed historical IDs, the Counter
 * collection (used by server/src/utils/ids.ts for atomic ID generation on new
 * records) needs to be advanced past the highest seeded number per key —
 * otherwise the first drive/candidate/etc created through the real app after
 * seeding would collide with an existing seeded ID.
 *
 * `keyOf` maps a match's captured groups to the counter key (e.g. the year),
 * and `seqOf` maps them to the Counter.seq value that makes the *next*
 * generated ID continue right after the highest seeded one.
 */
async function advanceCounters(
  ids: string[],
  pattern: RegExp,
  keyOf: (m: RegExpMatchArray) => string,
  seqOf: (m: RegExpMatchArray) => number,
) {
  const maxSeqByKey = new Map<string, number>();
  for (const id of ids) {
    const m = id.match(pattern);
    if (!m) continue;
    const key = keyOf(m);
    const seq = seqOf(m);
    maxSeqByKey.set(key, Math.max(maxSeqByKey.get(key) ?? 0, seq));
  }
  await Promise.all(
    Array.from(maxSeqByKey.entries()).map(([key, seq]) =>
      Counter.findOneAndUpdate({ _id: key }, { $set: { seq } }, { upsert: true }),
    ),
  );
}

async function seed() {
  console.log("[seed] connecting to MongoDB...");
  await connectDB();

  console.log("[seed] generating mock dataset...");
  const db = generateMockDatabase();

  // Heterogeneous array of differently-typed Mongoose models — only shared
  // methods (deleteMany/countDocuments/modelName) are used below.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const models: Model<any>[] = [User, DriveMembership, CampusDrive, Candidate, CollegeStudent, Assessment, Question, Interview, Offer, Counter];

  console.log("[seed] clearing existing collections...");
  await Promise.all(models.map((m) => m.deleteMany({})));

  console.log("[seed] inserting documents...");
  await User.insertMany(withMongoId(db.users));
  await DriveMembership.insertMany(withMongoId(db.driveMemberships));
  await CampusDrive.insertMany(withMongoId(db.drives));
  await Question.insertMany(withMongoId(db.questions));
  await Assessment.insertMany(withMongoId(db.assessments));
  await Candidate.insertMany(withMongoId(db.candidates));
  await Interview.insertMany(withMongoId(db.interviews));
  await Offer.insertMany(withMongoId(db.offers));
  if (db.collegeStudents.length > 0) {
    await CollegeStudent.insertMany(withMongoId(db.collegeStudents));
  }

  console.log("[seed] advancing ID counters past seeded data...");
  await advanceCounters(
    db.drives.map((d) => d.id),
    /^DRV-(\d+)-(\d+)$/,
    (m) => `drive:${m[1]}`,
    (m) => Number(m[2]) - 100 + 1,
  );
  await advanceCounters(
    db.candidates.map((c) => c.id),
    /^PRES(\d+)-(\d+)$/,
    (m) => `candidate:${m[1]}`,
    (m) => Number(m[2]) - 10000 + 1,
  );
  await advanceCounters(
    db.assessments.map((a) => a.id),
    /^ASM-(\d+)$/,
    () => "assessment",
    (m) => Number(m[1]) - 2000 + 1,
  );
  await advanceCounters(
    db.questions.map((q) => q.id),
    /^Q-(\d+)$/,
    () => "question",
    (m) => Number(m[1]) - 1000 + 1,
  );
  await advanceCounters(
    db.interviews.map((i) => i.id),
    /^INT-(\d+)-(\d+)$/,
    (m) => `interview:${m[1]}`,
    (m) => Number(m[2]) - 1000 + 1,
  );
  await advanceCounters(
    db.offers.map((o) => o.id),
    /^OFF-(\d+)-(\d+)$/,
    (m) => `offer:${m[1]}`,
    (m) => Number(m[2]) - 200 + 1,
  );
  await advanceCounters(
    db.driveMemberships.map((m) => m.id),
    /^MEM-(\d+)$/,
    () => "membership",
    (m) => Number(m[1]),
  );
  await advanceCounters(
    db.users.map((u) => u.id),
    /^USR-(\d+)$/,
    () => "user",
    (m) => Number(m[1]),
  );

  console.log("[seed] done. Document counts:");
  for (const m of models) {
    const count = await m.countDocuments();
    console.log(`  ${m.modelName}: ${count}`);
  }

  await disconnectDB();
}

seed().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
