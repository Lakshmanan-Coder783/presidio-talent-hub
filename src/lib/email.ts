import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined;

export function isEmailConfigured(): boolean {
  return !!SERVICE_ID && !!TEMPLATE_ID && !!PUBLIC_KEY;
}

interface InviteEmailParams {
  toEmail: string;
  toName: string;
  driveName: string;
  testLink: string;
}

// Template should expose {{to_email}}, {{to_name}}, {{drive_name}}, {{test_link}}.
export async function sendInviteEmail({ toEmail, toName, driveName, testLink }: InviteEmailParams): Promise<void> {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    throw new Error('EmailJS is not configured. Set VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID and VITE_EMAILJS_PUBLIC_KEY.');
  }
  await emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    { to_email: toEmail, to_name: toName, drive_name: driveName, test_link: testLink },
    { publicKey: PUBLIC_KEY }
  );
}
