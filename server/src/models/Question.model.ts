import { Schema, model } from "mongoose";
import { idJsonPlugin } from "./plugins.js";

export type QuestionTopic =
  | "Aptitude"
  | "Logical Reasoning"
  | "Technical"
  | "Coding"
  | "Verbal"
  | "Quants"
  | "Logical"
  | "C/C++"
  | "OOPs"
  | "SQL"
  | "HTML/CSS/JS"
  | "Subjective"
  | "SQL Query";

export interface TestCase {
  input: string;
  output: string;
  isSecret?: boolean;
}

export interface FunctionParam {
  name: string;
  type: string;
  description: string;
}

export interface CodingTemplate {
  javascript?: string;
  python?: string;
  java?: string;
  csharp?: string;
}

export interface QuestionDoc {
  _id: string;
  text: string;
  type: "MCQ" | "Multiple Select" | "Coding" | "SQL" | "Descriptive";
  topic: QuestionTopic;
  difficulty: "Easy" | "Medium" | "Hard";
  marks: number;
  tags: string[];
  options?: string[];
  correctOptions?: number[];
  codingTemplate?: CodingTemplate;
  testCases?: TestCase[];
  title?: string;
  skill?: string;
  estimatedTime?: number;
  functionName?: string;
  functionParams?: FunctionParam[];
  returnType?: string;
  returnDescription?: string;
  constraints?: string[];
}

const testCaseSchema = new Schema<TestCase>(
  { input: String, output: String, isSecret: Boolean },
  { _id: false },
);

const functionParamSchema = new Schema<FunctionParam>(
  { name: String, type: String, description: String },
  { _id: false },
);

const codingTemplateSchema = new Schema<CodingTemplate>(
  { javascript: String, python: String, java: String, csharp: String },
  { _id: false },
);

const questionSchema = new Schema<QuestionDoc>(
  {
    _id: { type: String, required: true },
    text: { type: String, required: true },
    type: { type: String, enum: ["MCQ", "Multiple Select", "Coding", "SQL", "Descriptive"], required: true },
    topic: { type: String, required: true, index: true },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], required: true },
    marks: { type: Number, required: true },
    tags: { type: [String], index: true },
    options: [String],
    correctOptions: [Number],
    codingTemplate: codingTemplateSchema,
    testCases: [testCaseSchema],
    title: String,
    skill: String,
    estimatedTime: Number,
    functionName: String,
    functionParams: [functionParamSchema],
    returnType: String,
    returnDescription: String,
    constraints: [String],
  },
  { _id: false },
);

questionSchema.plugin(idJsonPlugin);

export const Question = model<QuestionDoc>("Question", questionSchema);
