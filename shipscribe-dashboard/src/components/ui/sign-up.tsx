import React, { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { AuthLayout } from './auth-layout';
import { GoogleIcon, GlassInputWrapper } from './sign-in';

interface SignUpPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  heroVideoSrc?: string;
  onSignUp?: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn?: () => void;
  onLogin?: () => void;
  loading?: boolean;
  passwordStrength?: { label: string, color: string, width: string };
  password?: string;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({
  title,
  description,
  heroImageSrc,
  heroVideoSrc,
  onSignUp,
  onGoogleSignIn,
  onLogin,
  loading,
  passwordStrength,
  password,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <AuthLayout
      title={title}
      description={description}
      heroImageSrc={heroImageSrc}
      heroVideoSrc={heroVideoSrc}
    >
      <form className="space-y-5" onSubmit={onSignUp}>
        <div className="animate-element animate-delay-300">
          <label className="text-[10px] font-label font-medium uppercase tracking-[0.2em] text-zinc-500 mb-2 block ml-4">Email Address</label>
          <GlassInputWrapper>
            <input name="email" type="email" required placeholder="hello@builders.com" className="w-full bg-transparent text-xs px-5 py-3 rounded-full focus:outline-none text-white placeholder:text-zinc-600" />
          </GlassInputWrapper>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="animate-element animate-delay-400">
            <label className="text-[10px] font-label font-medium uppercase tracking-[0.2em] text-zinc-500 mb-2 block ml-4">Password</label>
            <GlassInputWrapper>
              <div className="relative">
                <input name="password" id="password-input" type={showPassword ? 'text' : 'password'} required placeholder="••••••••" className="w-full bg-transparent text-xs px-5 py-3 pr-12 rounded-full focus:outline-none text-white placeholder:text-zinc-600" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-4 flex items-center">
                  {showPassword ? <EyeOff className="w-5 h-5 text-zinc-500" /> : <Eye className="w-5 h-5 text-zinc-500" />}
                </button>
              </div>
            </GlassInputWrapper>
          </div>

          <div className="animate-element animate-delay-400">
            <label className="text-[10px] font-label font-medium uppercase tracking-[0.2em] text-zinc-500 mb-2 block ml-4">Confirm</label>
            <GlassInputWrapper>
              <div className="relative">
                <input name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} required placeholder="Confirm" className="w-full bg-transparent text-xs px-5 py-3 pr-12 rounded-full focus:outline-none text-white placeholder:text-zinc-600" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-4 flex items-center">
                  {showConfirmPassword ? <EyeOff className="w-5 h-5 text-zinc-500" /> : <Eye className="w-5 h-5 text-zinc-500" />}
                </button>
              </div>
            </GlassInputWrapper>
          </div>
        </div>

        {password && passwordStrength && (
          <div className="animate-element animate-delay-500 space-y-2 px-4 mt-2">
            <div className="flex justify-between items-center text-[10px] font-label uppercase tracking-widest text-zinc-500">
              <span className="flex items-center gap-2">
                <span className={`w-1 h-1 rounded-full ${passwordStrength.color.replace('bg-', 'bg-')}`} />
                Strength: <span className="text-zinc-300">{passwordStrength.label}</span>
              </span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden relative">
              <div className={`h-full ${passwordStrength.color} transition-all duration-500 shadow-[0_0_12px_rgba(255,255,255,0.2)] relative z-10`} style={{ width: passwordStrength.width }} />
              <div className={`absolute top-0 left-0 h-full ${passwordStrength.color} opacity-30 blur-md transition-all duration-500`} style={{ width: passwordStrength.width }} />
            </div>
          </div>
        )}

        <div className="animate-element animate-delay-550 flex items-center px-4">
          <label className="flex items-center gap-3 cursor-pointer text-zinc-500 hover:text-zinc-300 transition-colors group">
            <div className="relative flex items-center justify-center">
              <input 
                type="checkbox" 
                required
                className="peer appearance-none w-4 h-4 rounded border border-white/10 bg-white/5 checked:bg-blue-500 checked:border-blue-400 transition-all focus:ring-0 focus:ring-offset-0" 
              />
              <svg className="absolute w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-[11px] font-body">I agree to the <button type="button" className="text-white hover:underline transition-all">Terms of Service</button></span>
          </label>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="animate-element animate-delay-600 w-full py-3 bg-white/10 border border-white/20 backdrop-blur-md text-white rounded-full font-label text-[10px] uppercase tracking-[0.2em] hover:bg-white/20 transition-all font-bold shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
        >
          {loading && <Loader2 className="animate-spin" size={18} />}
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <div className="animate-element animate-delay-700 relative flex items-center justify-center py-4">
        <span className="w-full border-t border-white/5"></span>
        <span className="px-4 text-[10px] font-label font-medium uppercase tracking-[0.2em] text-zinc-600 bg-zinc-950 absolute whitespace-nowrap">Or continue with</span>
      </div>

      <button onClick={onGoogleSignIn} className="animate-element animate-delay-800 w-full flex items-center justify-center gap-3 border border-white/10 rounded-full py-3 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all font-label text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-lg">
          <GoogleIcon />
          Continue with Google
      </button>

      <p className="animate-element animate-delay-900 text-center text-xs text-zinc-500 font-body mt-4">
        Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); onLogin?.(); }} className="text-white font-bold hover:underline transition-all">Log In</a>
      </p>
    </AuthLayout>
  );
};
