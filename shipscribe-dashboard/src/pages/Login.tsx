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

      // Check profile exists and has api_key
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, api_key, has_completed_onboarding')
        .eq('id', data.user?.id)
        .single();
        
      if (profileError || !profile || !profile.api_key) {
        console.warn('[login] Profile or API key missing:', profileError);
        // Ghost account — sign out immediately
        await supabase.auth.signOut();
        toast.error('Account configuration missing. Please contact support or use a different account.');
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

  const handleGoogleSignIn = () => {
    toast.error('Google Sign-In is not configured yet.');
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
