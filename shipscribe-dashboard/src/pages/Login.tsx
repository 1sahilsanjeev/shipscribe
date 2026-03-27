import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { SignInPage } from '../components/ui/sign-in';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message || 'Invalid credentials');
        setLoading(false);
        return;
      }

      // Check profile and access status
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, api_key, has_completed_onboarding, access_status')
        .eq('id', data.user?.id)
        .single();

      // Only block if explicitly on waitlist
      if (profile?.access_status === 'waitlist') {
        await supabase.auth.signOut();
        toast.error('You are on the waitlist. Check your email for an invite.');
        setLoading(false);
        return;
      }

      // Profile missing = new user, send to onboarding
      if (!profile) {
        navigate('/onboarding');
        return;
      }

      toast.success('Welcome back!');

      if (profile.has_completed_onboarding) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } catch (error: any) {
      console.error('[login] Unexpected error:', error);
      toast.error(error.message || 'Login failed due to an unexpected error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = () => {
    toast.error('Password reset is not configured yet. Please contact support.');
  };

  const handleCreateAccount = () => {
    navigate('/signup');
  };

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="bg-background text-foreground">
      <SignInPage
        title={<>Welcome <span className="text-zinc-500 italic">back</span> to <span className="text-zinc-500 italic font-medium">scribe.</span></>}
        description="Enter your credentials to access your developer dashboard."
        heroVideoSrc="/login-bg-new.mp4"
        onSignIn={handleSignIn}
        onResetPassword={handleResetPassword}
        onCreateAccount={handleCreateAccount}
        onGoogleSignIn={handleGoogleSignIn}
        loading={loading}
      />
    </div>
  );
};

export default Login;
