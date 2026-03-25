import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { SignUpPage } from '../components/ui/sign-up';

const Signup: React.FC = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handle password strength on input change helper
  useEffect(() => {
    const input = document.getElementById('password-input') as HTMLInputElement;
    if (input) {
      const listener = (e: Event) => setPassword((e.target as HTMLInputElement).value);
      input.addEventListener('input', listener);
      return () => input.removeEventListener('input', listener);
    }
  }, []);

  const passwordStrength = useMemo(() => {
    if (!password) return { label: '', color: 'bg-zinc-200', width: '0%', score: 0 };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    switch (score) {
      case 0:
      case 1:
        return { label: 'Weak', color: 'bg-red-500', width: '25%', score };
      case 2:
        return { label: 'Fair', color: 'bg-yellow-400', width: '50%', score };
      case 3:
        return { label: 'Good', color: 'bg-blue-400', width: '75%', score };
      case 4:
        return { label: 'Strong', color: 'bg-emerald-500', width: '100%', score };
      default:
        return { label: '', color: 'bg-zinc-200', width: '0%', score };
    }
  }, [password]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const pwd = formData.get('password') as string;
    const confirmPwd = formData.get('confirmPassword') as string;

    if (pwd !== confirmPwd) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordStrength.score < 2) {
      toast.error('Please choose a stronger password');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pwd,
      });

      if (error) throw error;

      if (data.user) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          email: data.user.email,
          api_key: `sk_live_${Math.random().toString(36).substring(2, 15)}`,
          has_completed_onboarding: false
        });
      }

      toast.success('Account created! Welcome to Shipscribe.');
      navigate('/onboarding');
    } catch (error: any) {
      if (error.message?.includes('already registered')) {
        toast.error('Account already exists — redirecting to login');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        toast.error(error.message || 'Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleGoogleSignIn = () => {
    toast.error('Google Sign-In is not configured yet.');
  };

  return (
    <div className="bg-background text-foreground">
      <SignUpPage
        title={<>Be <span className="text-zinc-500 italic">first</span> to <span className="text-zinc-500 italic font-medium">scribe.</span></>}
        description="Join thousands of developers shipping their work out loud."
        heroVideoSrc="/login-bg-new.mp4"
        onSignUp={handleSubmit}
        onLogin={handleLogin}
        onGoogleSignIn={handleGoogleSignIn}
        loading={loading}
        passwordStrength={passwordStrength}
        password={password}
      />
    </div>
  );
};

export default Signup;
