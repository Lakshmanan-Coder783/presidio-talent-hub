import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Mail, Lock, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen bg-white flex">
      {/* Left Section - Branding & Building Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl"></div>
          <div className="absolute -bottom-8 -right-4 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl"></div>
        </div>

        {/* Top Section */}
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-lg mb-6 shadow-lg">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">P</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-3">Presidio</h1>
          <p className="text-blue-100 text-lg">Talent Management Hub</p>
        </div>

        {/* Middle - Building Image Area */}
        <div className="relative z-10 flex-1 flex items-center justify-center my-8">
          <div className="w-full h-64 bg-gradient-to-t from-blue-900/30 to-transparent rounded-2xl border border-blue-400/30 flex items-center justify-center backdrop-blur-sm">
            <div className="text-center">
              <div className="text-6xl mb-3">🏢</div>
              <p className="text-blue-100 font-semibold">Modern Talent Acquisition</p>
              <p className="text-blue-200 text-sm mt-1">Streamline recruitment process</p>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="relative z-10">
          <p className="text-blue-100 text-sm leading-relaxed mb-6">
            Welcome to the Presidio Talent Hub - Your complete recruitment management solution for discovering and nurturing top talent.
          </p>
          <div className="flex items-center gap-2 text-blue-200 text-sm">
            <span className="w-2 h-2 bg-blue-200 rounded-full"></span>
            <p>Secure • Enterprise • Scalable</p>
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-lg mb-4">
              <span className="text-2xl font-bold text-blue-600">P</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Presidio</h1>
            <p className="text-gray-500">Talent Hub</p>
          </div>

          {/* Login Card */}
          <div>
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
              <p className="text-gray-600">Sign in to continue to your account</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500" />
                  <span className="text-gray-600 group-hover:text-gray-900 transition-colors">Remember me</span>
                </label>
                <a href="#" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                  Forgot password?
                </a>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-7 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Demo Credentials Box */}
            <div className="mt-8 p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <p className="text-xs font-bold text-blue-900 mb-3 uppercase tracking-wide">Demo Credentials:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-blue-600" />
                  <p className="text-xs text-gray-700">
                    <span className="font-semibold text-blue-900">Email:</span>
                    <span className="text-gray-600"> rajesh.kumar@presidio.com</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Lock size={14} className="text-blue-600" />
                  <p className="text-xs text-gray-700">
                    <span className="font-semibold text-blue-900">Password:</span>
                    <span className="text-gray-600"> password</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-8">
              <p className="text-xs text-gray-500">© 2026 Presidio. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
