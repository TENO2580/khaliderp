'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Lock, ArrowRight, Eye, EyeOff, User, Moon } from 'lucide-react';
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
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-start bg-[#050814] overflow-hidden relative selection:bg-blue-500/30">
      {/* Background Starry Night & Glows */}
      <div className="absolute inset-0 z-0">
         {/* Tiny stars */}
         <div className="absolute top-[15%] left-[20%] w-1 h-1 bg-white/60 rounded-full shadow-[0_0_5px_white]" />
         <div className="absolute top-[35%] right-[15%] w-0.5 h-0.5 bg-white/80 rounded-full shadow-[0_0_5px_white]" />
         <div className="absolute top-[10%] right-[30%] w-1.5 h-1.5 bg-blue-300/60 rounded-full shadow-[0_0_8px_white]" />
         <div className="absolute bottom-[25%] left-[10%] w-0.5 h-0.5 bg-white/50 rounded-full shadow-[0_0_3px_white]" />
         <div className="absolute bottom-[40%] right-[20%] w-1 h-1 bg-indigo-300/60 rounded-full shadow-[0_0_6px_white]" />
         
         {/* Glowing auras */}
         <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[90%] max-w-lg aspect-square rounded-full bg-blue-600/15 blur-[100px]" />
         <div className="absolute top-[15%] -left-[20%] w-[60%] aspect-square rounded-full bg-indigo-600/10 blur-[120px]" />
         <div className="absolute top-[30%] -right-[20%] w-[50%] aspect-square rounded-full bg-sky-600/10 blur-[120px]" />
         
         {/* Faint grid or arc lines */}
         <div className="absolute top-[25%] left-[-20%] right-[-20%] h-[1px] bg-gradient-to-r from-transparent via-blue-500/10 to-transparent transform rotate-12" />
         <div className="absolute top-[35%] left-[-20%] right-[-20%] h-[1px] bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent transform -rotate-[8deg]" />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-[480px] px-6 pt-16 pb-8 h-full min-h-[100dvh] justify-center">
        {/* Dark mode toggle - Top right */}
        <div className="absolute top-6 right-6">
          <button className="p-2.5 rounded-full bg-white/5 border border-white/10 text-slate-300 backdrop-blur-md hover:bg-white/10 transition-colors">
            <Moon className="w-5 h-5" />
          </button>
        </div>

        {/* Logo Area */}
        <div className="flex flex-col items-center mb-10 w-full shrink-0">
          <div className="relative w-40 h-40 flex flex-col items-center justify-center mb-6">
            {/* The 3D Base Rings */}
            <div className="absolute bottom-2 w-32 h-6 rounded-[100%] border-[2px] border-blue-400/40 shadow-[0_0_20px_rgba(59,130,246,0.5)_inset]" />
            <div className="absolute bottom-3 w-40 h-8 rounded-[100%] border-[1px] border-blue-500/20" />
            <div className="absolute bottom-4 w-48 h-10 rounded-[100%] border-[1px] border-indigo-500/10" />
            
            {/* Beam of light */}
            <div className="absolute top-0 w-20 h-40 bg-gradient-to-b from-blue-400/30 via-blue-500/10 to-transparent blur-xl" />

            {/* The floating Hexagon logo */}
            <div className="relative z-10 w-[90px] h-[104px] bg-gradient-to-br from-cyan-300 via-blue-600 to-indigo-900 flex items-center justify-center shadow-[0_0_40px_rgba(37,99,235,0.8)] animate-float" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
              <div className="w-[92%] h-[92%] bg-gradient-to-br from-[#1e40af] to-[#0f172a] flex items-center justify-center" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                <span className="text-[52px] font-black text-white italic drop-shadow-md tracking-tighter pr-2 font-sans leading-none">T</span>
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2 font-sans">
            Tripidio <span className="text-blue-500">ERP</span>
          </h1>
          <p className="text-sm font-medium text-slate-400">Smart. Simple. Powerful.</p>
        </div>

        {/* Login Card */}
        <div className="w-full bg-[#0a0f25]/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden shrink-0">
           {/* Inner top glow */}
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-[2px] bg-gradient-to-r from-transparent via-blue-300/80 to-transparent blur-sm" />
           
           <div className="text-center mb-8 mt-2">
             <h2 className="text-2xl font-bold text-white mb-2">Welcome back!</h2>
             <p className="text-sm text-slate-400">Sign in to continue to your account</p>
           </div>

           <form className="space-y-5" onSubmit={handleSubmit}>
             {/* Email Input Group */}
             <div className="space-y-1.5">
               <label className="text-[13px] font-medium text-slate-300 ml-1">Email or Username</label>
               <div className="flex items-center gap-3">
                 <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                   <User className="w-5 h-5 text-blue-400" />
                 </div>
                 <div className="relative flex-1">
                   <input 
                     type="text"
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     className="w-full bg-[#050814]/80 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-[15px] shadow-inner h-11" 
                     placeholder="Enter your email or username" 
                     required
                   />
                 </div>
               </div>
             </div>

             {/* Password Input Group */}
             <div className="space-y-1.5">
               <label className="text-[13px] font-medium text-slate-300 ml-1">Password</label>
               <div className="flex items-center gap-3">
                 <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                   <Lock className="w-5 h-5 text-blue-400" />
                 </div>
                 <div className="relative flex-1">
                   <input 
                     type={showPassword ? 'text' : 'password'}
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     className="w-full bg-[#050814]/80 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-[15px] shadow-inner h-11" 
                     placeholder="Enter your password" 
                     required
                   />
                   <button 
                     type="button"
                     onClick={() => setShowPassword(!showPassword)}
                     className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/5 rounded-md transition-colors"
                   >
                     {showPassword ? <EyeOff className="w-[18px] h-[18px] text-slate-400" /> : <Eye className="w-[18px] h-[18px] text-slate-400" />}
                   </button>
                 </div>
               </div>
             </div>

             <div className="flex justify-end pt-1">
               <a href="#" className="text-[13px] font-medium text-blue-500 hover:text-blue-400 transition-colors">Forgot password?</a>
             </div>

             <button 
               type="submit" 
               disabled={isLoading}
               className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-[15px] shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
             >
               {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
               ) : (
                  <>Sign in to Dashboard <ArrowRight className="w-[18px] h-[18px]" /></>
               )}
             </button>

             <div className="flex items-center gap-3 my-6">
               <div className="flex-1 h-px bg-white/5" />
               <span className="text-[11px] text-slate-500 font-medium">or</span>
               <div className="flex-1 h-px bg-white/5" />
             </div>

             <button type="button" className="w-full h-12 rounded-xl bg-transparent border border-white/10 text-white font-medium text-[14px] flex items-center justify-center gap-3 hover:bg-white/5 transition-all">
               <svg viewBox="0 0 24 24" className="w-5 h-5">
                 <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                 <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                 <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                 <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
               </svg>
               Sign in with Google
             </button>

             <div className="text-center mt-6">
               <p className="text-[13px] text-slate-400">Don't have an account? <a href="#" className="text-blue-500 hover:underline">Contact your administrator</a></p>
             </div>
           </form>
        </div>
      </div>
    </div>
  );
}
