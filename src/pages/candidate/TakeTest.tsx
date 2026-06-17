import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ArrowRight, KeyRound, UserCheck, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const TakeTest: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { db, currentUser, loginCandidateByTestSlug } = useApp();

  const assessment = useMemo(
    () => db.assessments.find(a => a.slug === slug),
    [db, slug]
  );

  const [candidateId, setCandidateId] = useState('');
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
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
        <Card className="w-full max-w-[420px] shadow-xl text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold">Test Not Found</h2>
            <p className="text-muted-foreground text-sm">
              The test link <strong>/take/{slug}</strong> does not exist or has been removed.
              Please check the URL with your exam coordinator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (assessment.status !== 'Active') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
        <Card className="w-full max-w-[420px] shadow-xl text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
            <h2 className="text-xl font-bold">{assessment.name}</h2>
            <p className="text-muted-foreground text-sm">
              This test is not currently active ({assessment.status}).
              Please contact your exam coordinator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateId.trim() || !password.trim()) {
      setErrorMsg('Please enter both your Candidate ID and the test password.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setTimeout(() => {
      const res = loginCandidateByTestSlug(slug!, candidateId.trim(), password.trim());
      setLoading(false);
      if (!res.success) {
        setErrorMsg(res.message);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-[420px] shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl mx-auto mb-3">
            P
          </div>
          <CardTitle className="text-2xl">{assessment.name}</CardTitle>
          <CardDescription>
            {assessment.duration} min &middot; {assessment.totalMarks} marks &middot; {assessment.type}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {errorMsg && (
            <Alert variant="destructive">
              <AlertDescription className="text-xs font-semibold">{errorMsg}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground font-medium">Validating credentials…</p>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="candidate-id">Candidate ID</Label>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="candidate-id"
                    type="text"
                    placeholder="e.g. PRES2026-10025"
                    className="pl-9"
                    value={candidateId}
                    onChange={e => setCandidateId(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="test-password">Test Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="test-password"
                    type="password"
                    placeholder="Shared test password"
                    className="pl-9"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the password shared by your exam coordinator — not your individual password.
                </p>
              </div>

              <Button type="submit" className="w-full gap-2">
                Enter Test
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
