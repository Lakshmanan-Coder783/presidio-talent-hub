import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ArrowRight, KeyRound, UserCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const CandidateLogin: React.FC = () => {
  const { loginCandidate } = useApp();
  const [candidateId, setCandidateId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateId.trim() || !password.trim()) {
      setErrorMsg('Please enter both Candidate ID and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    setTimeout(() => {
      const res = loginCandidate(candidateId.trim(), password.trim());
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
          <CardTitle className="text-2xl">Assessment Portal</CardTitle>
          <CardDescription>Enter your student credentials to start your exam</CardDescription>
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
              <p className="text-xs text-muted-foreground font-medium">Validating credentials...</p>
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
                <Label htmlFor="assessment-password">Assessment Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="assessment-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full gap-2">
                Start Assessment Portal
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          )}

          <div className="text-center pt-2">
            <Link to="/" className="text-xs font-semibold text-primary hover:underline">
              Go back to Admin Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
