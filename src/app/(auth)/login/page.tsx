'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { 
  Lock, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  User, 
  BarChart, 
  Package, 
  ShieldCheck, 
  Users
} from 'lucide-react';
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
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      
      {/* LEFT PANE - Information & Graphics (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-gradient-to-br from-[#f8fbff] to-[#eef5ff] dark:from-slate-900 dark:to-slate-950 relative overflow-hidden p-12 xl:p-16">
        
        {/* Background decorative circles with animation */}
        <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 w-[800px] h-[800px] rounded-full border-[40px] border-blue-50/50 dark:border-blue-900/10 pointer-events-none animate-[pulse_6s_ease-in-out_infinite]" />
        <div className="absolute top-10 right-10 w-[600px] h-[600px] rounded-full border-[20px] border-blue-50/30 dark:border-blue-900/5 pointer-events-none animate-[pulse_8s_ease-in-out_200ms_infinite]" />
        
        {/* Additional animated floating orb */}
        <div className="absolute bottom-20 left-10 w-64 h-64 bg-blue-400/20 dark:bg-blue-600/10 blur-3xl rounded-full pointer-events-none animate-[pulse_10s_ease-in-out_infinite]" />

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
              <img src="/tripidio-logo.png" alt="Logo" className="h-6 w-6 object-contain invert brightness-0" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Tripidio <span className="text-blue-600">ERP</span>
            </h1>
          </div>

          {/* Headline */}
          <h2 className="text-4xl xl:text-5xl font-extrabold text-slate-900 dark:text-white leading-[1.1] mb-4 tracking-tight">
            Manage. Optimize.<br />Grow Your Business.
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg mb-12 max-w-md">
            A complete ERP solution to streamline operations and drive efficiency.
          </p>

          {/* Features */}
          <div className="space-y-6 max-w-md">
            {[
              { icon: BarChart, title: 'Unified Dashboard', desc: 'Get real-time insights and KPIs across your business.', bg: 'bg-blue-100 dark:bg-blue-900/30', color: 'text-blue-600 dark:text-blue-400' },
              { icon: Package, title: 'Smart Operations', desc: 'Automate workflows and manage processes with ease.', bg: 'bg-indigo-100 dark:bg-indigo-900/30', color: 'text-indigo-600 dark:text-indigo-400' },
              { icon: ShieldCheck, title: 'Secure & Reliable', desc: 'Enterprise-grade security to keep your data safe.', bg: 'bg-sky-100 dark:bg-sky-900/30', color: 'text-sky-600 dark:text-sky-400' },
              { icon: Users, title: 'Role Based Access', desc: 'Control access and permissions for your team.', bg: 'bg-blue-100 dark:bg-blue-900/30', color: 'text-blue-600 dark:text-blue-400' },
            ].map((f, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${f.bg} ${f.color}`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{f.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-snug mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating Graphic & Footer */}
        <div className="relative z-10 mt-12 flex flex-col justify-end flex-1">
          <div className="absolute right-0 bottom-10 w-96 opacity-90 mix-blend-multiply dark:mix-blend-screen pointer-events-none transform translate-x-12 translate-y-12">
            <img src="/dashboard-3d.png" alt="3D Dashboard" className="w-full h-auto drop-shadow-2xl" />
          </div>
          
          <div className="flex items-center gap-2 mt-auto text-xs font-semibold text-slate-500 dark:text-slate-400">
            <ShieldCheck className="h-4 w-4" />
            <p>Your data is <span className="text-blue-600 dark:text-blue-400 font-bold">100%</span> secure with us</p>
          </div>
        </div>
      </div>

      {/* RIGHT PANE - Login Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-4 sm:p-8 xl:p-16 relative">
        {/* Mobile Logo (only visible on small screens) */}
        <div className="absolute top-8 left-8 lg:hidden flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-md">
            <img src="/tripidio-logo.png" alt="Logo" className="h-4 w-4 object-contain invert brightness-0" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            Tripidio <span className="text-blue-600">ERP</span>
          </h1>
        </div>

        <div className="w-full max-w-[440px] rounded-[2rem] bg-white p-8 sm:p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] dark:bg-slate-900 dark:border dark:border-slate-800">
          
          <div className="flex flex-col items-center text-center mb-10">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
                <img src="/tripidio-logo.png" alt="Logo" className="h-7 w-7 object-contain invert brightness-0" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Welcome back!</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Sign in to your Tripidio ERP account.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Email or Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm font-medium text-slate-900 transition-all hover:border-slate-300 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-600/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:bg-slate-950 dark:focus:border-blue-500 dark:focus:ring-blue-600/20"
                  placeholder="Enter your email or username"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-12 text-sm font-medium text-slate-900 transition-all hover:border-slate-300 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-600/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:bg-slate-950 dark:focus:border-blue-500 dark:focus:ring-blue-600/20"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="flex justify-end mt-2">
                <a href="#" className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
                  Forgot password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-blue-600/40 active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign in to Dashboard'}
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
            <span className="text-xs font-medium text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
          </div>

          <button
            type="button"
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/50"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="h-5 w-5" alt="Google" />
            Sign in with Google
          </button>

          <p className="mt-10 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <a href="#" className="font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400">
              Contact your administrator
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
