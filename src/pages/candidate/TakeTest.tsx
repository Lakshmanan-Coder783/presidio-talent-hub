import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  ArrowRight, KeyRound, Mail, Loader2, AlertCircle,
  Clock, Star, Tag, CheckCircle2, WifiHigh, ShieldCheck,
  ListChecks, Timer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { resolveExperienceSettings } from '../../utils/experienceSettings';

const isMobileOrTablet = () => /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const INSTRUCTIONS = [
  { icon: WifiHigh,     text: 'Ensure a stable internet connection before starting.' },
  { icon: ShieldCheck,  text: 'Do not refresh or navigate away during the test.' },
  { icon: ListChecks,   text: 'Each question must be attempted before moving forward.' },
  { icon: Timer,        text: 'The test will auto-submit when the timer expires.' },
];

export const TakeTest: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? undefined;
  const { db, currentUser, loginCandidateByTestSlug, ensureLoaded } = useApp();

  useEffect(() => { ensureLoaded(['candidates', 'assessments', 'drives']); }, [ensureLoaded]);

  const assessment = useMemo(
    () => db.assessments.find(a => a.slug === slug),
    [db, slug]
  );

  const drive = useMemo(
    () => assessment ? db.drives.find(d => d.assessmentId === assessment.id) : undefined,
    [db.drives, assessment]
  );

  const exp = useMemo(() => resolveExperienceSettings(drive), [drive]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (currentUser?.role === 'candidate') {
      navigate('/portal', { replace: true });
    } else if (currentUser?.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  if (!assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted/60 to-background p-6">
        <div className="w-full max-w-[400px] rounded-2xl border bg-card shadow-2xl p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertCircle className="h-7 w-7 text-destructive" />
          </div>
          <h2 className="text-xl font-bold">Test Not Found</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The test link <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/take/{slug}</code> does not exist
            or has been removed. Please check the URL with your exam coordinator.
          </p>
        </div>
      </div>
    );
  }

  if (assessment.status !== 'Active') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted/60 to-background p-6">
        <div className="w-full max-w-[400px] rounded-2xl border bg-card shadow-2xl p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
            <AlertCircle className="h-7 w-7 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold">{assessment.name}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            This test is not currently active{' '}
            <Badge variant="outline" className="text-xs">{assessment.status}</Badge>.{' '}
            Please contact your exam coordinator.
          </p>
        </div>
      </div>
    );
  }

  if (exp.allowedDevices === 'computers' && isMobileOrTablet()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted/60 to-background p-6">
        <div className="w-full max-w-[400px] rounded-2xl border bg-card shadow-2xl p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
            <AlertCircle className="h-7 w-7 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold">Computer Required</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            <b className="text-foreground">{assessment.name}</b> must be taken on a desktop or laptop computer.
            Please switch devices and reopen this link to continue.
          </p>
        </div>
      </div>
    );
  }

  // A magic-link token in the URL means the candidate can log in with email
  // alone; otherwise the shared test password is required alongside email.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your registered email.');
      return;
    }
    if (!token && !password.trim()) {
      setErrorMsg('Please enter the test password.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setTimeout(() => {
      const normalizedEmail = email.trim().toLowerCase();
      const candidate = db.candidates.find(
        c => c.email.trim().toLowerCase() === normalizedEmail && c.assessmentId === assessment.id
      );
      if (!candidate) {
        setLoading(false);
        setErrorMsg('Invalid email or you are not registered for this test.');
        return;
      }
      if (candidate.assessmentStatus === 'Completed') {
        setLoading(false);
        setErrorMsg('Assessment already completed.');
        return;
      }
      const passwordless = candidate.accessMode === 'remote' && !!token && candidate.inviteToken === token;
      const res = loginCandidateByTestSlug(slug!, email.trim(), passwordless ? '' : password.trim(), token);
      setLoading(false);
      if (!res.success) setErrorMsg(res.message);
    }, 900);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* ── Left Panel: Branding & Test Info ── */}
      <div className="md:w-[55%] bg-primary text-primary-foreground flex flex-col">
        {/* Header */}
        <div className="p-6 flex items-center gap-3 border-b border-primary-foreground/10">
          <div className="w-9 h-9 rounded-lg bg-primary-foreground/15 flex items-center justify-center font-black text-lg">
            P
          </div>
          <span className="font-semibold text-sm tracking-wide opacity-90">Presidio Talent Hub</span>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col justify-center px-8 py-10 md:px-12 space-y-8">
          {/* Test identity */}
          <div className="space-y-3">
            <span className="text-xs font-semibold tracking-widest uppercase opacity-60">
              Assessment Portal
            </span>
            <h1 className="text-3xl font-black leading-tight">{assessment.name}</h1>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="flex items-center gap-1.5 text-xs font-medium bg-primary-foreground/10 rounded-full px-3 py-1">
                <Clock className="h-3.5 w-3.5 opacity-70" />
                {assessment.duration} min
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium bg-primary-foreground/10 rounded-full px-3 py-1">
                <Star className="h-3.5 w-3.5 opacity-70" />
                {assessment.totalMarks} marks
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium bg-primary-foreground/10 rounded-full px-3 py-1">
                <Tag className="h-3.5 w-3.5 opacity-70" />
                {assessment.type}
              </span>
            </div>
          </div>

          {/* Sections */}
          {assessment.sections && assessment.sections.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest opacity-60">
                Sections
              </p>
              <div className="space-y-2">
                {assessment.sections.map((sec) => (
                  <div
                    key={sec.name}
                    className="flex items-center justify-between rounded-lg bg-primary-foreground/8 px-4 py-2.5 text-sm"
                  >
                    <span className="font-medium">{sec.name}</span>
                    <span className="opacity-70 text-xs">
                      {sec.questionCount} Q · {sec.marks} marks
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator className="bg-primary-foreground/15" />

          {/* Instructions */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest opacity-60">
              Instructions
            </p>
            <ul className="space-y-2.5">
              {INSTRUCTIONS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3 text-sm opacity-85">
                  <Icon className="h-4 w-4 shrink-0 mt-0.5 opacity-70" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-primary-foreground/10 text-xs opacity-50 text-center">
          Powered by Presidio Talent Hub &copy; {new Date().getFullYear()}
        </div>
      </div>

      {/* ── Right Panel: Auth Form ── */}
      <div className="md:w-[45%] flex items-center justify-center bg-background p-8 md:p-12">
        <div className="w-full max-w-[380px] space-y-8">
          {/* Heading */}
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight">Sign in to begin</h2>
            <p className="text-sm text-muted-foreground">
              {token
                ? 'Enter the email address you were registered with.'
                : 'Enter your registered email and test password to begin.'}
            </p>
          </div>

          {/* Form */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-9 w-9 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-medium">Validating credentials…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <Alert variant="destructive">
                  <AlertDescription className="text-xs font-semibold">{errorMsg}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="candidate-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="candidate-email"
                    type="email"
                    placeholder="you@college.edu.in"
                    className="pl-9 h-10"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              {!token && (
                <div className="space-y-1.5">
                  <Label htmlFor="test-password">Test Password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="test-password"
                      type="password"
                      placeholder="Shared test password"
                      className="pl-9 h-10"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Provided by your exam coordinator in the lab.
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full h-10 gap-2 font-semibold">
                {token ? 'Continue' : 'Enter Assessment'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          )}

          {/* Help note */}
          <p className="text-xs text-muted-foreground text-center">
            Having trouble?{' '}
            <span className="font-medium text-foreground">Contact your exam coordinator</span>{' '}
            for assistance.
          </p>

          {/* Checkmarks */}
          <div className="flex flex-col gap-1.5 pt-2">
            {['Proctored assessment environment', 'Secure & encrypted submission', 'Instant results after review'].map(item => (
              <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
