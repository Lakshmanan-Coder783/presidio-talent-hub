import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

export const Login: React.FC = () => {
  const { loginAdmin } = useApp();
  const [email, setEmail] = useState('rajesh.kumar@presidio.com');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      loginAdmin();
    }, 1500);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary-foreground/5 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-primary-foreground/5 blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-foreground mb-6">
            <span className="text-xl font-extrabold text-primary">P</span>
          </div>
          <h1 className="text-5xl font-bold text-primary-foreground mb-2">Presidio</h1>
          <p className="text-primary-foreground/70 text-lg">Talent Management Hub</p>
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center my-8">
          <div className="w-full h-56 rounded-2xl border border-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-3">🏢</div>
              <p className="text-primary-foreground font-semibold">Modern Talent Acquisition</p>
              <p className="text-primary-foreground/60 text-sm mt-1">Streamline your recruitment process</p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-primary-foreground/70 text-sm leading-relaxed mb-4">
            Your complete recruitment management solution for discovering and nurturing top talent.
          </p>
          <div className="flex items-center gap-2 text-primary-foreground/50 text-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/50" />
            Secure · Enterprise · Scalable
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile header */}
          <div className="lg:hidden text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
              <span className="text-xl font-extrabold text-primary">P</span>
            </div>
            <h1 className="text-3xl font-bold">Presidio</h1>
            <p className="text-muted-foreground">Talent Hub</p>
          </div>

          <Card className="shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>Sign in to continue to your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox id="remember" />
                    <span className="text-muted-foreground">Remember me</span>
                  </label>
                  <a href="#" className="text-primary font-medium hover:underline">
                    Forgot password?
                  </a>
                </div>

                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              {/* Demo credentials */}
              <div className="mt-5 rounded-lg border bg-muted/40 p-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                  Demo Credentials
                </p>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    <span>
                      <strong>Email:</strong>{' '}
                      <span className="text-muted-foreground">rajesh.kumar@presidio.com</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-primary" />
                    <span>
                      <strong>Password:</strong>{' '}
                      <span className="text-muted-foreground">password</span>
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            © 2026 Presidio. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};
