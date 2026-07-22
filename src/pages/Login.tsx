import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { HelpCircle, Shield, Users, Lock, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import buildingImg from '../assets/presidio-building.png';

const MicrosoftLogo = () => (
  <svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <rect x="1" y="1" width="9" height="9" fill="#F25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
    <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
    <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
  </svg>
);


export const Login: React.FC = () => {
  const { loginAdmin, db } = useApp();
  const [loading, setLoading] = useState(false);
  const defaultUserId = db.users.find(u => u.isSuperAdmin)?.id ?? db.users[0]?.id;
  const [selectedUserId, setSelectedUserId] = useState(defaultUserId);

  const handleMicrosoftLogin = () => {
    if (!selectedUserId) return;
    setLoading(true);
    setTimeout(() => {
      loginAdmin(selectedUserId);
    }, 1200);
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ───────────────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[44%] flex-col relative overflow-hidden"
        style={{ background: 'linear-gradient(175deg, #1535a8 0%, #1030a0 30%, #0a1d70 60%, #06103c 100%)' }}
      >

        <div className="relative z-10 flex flex-col h-full px-10 pt-8 pb-6">
          {/* Brand */}
          <p className="text-white font-black text-lg tracking-[0.2em] uppercase">PRESIDIO</p>

          {/* Hero text */}
          <div className="mt-10">
            <h1 className="text-[3.75rem] font-black text-white leading-[1.05] tracking-tight">
              Talent Hub
            </h1>
            <p className="mt-4 text-[1.1rem] font-medium text-white">
              Assess.{' '}
              <span style={{ color: '#60c6f5' }} className="font-semibold">Evaluate.</span>{' '}
              Hire.
            </p>
            <div className="mt-4 w-10 h-[2px] bg-white/50" />
            <p className="mt-5 text-white/55 text-[0.9rem] leading-relaxed">
              A unified platform for campus hiring,<br />
              assessments, interviews and<br />
              talent management.
            </p>
          </div>

          {/* Building photo — fills remaining height, no gap */}
          <div className="flex-1 -mx-10 relative overflow-hidden" style={{ minHeight: '320px' }}>
            {/* Top fade: blends panel background into the building photo sky */}
            <div className="absolute top-0 inset-x-0 h-32 z-10 pointer-events-none"
              style={{ background: 'linear-gradient(to bottom, #1030a0 0%, rgba(16,48,160,0.7) 35%, rgba(16,48,160,0.2) 70%, transparent 100%)' }} />
            <img
              src={buildingImg}
              alt="Presidio headquarters"
              className="w-full h-full object-cover object-top"
              style={{ filter: 'brightness(1.2) saturate(1.5) hue-rotate(-5deg)' }}
            />
          </div>

        </div>
      </div>

      {/* ── Right panel ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-[#f2f3f5]">
        {/* Top bar */}
        <div className="flex items-center justify-end gap-2 px-8 pt-5">
          <button className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
            <HelpCircle className="h-4 w-4" />
          </button>
          <button className="flex items-center gap-1.5 text-sm text-gray-600 bg-white border border-gray-200 shadow-sm rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
            EN <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          </button>
        </div>

        {/* Centered card */}
        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="w-full max-w-md bg-white shadow-sm border border-gray-200 rounded-2xl">
            <CardHeader className="pb-2 pt-7 px-8">
              <CardTitle className="text-2xl font-bold text-gray-900">Admin Login</CardTitle>
              <CardDescription className="text-gray-500 mt-1">
                Sign in with Microsoft Entra ID to access Presidio Talent Hub
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-8 pt-5 space-y-5">
              {/* Demo persona picker — stands in for the real Entra directory lookup */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">Sign in as</label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="w-full h-11 rounded-xl">
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {db.users.map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} {u.isSuperAdmin ? '(Super Admin)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Microsoft button */}
              <Button
                variant="outline"
                className="w-full h-12 text-[15px] font-medium border-gray-300 bg-white hover:bg-gray-50 gap-3 rounded-xl shadow-sm"
                onClick={handleMicrosoftLogin}
                disabled={loading}
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <MicrosoftLogo />
                )}
                {loading ? 'Signing in…' : 'Sign in with Microsoft'}
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 whitespace-nowrap tracking-wide">Secure SSO Login</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Features */}
              <div className="space-y-4 pt-1">
                {[
                  {
                    icon: Shield,
                    title: 'Secure Authentication',
                    desc: 'Enterprise-grade security with Microsoft Entra ID',
                  },
                  {
                    icon: Users,
                    title: 'Unified Access',
                    desc: 'Access all recruitment and assessment features',
                  },
                  {
                    icon: Lock,
                    title: 'Data Protection',
                    desc: 'Your data is protected and encrypted',
                  },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm leading-tight">{title}</p>
                      <p className="text-gray-500 text-sm mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
