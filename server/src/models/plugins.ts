import type { Schema } from "mongoose";

/**
 * All models use a business-meaningful string as _id (e.g. "DRV-2026-101") so
 * foreign keys (candidate.driveId, interview.candidateId, ...) never need
 * remapping from the existing frontend types. This plugin just strips
 * Mongoose's internal __v/_id-duplication noise from JSON output and exposes
 * `id` as an alias of `_id` to match src/types/index.ts exactly.
 */
export function idJsonPlugin(schema: Schema): void {
  schema.set("toJSON", {
    virtuals: true,
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    },
  });
}
