import React, { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { AuthLayout } from './auth-layout';

// --- HELPER COMPONENTS (ICONS) ---

export const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
    </svg>
);

export const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-full border border-white/10 bg-white/5 backdrop-blur-md transition-all hover:border-white/20 focus-within:border-white/30 focus-within:bg-white/10 text-white shadow-lg group">
    {children}
  </div>
);

// --- TYPE DEFINITIONS ---

interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  heroVideoSrc?: string;
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn?: () => void;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
  loading?: boolean;
}

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  title,
  description,
  heroImageSrc,
  heroVideoSrc,
  onSignIn,
  onGoogleSignIn,
  onResetPassword,
  onCreateAccount,
  loading,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <AuthLayout
      title={title}
      description={description}
      heroImageSrc={heroImageSrc}
      heroVideoSrc={heroVideoSrc}
    >
      <form className="space-y-5" onSubmit={onSignIn}>
        <div className="animate-element animate-delay-300">
          <label className="text-[10px] font-label font-medium uppercase tracking-[0.2em] text-zinc-500 mb-2 block ml-4">Email Address</label>
          <GlassInputWrapper>
            <input name="email" type="email" placeholder="hello@builders.com" className="w-full bg-transparent text-xs px-5 py-3 rounded-full focus:outline-none text-white placeholder:text-zinc-600" />
          </GlassInputWrapper>
        </div>

        <div className="animate-element animate-delay-400">
          <label className="text-[10px] font-label font-medium uppercase tracking-[0.2em] text-zinc-500 mb-2 block ml-4">Password</label>
          <GlassInputWrapper>
            <div className="relative">
              <input name="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="w-full bg-transparent text-sm px-6 py-4 pr-12 rounded-full focus:outline-none text-white placeholder:text-zinc-600" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-4 flex items-center">
                {showPassword ? <EyeOff className="w-5 h-5 text-zinc-500 hover:text-white transition-colors" /> : <Eye className="w-5 h-5 text-zinc-500 hover:text-white transition-colors" />}
              </button>
            </div>
          </GlassInputWrapper>
        </div>

        <div className="animate-element animate-delay-500 flex items-center justify-between text-[11px] px-2 uppercase font-label tracking-wider">
          <label className="flex items-center gap-3 cursor-pointer text-zinc-500 hover:text-zinc-300 transition-colors group">
            <div className="relative flex items-center justify-center">
              <input 
                type="checkbox" 
                name="rememberMe" 
                className="peer appearance-none w-4 h-4 rounded border border-white/10 bg-white/5 checked:bg-blue-500 checked:border-blue-400 transition-all focus:ring-0 focus:ring-offset-0" 
              />
              <svg className="absolute w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-body">Keep me signed in</span>
          </label>
          <a href="#" onClick={(e) => { e.preventDefault(); onResetPassword?.(); }} className="hover:text-white text-zinc-500 transition-colors">Reset password</a>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="animate-element animate-delay-600 w-full py-3 bg-white/10 border border-white/20 backdrop-blur-md text-white rounded-full font-label text-[10px] uppercase tracking-[0.2em] hover:bg-white/20 transition-all font-bold shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
        >
          {loading && <Loader2 className="animate-spin" size={18} />}
          {loading ? 'Signing in...' : 'Sign In'}
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
        New to our platform? <a href="#" onClick={(e) => { e.preventDefault(); onCreateAccount?.(); }} className="text-white font-bold hover:underline transition-all">Create Account</a>
      </p>
    </AuthLayout>
  );
};
