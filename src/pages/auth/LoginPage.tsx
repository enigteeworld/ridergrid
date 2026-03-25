// ============================================
// DISPATCH NG - Login Page
// ============================================
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
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
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
        <p className="text-gray-500 mt-2">Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={cn('pl-10', errors.email && 'border-red-500')}
            />
          </div>
          {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn('pl-10 pr-10', errors.password && 'border-red-500')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
            />
            <Label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
              Remember me
            </Label>
          </div>

          <Link to="/forgot-password" className="text-sm text-violet-600 hover:text-violet-700">
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white py-6"
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

      <p className="text-center mt-6 text-gray-600">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="text-violet-600 hover:text-violet-700 font-medium">
          Sign up
        </Link>
      </p>

      <div className="mt-8 pt-6 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center mb-3">
          Access different portals based on your account type
        </p>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-violet-50 rounded-lg">
            <div className="text-xs font-medium text-violet-700">Customer</div>
            <div className="text-[10px] text-violet-500">Book deliveries</div>
          </div>
          <div className="p-2 bg-emerald-50 rounded-lg">
            <div className="text-xs font-medium text-emerald-700">Rider</div>
            <div className="text-[10px] text-emerald-500">Accept jobs</div>
          </div>
          <div className="p-2 bg-amber-50 rounded-lg">
            <div className="text-xs font-medium text-amber-700">Admin</div>
            <div className="text-[10px] text-amber-500">Manage platform</div>
          </div>
        </div>
      </div>
    </div>
  );
}