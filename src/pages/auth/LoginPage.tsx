// ============================================
// DISPATCH NG - Login Page
// ============================================
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  Truck,
} from 'lucide-react';
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#090912] via-[#151529] to-[#0b0b14]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.28),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(217,70,239,0.24),transparent_30%),radial-gradient(circle_at_center,rgba(255,255,255,0.04),transparent_45%)]" />
      <div className="absolute -top-24 -left-16 h-56 w-56 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="absolute -bottom-20 -right-14 h-56 w-56 rounded-full bg-fuchsia-600/20 blur-3xl" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-5 sm:px-6 sm:py-8">
        <div className="w-full max-w-md">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mb-4 flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-left backdrop-blur-xl transition hover:bg-white/12 sm:mb-5"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-900/30">
              <Truck className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-white">Dispatch NG</p>
              <p className="truncate text-xs text-white/60">Tap to return to homepage</p>
            </div>
          </button>

          <div className="rounded-[28px] border border-white/12 bg-white/10 shadow-2xl shadow-black/30 backdrop-blur-2xl">
            <div className="rounded-[28px] border border-white/5 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-5 sm:p-6">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-900/30">
                  <Truck className="h-8 w-8 text-white" />
                </div>

                <h2 className="mb-1.5 text-2xl font-bold text-white sm:text-3xl">Welcome back</h2>
                <p className="text-sm text-white/65 sm:text-[15px]">
                  Sign in to continue your deliveries
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div
                  className={cn(
                    'space-y-1.5 transition-transform duration-200',
                    focusedField === 'email' && 'scale-[1.005]'
                  )}
                >
                  <Label htmlFor="email" className="text-sm font-medium text-white/82">
                    Email
                  </Label>

                  <div className="relative">
                    <Mail
                      className={cn(
                        'absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 transition-colors duration-200',
                        focusedField === 'email' ? 'text-violet-300' : 'text-white/45',
                        errors.email && 'text-red-300'
                      )}
                    />

                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      className={cn(
                        'h-12 rounded-2xl border border-white/14 bg-white/[0.08] pl-12 pr-11 text-[15px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md',
                        'placeholder:text-white/32',
                        'focus:border-violet-400/70 focus:bg-white/[0.1] focus:text-white focus:ring-4 focus:ring-violet-500/10 focus-visible:ring-4 focus-visible:ring-violet-500/10',
                        'selection:bg-violet-500/30',
                        errors.email &&
                          'border-red-300/70 focus:border-red-400 focus:ring-red-500/10'
                      )}
                    />

                    {email && !errors.email && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      </div>
                    )}
                  </div>

                  {errors.email && <p className="text-sm text-red-300">{errors.email}</p>}
                </div>

                <div
                  className={cn(
                    'space-y-1.5 transition-transform duration-200',
                    focusedField === 'password' && 'scale-[1.005]'
                  )}
                >
                  <Label htmlFor="password" className="text-sm font-medium text-white/82">
                    Password
                  </Label>

                  <div className="relative">
                    <Lock
                      className={cn(
                        'absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 transition-colors duration-200',
                        focusedField === 'password' ? 'text-violet-300' : 'text-white/45',
                        errors.password && 'text-red-300'
                      )}
                    />

                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      className={cn(
                        'h-12 rounded-2xl border border-white/14 bg-white/[0.08] pl-12 pr-12 text-[15px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md',
                        'placeholder:text-white/32',
                        'focus:border-violet-400/70 focus:bg-white/[0.1] focus:text-white focus:ring-4 focus:ring-violet-500/10 focus-visible:ring-4 focus-visible:ring-violet-500/10',
                        'selection:bg-violet-500/30',
                        errors.password &&
                          'border-red-300/70 focus:border-red-400 focus:ring-red-500/10'
                      )}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-white/45 transition-colors hover:text-white/75"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  {errors.password && <p className="text-sm text-red-300">{errors.password}</p>}
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      className="border-white/25 data-[state=checked]:border-violet-500 data-[state=checked]:bg-violet-600"
                    />
                    <Label htmlFor="remember" className="cursor-pointer text-sm text-white/70">
                      Remember me
                    </Label>
                  </div>

                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-violet-300 transition-colors hover:text-violet-200"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="pt-2.5">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-12 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-900/30 transition-all duration-300 hover:from-violet-700 hover:to-fuchsia-700 hover:shadow-xl hover:shadow-violet-900/40"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Signing in...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        Sign In
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    )}
                  </Button>
                </div>
              </form>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/12" />
                <span className="shrink-0 text-xs font-medium uppercase tracking-[0.18em] text-white/45">
                  or continue with
                </span>
                <div className="h-px flex-1 bg-white/12" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.05] px-4 text-white/85 transition-all duration-200 hover:bg-white/[0.09]"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="text-sm font-medium">Google</span>
                </button>

                <button
                  type="button"
                  className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.05] px-4 text-white/85 transition-all duration-200 hover:bg-white/[0.09]"
                >
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span className="text-sm font-medium">X</span>
                </button>
              </div>

              <p className="mt-6 text-center text-sm text-white/65">
                Don&apos;t have an account?{' '}
                <Link
                  to="/signup"
                  className="font-semibold text-violet-300 transition-colors hover:text-violet-200"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-white/35">
            Dispatch NG keeps booking, payment, and support inside one protected system.
          </p>
        </div>
      </div>
    </div>
  );
}
