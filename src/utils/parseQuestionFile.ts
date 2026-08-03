import type { Question } from '../types';

export type ParsedQuestionRow = Omit<Question, 'id'>;

const TYPE_MAP: Record<string, Question['type']> = {
  'MCQ': 'MCQ',
  'MCQ (Checkboxes)': 'Multiple Select',
  'Coding': 'Coding',
  'SQL': 'SQL',
  'Descriptive': 'Descriptive',
};

const DIFFICULTY_MAP: Record<string, Question['difficulty']> = {
  Easy: 'Easy',
  Medium: 'Medium',
  Hard: 'Hard',
};

/**
 * Parses rows matching the "REQUIRED CSV COLUMNS" documented in the Upload Questions in
 * Bulk modal:
 * Question Title, Question Type, Skill, Tags, Difficulty Level, Question Text,
 * Visuals/Additional Information, Answer Choice 1, Answer Choice 2, Answer Choice 3
 * (optional), Answer Choice 4 (optional), Answer Choice 5 (optional), Correct answer,
 * Answer Description (optional), Positive marks, Negative marks
 *
 * "Visuals/Additional Information", "Answer Description", and "Negative marks" have no
 * corresponding field on the Question model — parsed out of the row but intentionally
 * dropped. `topic` (required server-side) isn't a documented column at all, so it's
 * defaulted to 'Technical', matching the manual Add Question form's own default.
 */
function rowToQuestion(cols: string[]): ParsedQuestionRow | null {
  const [
    title, typeRaw, skill, tagsRaw, difficultyRaw, text, , opt1, opt2, opt3, opt4, opt5,
    correctRaw, , positiveMarksStr,
  ] = cols;

  if (!title && !text) return null;

  const options = [opt1, opt2, opt3, opt4, opt5].map(o => o?.trim()).filter((o): o is string => !!o);

  const correctOptions = (correctRaw ?? '')
    .split(',')
    .map(c => c.trim())
    .map(c => {
      const match = c.match(/(\d+)/);
      return match ? Number(match[1]) - 1 : null;
    })
    .filter((n): n is number => n !== null && n >= 0);

  return {
    title: title || undefined,
    type: TYPE_MAP[typeRaw?.trim()] ?? 'MCQ',
    topic: 'Technical',
    skill: skill || undefined,
    tags: (tagsRaw ?? '').split(',').map(t => t.trim()).filter(Boolean),
    difficulty: DIFFICULTY_MAP[difficultyRaw?.trim()] ?? 'Medium',
    text: text || '',
    options: options.length > 0 ? options : undefined,
    correctOptions: correctOptions.length > 0 ? correctOptions : undefined,
    marks: parseFloat(positiveMarksStr) || 1,
  };
}

// Quote-aware split — a naive `line.split(',')` breaks the documented multi-select
// format ("Correct answer: Choice 1, Choice 2 …"), since a quoted cell containing
// commas would otherwise get sliced into extra columns and misalign everything after it.
function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      cells.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  cells.push(cur.trim());
  return cells;
}

export function parseQuestionCsvText(text: string): ParsedQuestionRow[] {
  const lines = text.split('\n').filter(l => l.trim());
  const firstCell = splitCsvLine(lines[0] ?? '')[0]?.toLowerCase();
  const dataLines = firstCell === 'question title' ? lines.slice(1) : lines;

  const rows: ParsedQuestionRow[] = [];
  for (const line of dataLines) {
    const row = rowToQuestion(splitCsvLine(line));
    if (row) rows.push(row);
  }
  return rows;
}

async function parseXlsxBuffer(buffer: ArrayBuffer): Promise<ParsedQuestionRow[]> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const csvText = XLSX.utils.sheet_to_csv(firstSheet);
  return parseQuestionCsvText(csvText);
}

function parseJsonText(text: string): ParsedQuestionRow[] {
  const data = JSON.parse(text);
  if (!Array.isArray(data)) return [];
  const cols = [
    'Question Title', 'Question Type', 'Skill', 'Tags', 'Difficulty Level', 'Question Text',
    'Visuals/Additional Information', 'Answer Choice 1', 'Answer Choice 2', 'Answer Choice 3',
    'Answer Choice 4', 'Answer Choice 5', 'Correct answer', 'Answer Description', 'Positive marks',
  ];
  return data
    .map((obj: Record<string, unknown>) => rowToQuestion(cols.map(c => String(obj[c] ?? ''))))
    .filter((r): r is ParsedQuestionRow => r !== null);
}

export function parseQuestionFile(file: File): Promise<ParsedQuestionRow[]> {
  return new Promise((resolve, reject) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const reader = new FileReader();

    if (ext === 'xlsx' || ext === 'xls') {
      reader.onload = async (e) => {
        try {
          resolve(await parseXlsxBuffer(e.target!.result as ArrayBuffer));
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    } else if (ext === 'json') {
      reader.onload = (e) => {
        try {
          resolve(parseJsonText(e.target!.result as string));
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    } else {
      reader.onload = (e) => {
        try {
          resolve(parseQuestionCsvText(e.target!.result as string));
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    }
  });
}
