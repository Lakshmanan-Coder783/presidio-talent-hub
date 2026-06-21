import type { CollegeStudent } from '../types';

export type ParsedStudentRow = Omit<CollegeStudent, 'id' | 'college' | 'importedAt'>;

/**
 * Parses a CSV string into ParsedStudentRow[].
 * Expected column order (matches existing TestDetail.tsx CSV format):
 * S.No, RegNum, Name, Email, Phone, Degree, Specialization, Gender, DOB,
 * GitHub, LinkedIn, Resume, CodingPlatforms, 10th, 12th, Diploma, UG%, PG%,
 * BacklogHistory, CurrentBacklogs
 */
export function parseCsvText(text: string): ParsedStudentRow[] {
  const lines = text.split('\n').filter(l => l.trim());
  const firstCell = lines[0]?.split(',')[0]?.trim();
  const dataLines = isNaN(Number(firstCell)) ? lines.slice(1) : lines;

  const rows: ParsedStudentRow[] = [];
  for (const line of dataLines) {
    const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    if (cols.length < 4) continue;

    const [
      , regNum, name, email, phone, degree, specialization, gender, dateOfBirth,
      githubUrl, linkedinUrl, resumeUrl, codingPlatformUrls,
      tenthStr, twelfthStr, diplomaStr, ugStr, pgStr, backlogHistStr, currentBacklogStr,
    ] = cols;

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
