'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Lock, ArrowRight, Eye, EyeOff, Mail, BarChart2, Zap, Users, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Welcome to Tripidio ERP!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#060b14] text-white overflow-hidden relative selection:bg-blue-500/30 font-sans">
      {/* Background Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-[radial-gradient(circle,rgba(37,99,235,0.15)_0%,rgba(6,11,20,0)_70%)] rounded-full z-0 pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-[radial-gradient(circle,rgba(99,102,241,0.1)_0%,rgba(6,11,20,0)_70%)] rounded-full z-0 pointer-events-none" />

      {/* Left Promotional Panel (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 p-16 flex-col relative z-10">
        <div className="flex items-center gap-4 mb-16">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center font-bold text-xl shadow-[0_4px_15px_rgba(37,99,235,0.4)]">T</div>
          <div>
            <h1 className="text-xl font-semibold">Tripidio <span className="text-blue-500">ERP</span></h1>
            <p className="text-xs text-slate-400">Smart. Simple. Powerful.</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <p className="text-xs tracking-widest uppercase text-slate-400 mb-4">BUSINESS OPERATIONS, SIMPLIFIED</p>
          <h2 className="text-6xl font-bold leading-[1.1] mb-6">Manage.<br/>Track. <span className="text-blue-500">Grow.</span></h2>
          <p className="text-slate-400 text-lg leading-relaxed max-w-md mb-12">
            Tripidio ERP helps you streamline your business with powerful tools, real-time insights and a smoother workflow.
          </p>

          <ul className="space-y-6">
            <li className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600/10 text-blue-500 rounded-lg flex items-center justify-center">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-[15px]">All-in-One Platform</h3>
                <p className="text-sm text-slate-400">Sales, Inventory, Purchases &amp; more</p>
              </div>
            </li>
            <li className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600/10 text-blue-500 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-[15px]">Real-time Insights</h3>
                <p className="text-sm text-slate-400">Make faster, smarter decisions</p>
              </div>
            </li>
            <li className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600/10 text-blue-500 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-[15px]">Built for Teams</h3>
                <p className="text-sm text-slate-400">Collaborate and stay in sync</p>
              </div>
            </li>
            <li className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600/10 text-blue-500 rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-[15px]">Secure &amp; Reliable</h3>
                <p className="text-sm text-slate-400">Your data, always protected</p>
              </div>
            </li>
          </ul>
        </div>
        
        {/* Subtle decorative text */}
        <div className="absolute bottom-16 left-16">
          <p className="text-2xl font-light text-slate-500/30 transform -rotate-6" style={{ fontFamily: 'cursive' }}>Built for a Smarter Tomorrow</p>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="w-full lg:w-1/2 p-6 sm:p-12 flex flex-col items-center relative z-10">
        <div className="w-full flex justify-end items-center gap-4 mb-8 sm:mb-16">
          <span className="text-sm text-slate-400">New here?</span>
          <a href="#" className="px-4 py-2 border border-white/10 rounded-full text-sm flex items-center gap-2 hover:bg-white/5 transition-colors">
            Contact us <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <div className="w-full max-w-[480px] bg-[#0f1624]/70 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl mt-auto mb-auto">
          <p className="text-xs tracking-widest text-slate-400 uppercase mb-2">WELCOME BACK</p>
          <h2 className="text-3xl font-semibold mb-2">Sign in to <span className="text-blue-500">Tripidio ERP</span></h2>
          <p className="text-slate-400 text-sm mb-8">Continue to your account and keep things moving.</p>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Email or Username</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-4 w-5 h-5 text-slate-500" />
                <input 
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/25 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
                  placeholder="Enter your email or username"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">Password</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 w-5 h-5 text-slate-500" />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/25 border border-white/10 rounded-xl py-3.5 pl-12 pr-12 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
                  placeholder="Enter your password"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 p-1 hover:bg-white/5 rounded-md transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5 text-slate-400" /> : <Eye className="w-5 h-5 text-slate-400" />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-black/25 accent-blue-500" defaultChecked />
                <span className="text-sm text-slate-300">Keep me signed in</span>
              </label>
              <a href="#" className="text-sm text-blue-500 hover:underline">Forgot password?</a>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:opacity-90 transition-opacity flex justify-center items-center gap-2 mt-4 disabled:opacity-70"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              ) : (
                <>Sign in to Dashboard <ArrowRight className="w-5 h-5" /></>
              )}
            </button>

            <div className="flex items-center gap-4 my-6 text-slate-500 text-xs">
              <div className="flex-1 h-px bg-white/10" />
              <span>OR</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <button type="button" className="w-full py-3.5 rounded-xl bg-transparent border border-white/10 hover:bg-white/5 transition-colors flex items-center justify-center gap-3 text-sm font-medium">
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-slate-400">
            Don't have an account? <a href="#" className="text-blue-500 hover:underline">Contact your administrator</a>
          </p>
        </div>
        
        <div className="mt-auto pt-8 text-[10px] tracking-[0.2em] text-slate-500 uppercase">
          TRIPIDIO ERP • POWERING BUSINESSES
        </div>
      </div>
    </div>
  );
}
