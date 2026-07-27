import { Schema, model } from "mongoose";

export interface CounterDoc {
  _id: string;
  seq: number;
}

const counterSchema = new Schema<CounterDoc>(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { _id: false },
);

export const Counter = model<CounterDoc>("Counter", counterSchema);

export async function nextSeq(counterName: string): Promise<number> {
  const doc = await Counter.findOneAndUpdate(
    { _id: counterName },
    { $inc: { seq: 1 } },
    { upsert: true, new: true },
  );
  return doc.seq;
}
