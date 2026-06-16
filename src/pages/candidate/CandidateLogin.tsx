import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowRight, KeyRound, UserCheck, Loader2 } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6 font-sans">
      <div className="w-full max-w-[440px] bg-white rounded-2xl border border-slate-200/80 shadow-xl p-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 font-bold text-xl font-display">
            P
          </div>
          <h2 className="text-2xl font-bold font-display text-slate-900">Assessment Portal</h2>
          <p className="text-slate-500 text-xs mt-1">Enter your student credentials to start your exam</p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <span className="text-xs text-slate-500 font-medium">Validating credentials...</span>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Candidate ID</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. PRES2026-10025"
                  className="w-full px-3 py-2.5 pl-10 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                  value={candidateId}
                  onChange={e => setCandidateId(e.target.value)}
                />
                <UserCheck size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Assessment Password</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 pl-10 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-all shadow-md active:scale-[0.99] cursor-pointer"
            >
              Start Assessment Portal
              <ArrowRight size={16} />
            </button>
          </form>
        )}
        
        <div className="mt-6 text-center">
          <a href="#" className="text-xs font-semibold text-blue-600 hover:underline">
            Go back to Admin Login
          </a>
        </div>
      </div>
    </div>
  );
};
