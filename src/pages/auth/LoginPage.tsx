// ============================================
// DISPATCH NG - Login Page (Instagram-like Design)
// ============================================
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { showToast } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

export function LoginPage() {
  const navigate = useNavigate();
  const { setLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) {
        throw new Error('Login failed. No user session was returned.');
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', data.user.id);

      if (updateError) {
        console.warn('Failed to update last_login_at:', updateError);
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, user_type')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile fetch after login failed:', profileError);
        showToast(
          'success',
          'Signed in',
          'Login succeeded, but we could not fully load your profile yet.'
        );
        navigate('/login');
        return;
      }

      if (!profile) {
        showToast(
          'error',
          'Profile missing',
          'Your account exists, but your profile could not be found yet. Please try again shortly.'
        );
        await supabase.auth.signOut();
        navigate('/login');
        return;
      }

      if (profile.user_type === 'rider') {
        const { data: riderProfile, error: riderProfileError } = await supabase
          .from('rider_profiles')
          .select('id')
          .eq('profile_id', data.user.id)
          .maybeSingle();

        if (riderProfileError) {
          console.error('Rider profile fetch after login failed:', riderProfileError);
        }

        showToast('success', 'Welcome back!', 'You have successfully signed in');

        if (!riderProfile) {
          navigate('/onboarding');
          return;
        }

        navigate('/rider');
        return;
      }

      if (profile.user_type === 'admin') {
        showToast('success', 'Welcome back!', 'You have successfully signed in');
        navigate('/admin');
        return;
      }

      showToast('success', 'Welcome back!', 'You have successfully signed in');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);

      let message = error?.message || 'Invalid email or password';
      const lower = message.toLowerCase();

      if (lower.includes('email not confirmed')) {
        message = 'Please confirm your email address before signing in.';
      } else if (lower.includes('invalid login credentials')) {
        message = 'Invalid email or password.';
      }

      showToast('error', 'Login failed', message);
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-8">
      {/* Header */}
      <div className="text-center mb-8 animate-fade-in-up">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
        <p className="text-gray-500">Sign in to your account to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Field */}
        <div className={cn(
          "space-y-2 transition-transform duration-200",
          focusedField === 'email' && "scale-[1.02]"
        )}>
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email
          </Label>
          <div className="relative group">
            <Mail className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-200",
              focusedField === 'email' ? 'text-violet-500' : 'text-gray-400',
              errors.email && 'text-red-400'
            )} />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              className={cn(
                'pl-12 pr-4 py-6 rounded-xl border-2 transition-all duration-200',
                'focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10',
                errors.email && 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
              )}
            />
            {email && !errors.email && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-scale-in">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
            )}
          </div>
          {errors.email && (
            <p className="text-sm text-red-500 flex items-center gap-1 animate-fade-in-down">
              {errors.email}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className={cn(
          "space-y-2 transition-transform duration-200",
          focusedField === 'password' && "scale-[1.02]"
        )}>
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            Password
          </Label>
          <div className="relative group">
            <Lock className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-200",
              focusedField === 'password' ? 'text-violet-500' : 'text-gray-400',
              errors.password && 'text-red-400'
            )} />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              className={cn(
                'pl-12 pr-12 py-6 rounded-xl border-2 transition-all duration-200',
                'focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10',
                errors.password && 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-500 animate-fade-in-down">
              {errors.password}
            </p>
          )}
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              className="rounded-md border-2 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
            />
            <Label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
              Remember me
            </Label>
          </div>

          <Link 
            to="/forgot-password" 
            className="text-sm text-violet-600 hover:text-violet-700 font-medium transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white py-6 rounded-xl font-semibold text-lg shadow-lg shadow-violet-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-[0.98]"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing in...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              Sign In
              <ArrowRight className="w-5 h-5" />
            </div>
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">or continue with</span>
        </div>
      </div>

      {/* Social Login Options */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="text-sm font-medium text-gray-700">Google</span>
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span className="text-sm font-medium text-gray-700">X</span>
        </button>
      </div>

      {/* Sign Up Link */}
      <p className="text-center mt-8 text-gray-600 animate-fade-in delay-400">
        Don&apos;t have an account?{' '}
        <Link 
          to="/signup" 
          className="text-violet-600 hover:text-violet-700 font-semibold transition-colors"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
