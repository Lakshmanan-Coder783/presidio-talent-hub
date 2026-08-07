import type { CollegeStudent } from '../types';

export type ParsedStudentRow = Omit<CollegeStudent, 'id' | 'college' | 'importedAt'> & {
  // Optional 21st column, "Online Assessment Batch" — only meaningful for the
  // per-drive candidate import (ignored by the college student pool import,
  // since CollegeStudent has no batch concept). Blank/unrecognized => undefined,
  // which the drive-import flow resolves to Batch 1.
  onlineAssessmentBatch?: 'Batch 1' | 'Batch 2';
};

function normalizeBatch(raw: string | undefined): 'Batch 1' | 'Batch 2' | undefined {
  // Strip everything but letters/digits before matching, so "Batch - 1", "batch_1",
  // "BATCH 1", "b1" etc. all normalize the same way regardless of punctuation/spacing.
  const s = (raw ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (s === '1' || s === 'batch1' || s === 'b1') return 'Batch 1';
  if (s === '2' || s === 'batch2' || s === 'b2') return 'Batch 2';
  return undefined;
}

// Splits one CSV line into cells, respecting double-quoted fields — so a comma
// (or an escaped "" ) inside a quoted cell (e.g. a Specialization like
// "AI, ML & Data Science") doesn't shift every column after it, which a naive
// line.split(',') would do.
function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      cells.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells.map(c => c.trim());
}

/**
 * Parses a CSV string into ParsedStudentRow[].
 * Expected column order (matches existing TestDetail.tsx CSV format):
 * S.No, RegNum, Name, Email, Phone, Degree, Specialization, Gender, DOB,
 * GitHub, LinkedIn, Resume, CodingPlatforms, 10th, 12th, Diploma, UG%, PG%,
 * BacklogHistory, CurrentBacklogs, [Online Assessment / Batch]
 * The last column is optional — files without it parse exactly as before.
 * If a header row is present, that column is located by its header name
 * (case-insensitive, matches "batch" or "online assessment" — both seen in
 * real templates) rather than assumed to be exactly the 21st column — so it's
 * still found if extra/missing columns shifted its position. Its value is
 * matched leniently: "Batch 1", "batch - 1", "Batch_1", "b1", "1" all resolve
 * to Batch 1 (see normalizeBatch).
 */
export function parseCsvText(text: string): ParsedStudentRow[] {
  const lines = text.split('\n').filter(l => l.trim());
  const firstCells = lines[0] ? splitCsvLine(lines[0]) : [];
  const hasHeaderRow = isNaN(Number(firstCells[0]?.trim()));
  const dataLines = hasHeaderRow ? lines.slice(1) : lines;
  // Real-world templates label this column "Online Assessment" as often as
  // "Batch" — match either.
  const batchHeaderIndex = hasHeaderRow
    ? firstCells.findIndex(h => /batch|online\s*assessment/i.test(h))
    : -1;

  const rows: ParsedStudentRow[] = [];
  for (const line of dataLines) {
    const cols = splitCsvLine(line).map(c => c.replace(/^"|"$/g, ''));
    if (cols.length < 4) continue;

    const [
      , regNum, name, email, phone, degree, specialization, gender, dateOfBirth,
      githubUrl, linkedinUrl, resumeUrl, codingPlatformUrls,
      tenthStr, twelfthStr, diplomaStr, ugStr, pgStr, backlogHistStr, currentBacklogStr,
      batchStrByPosition,
    ] = cols;
    const batchStr = batchHeaderIndex >= 0 ? cols[batchHeaderIndex] : batchStrByPosition;

    if (!name && !email) continue;

    const genderNorm: 'Male' | 'Female' | 'Other' =
      gender === 'Female' ? 'Female' : gender === 'Other' ? 'Other' : 'Male';

    rows.push({
      name: name || '',
      email: email || '',
      phone: phone || '',
      degree: degree || '',
      cgpa: parseFloat(ugStr) || 0,
      gender: genderNorm,
      registrationNumber: regNum || undefined,
      specialization: specialization || undefined,
      dateOfBirth: dateOfBirth || undefined,
      githubUrl: githubUrl || undefined,
      linkedinUrl: linkedinUrl || undefined,
      resumeUrl: resumeUrl || undefined,
      codingPlatformUrls: codingPlatformUrls || undefined,
      tenth: parseFloat(tenthStr) || undefined,
      twelfth: parseFloat(twelfthStr) || undefined,
      diploma: parseFloat(diplomaStr) || undefined,
      ugMarks: parseFloat(ugStr) || undefined,
      pgMarks: parseFloat(pgStr) || undefined,
      backlogHistory: parseInt(backlogHistStr) || undefined,
      currentBacklogs: parseInt(currentBacklogStr) || undefined,
      onlineAssessmentBatch: normalizeBatch(batchStr),
    });
  }
  return rows;
}

async function parseXlsxBuffer(buffer: ArrayBuffer): Promise<ParsedStudentRow[]> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const csvText = XLSX.utils.sheet_to_csv(firstSheet);
  return parseCsvText(csvText);
}

export function parseStudentFile(file: File): Promise<ParsedStudentRow[]> {
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
    } else {
      reader.onload = (e) => {
        try {
          resolve(parseCsvText(e.target!.result as string));
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    }
  });
}
