import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, Users, Lock, HelpCircle, Loader2 } from 'lucide-react';
import presidioHq from '../assets/presidio_hq.png';

export const Login: React.FC = () => {
  const { loginAdmin } = useApp();
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [languageOpen, setLanguageOpen] = useState(false);

  const handleAdminSSO = async () => {
    setLoading(true);
    setLoadingStep('Redirecting to Microsoft Entra ID...');
    
    setTimeout(() => {
      setLoadingStep('Verifying corporate SSO credentials...');
      setTimeout(() => {
        setLoadingStep('Authorizing user access and loading roles...');
        loginAdmin().then(() => {
          setLoading(false);
        });
      }, 1000);
    }, 1000);
  };

  return (
    <div className="w-screen h-screen flex overflow-hidden font-sans bg-[#F8FAFC] select-none">
      {/* LEFT PANEL: 50% width, full height */}
      <div className="relative w-1/2 h-full flex flex-col justify-between pl-16 pr-16 pt-12 pb-12 text-white bg-gradient-to-b from-[#002B7F] via-[#003DA5] to-[#2563EB] overflow-hidden">
        {/* Subtle decorative glow layer */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_50%)] z-0 pointer-events-none"></div>
        
        {/* Top Left Branding */}
        <div className="z-10">
          <span className="text-[32px] font-bold tracking-tight text-white uppercase leading-none block">
            PRESIDIO
          </span>
        </div>

        {/* Hero Copy (Middle) */}
        <div className="z-10 my-auto space-y-4 max-w-lg">
          <h1 className="text-[56px] font-bold tracking-tight leading-none text-white">
            Talent Hub
          </h1>
          <p className="text-[20px] font-medium text-white">
            Assess. <span className="text-[#60A5FA]">Evaluate.</span> Hire.
          </p>
          <div className="w-12 h-[2px] bg-white/40"></div>
          <p className="text-[16px] leading-relaxed text-white/90 max-w-[420px]">
            A unified platform for campus hiring, assessments, interviews and talent management.
          </p>
        </div>

        {/* Office Building Image: Bottom, centered, fully contained */}
        <div className="z-10 flex flex-col items-center w-full mt-auto overflow-hidden">
          <img 
            src={presidioHq} 
            alt="Presidio Corporate HQ" 
            className="w-[85%] h-auto max-h-[35vh] object-contain object-bottom rounded-t-xl opacity-95"
          />
        </div>

        {/* Bottom Left Copyright Footer */}
        <div className="absolute left-16 bottom-12 z-20 text-[14px] text-white/80">
          © 2026 Presidio. All rights reserved.
        </div>
      </div>

      {/* RIGHT PANEL: 50% width, full height */}
      <div className="relative w-1/2 h-full flex items-center justify-center p-8 bg-[#F8FAFC] overflow-hidden">
        
        {/* Top Right Corner Controls */}
        <div className="absolute top-10 right-16 flex items-center gap-5 text-slate-500 z-10">
          {/* Help Button */}
          <button className="p-1.5 hover:bg-slate-100 rounded-full transition-colors cursor-pointer" title="Get Help">
            <HelpCircle size={24} className="text-slate-400 hover:text-slate-600" />
          </button>
          
          {/* Language Selector Dropdown */}
          <div className="relative">
            <button 
              className="flex items-center gap-2 px-3.5 py-2 border border-slate-200 rounded-lg bg-white text-sm font-semibold hover:bg-slate-50 transition-all cursor-pointer shadow-sm text-slate-700"
              onClick={() => setLanguageOpen(!languageOpen)}
            >
              EN
              <span className="text-[10px] text-slate-400">▼</span>
            </button>
            {languageOpen && (
              <div className="absolute right-0 mt-1.5 w-28 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 text-sm">
                <div className="px-4 py-2 hover:bg-slate-50 cursor-pointer font-medium text-slate-800">English</div>
                <div className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-slate-500">Español</div>
                <div className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-slate-500">Français</div>
              </div>
            )}
          </div>
        </div>

        {/* SSO Centered White Card (width: 620px, height: auto, padding: 48px) */}
        <div className="w-[620px] max-w-[90%] bg-white rounded-[20px] border border-slate-200/80 shadow-2xl p-12 flex flex-col gap-6">
          {loading ? (
            /* Loader state when SSO process is active */
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <Loader2 size={44} className="animate-spin text-[#2563EB]" />
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900">Microsoft Entra ID Login</h3>
                <p className="text-xs text-slate-500">{loadingStep}</p>
              </div>
            </div>
          ) : (
            /* Card Content - Left-Aligned */
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-[48px] font-bold text-[#111827] tracking-tight leading-none mb-4">
                  Admin Login
                </h2>
                <p className="text-[#6B7280] text-[18px] leading-normal">
                  Sign in with Microsoft Entra ID to access Presidio Talent Hub
                </p>
              </div>

              {/* Microsoft Login Button */}
              <div>
                <button
                  onClick={handleAdminSSO}
                  className="w-full h-[64px] flex items-center justify-center gap-3.5 border border-[#E5E7EB] rounded-xl bg-white hover:bg-slate-50 transition-all text-[#111827] font-semibold text-[18px] shadow-sm active:scale-[0.99] cursor-pointer"
                >
                  {/* Microsoft Quadrants Logo */}
                  <svg width="22" height="22" viewBox="0 0 23 23" className="flex-shrink-0">
                    <rect x="1" y="1" width="10" height="10" fill="#f25022" />
                    <rect x="12" y="1" width="10" height="10" fill="#7fba00" />
                    <rect x="1" y="12" width="10" height="10" fill="#00a4ef" />
                    <rect x="12" y="12" width="10" height="10" fill="#ffb900" />
                  </svg>
                  Sign in with Microsoft
                </button>
              </div>

              {/* Custom Badge Divider */}
              <div className="relative flex items-center justify-center my-1">
                <div className="absolute inset-x-0 h-[1px] bg-slate-200/60"></div>
                <span className="relative z-10 px-4 py-1.5 bg-[#F8FAFC] border border-slate-200/60 rounded-full text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                  Secure SSO Login
                </span>
              </div>

              {/* Security Features List */}
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-50 text-[#2563EB] rounded-lg border border-blue-100/30 flex-shrink-0">
                    <Shield size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#111827]">Secure Authentication</h4>
                    <p className="text-[13px] text-[#6B7280] mt-0.5">
                      Enterprise-grade security with Microsoft Entra ID
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-50 text-[#2563EB] rounded-lg border border-blue-100/30 flex-shrink-0">
                    <Users size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#111827]">Unified Access</h4>
                    <p className="text-[13px] text-[#6B7280] mt-0.5">
                      Access all recruitment and assessment features
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-50 text-[#2563EB] rounded-lg border border-blue-100/30 flex-shrink-0">
                    <Lock size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#111827]">Data Protection</h4>
                    <p className="text-[13px] text-[#6B7280] mt-0.5">
                      Your data is protected and encrypted
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
