// ============================================
// DISPATCH NG - Signup Page
// ============================================
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  Package,
  UserCircle,
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

export function SignupPage() {
  const navigate = useNavigate();
  const { setLoading } = useAuthStore();

  const [step, setStep] = useState<'account' | 'type'>('account');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<'customer' | 'rider'>('customer');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const validateAccountStep = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[0-9]{10,14}$/.test(phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateAccountStep()) {
      setStep('type');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreedToTerms) {
      showToast('error', 'Terms required', 'Please agree to the terms and conditions');
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
            user_type: userType,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        const message =
          userType === 'rider'
            ? 'Your rider account was created successfully. Please sign in to continue onboarding.'
            : 'Your account was created successfully. Please sign in to continue.';

        showToast('success', 'Account created!', message);
        navigate('/login');
        return;
      }

      showToast(
        'success',
        'Signup complete',
        'Your account was created successfully. Please sign in.'
      );
      navigate('/login');
    } catch (error: any) {
      console.error('Signup error:', error);

      let message = error?.message || 'Something went wrong';

      if (message.toLowerCase().includes('rate limit')) {
        message = 'Too many attempts. Please wait a few minutes before trying again.';
      }

      showToast('error', 'Signup failed', message);
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const fieldBaseClass =
    'h-12 rounded-2xl border border-white/14 bg-white/[0.08] pl-12 pr-11 text-[15px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md placeholder:text-white/32 transition-all duration-200 focus:border-violet-400/70 focus:bg-white/[0.1] focus:text-white focus:ring-4 focus:ring-violet-500/10 focus-visible:ring-4 focus-visible:ring-violet-500/10 selection:bg-violet-500/30';

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

                <h2 className="mb-1.5 text-2xl font-bold text-white sm:text-3xl">
                  {step === 'account' ? 'Create account' : 'Choose account type'}
                </h2>

                <p className="text-sm text-white/65 sm:text-[15px]">
                  {step === 'account'
                    ? 'Create your Dispatch NG account to continue'
                    : 'Select how you want to use Dispatch NG'}
                </p>
              </div>

              <div className="mb-5 flex items-center justify-center gap-2">
                <div
                  className={cn(
                    'h-2 w-20 rounded-full transition-all duration-300',
                    step === 'account'
                      ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
                      : 'bg-white/10'
                  )}
                />
                <div
                  className={cn(
                    'h-2 w-20 rounded-full transition-all duration-300',
                    step === 'type'
                      ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
                      : 'bg-white/10'
                  )}
                />
              </div>

              {step === 'account' ? (
                <div className="space-y-4">
                  <div
                    className={cn(
                      'space-y-1.5 transition-transform duration-200',
                      focusedField === 'fullName' && 'scale-[1.005]'
                    )}
                  >
                    <Label htmlFor="fullName" className="text-sm font-medium text-white/82">
                      Full Name
                    </Label>

                    <div className="relative">
                      <User
                        className={cn(
                          'absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 transition-colors duration-200',
                          focusedField === 'fullName' ? 'text-violet-300' : 'text-white/45',
                          errors.fullName && 'text-red-300'
                        )}
                      />

                      <Input
                        id="fullName"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        onFocus={() => setFocusedField('fullName')}
                        onBlur={() => setFocusedField(null)}
                        className={cn(
                          fieldBaseClass,
                          errors.fullName &&
                            'border-red-300/70 focus:border-red-400 focus:ring-red-500/10'
                        )}
                      />

                      {fullName && !errors.fullName && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        </div>
                      )}
                    </div>

                    {errors.fullName && <p className="text-sm text-red-300">{errors.fullName}</p>}
                  </div>

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
                          fieldBaseClass,
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
                      focusedField === 'phone' && 'scale-[1.005]'
                    )}
                  >
                    <Label htmlFor="phone" className="text-sm font-medium text-white/82">
                      Phone Number
                    </Label>

                    <div className="relative">
                      <Phone
                        className={cn(
                          'absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 transition-colors duration-200',
                          focusedField === 'phone' ? 'text-violet-300' : 'text-white/45',
                          errors.phone && 'text-red-300'
                        )}
                      />

                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+234 800 000 0000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        onFocus={() => setFocusedField('phone')}
                        onBlur={() => setFocusedField(null)}
                        className={cn(
                          fieldBaseClass,
                          errors.phone &&
                            'border-red-300/70 focus:border-red-400 focus:ring-red-500/10'
                        )}
                      />

                      {phone && !errors.phone && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        </div>
                      )}
                    </div>

                    {errors.phone && <p className="text-sm text-red-300">{errors.phone}</p>}
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
                          fieldBaseClass,
                          'pr-12',
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

                  <div
                    className={cn(
                      'space-y-1.5 transition-transform duration-200',
                      focusedField === 'confirmPassword' && 'scale-[1.005]'
                    )}
                  >
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-white/82">
                      Confirm Password
                    </Label>

                    <div className="relative">
                      <Lock
                        className={cn(
                          'absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 transition-colors duration-200',
                          focusedField === 'confirmPassword' ? 'text-violet-300' : 'text-white/45',
                          errors.confirmPassword && 'text-red-300'
                        )}
                      />

                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onFocus={() => setFocusedField('confirmPassword')}
                        onBlur={() => setFocusedField(null)}
                        className={cn(
                          fieldBaseClass,
                          errors.confirmPassword &&
                            'border-red-300/70 focus:border-red-400 focus:ring-red-500/10'
                        )}
                      />

                      {confirmPassword &&
                        password === confirmPassword &&
                        !errors.confirmPassword && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                          </div>
                        )}
                    </div>

                    {errors.confirmPassword && (
                      <p className="text-sm text-red-300">{errors.confirmPassword}</p>
                    )}
                  </div>

                  <div className="pt-2">
                    <Button
                      type="button"
                      onClick={handleContinue}
                      className="h-12 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-900/30 transition-all duration-300 hover:from-violet-700 hover:to-fuchsia-700 hover:shadow-xl hover:shadow-violet-900/40"
                    >
                      <div className="flex items-center gap-2">
                        Continue
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setUserType('customer')}
                      className={cn(
                        'rounded-2xl border p-4 text-center transition-all',
                        userType === 'customer'
                          ? 'border-violet-400 bg-violet-500/12 shadow-lg shadow-violet-900/10'
                          : 'border-white/12 bg-white/[0.05] hover:bg-white/[0.09]'
                      )}
                    >
                      <div
                        className={cn(
                          'mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full',
                          userType === 'customer'
                            ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white'
                            : 'bg-white/10 text-white/60'
                        )}
                      >
                        <Package className="h-7 w-7" />
                      </div>

                      <h3
                        className={cn(
                          'font-semibold',
                          userType === 'customer' ? 'text-violet-200' : 'text-white'
                        )}
                      >
                        Customer
                      </h3>

                      <p className="mt-1 text-sm text-white/55">Send packages</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUserType('rider')}
                      className={cn(
                        'rounded-2xl border p-4 text-center transition-all',
                        userType === 'rider'
                          ? 'border-violet-400 bg-violet-500/12 shadow-lg shadow-violet-900/10'
                          : 'border-white/12 bg-white/[0.05] hover:bg-white/[0.09]'
                      )}
                    >
                      <div
                        className={cn(
                          'mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full',
                          userType === 'rider'
                            ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white'
                            : 'bg-white/10 text-white/60'
                        )}
                      >
                        <UserCircle className="h-7 w-7" />
                      </div>

                      <h3
                        className={cn(
                          'font-semibold',
                          userType === 'rider' ? 'text-violet-200' : 'text-white'
                        )}
                      >
                        Rider
                      </h3>

                      <p className="mt-1 text-sm text-white/55">Deliver packages</p>
                    </button>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="terms"
                        checked={agreedToTerms}
                        onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                        className="mt-0.5 border-white/25 data-[state=checked]:border-violet-500 data-[state=checked]:bg-violet-600"
                      />
                      <Label
                        htmlFor="terms"
                        className="cursor-pointer text-sm leading-relaxed text-white/70"
                      >
                        I agree to the{' '}
                        <Link to="/terms" className="font-medium text-violet-300 hover:text-violet-200">
                          Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link
                          to="/privacy"
                          className="font-medium text-violet-300 hover:text-violet-200"
                        >
                          Privacy Policy
                        </Link>
                      </Label>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting || !agreedToTerms}
                      className="h-12 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-900/30 transition-all duration-300 hover:from-violet-700 hover:to-fuchsia-700 hover:shadow-xl hover:shadow-violet-900/40 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Creating account...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          Create Account
                          <ArrowRight className="h-5 w-5" />
                        </div>
                      )}
                    </Button>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('account')}
                    className="h-12 w-full rounded-2xl border-white/12 bg-white/[0.05] text-white hover:bg-white/[0.09] hover:text-white"
                  >
                    Back
                  </Button>
                </form>
              )}

              <p className="mt-6 text-center text-sm text-white/65">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-violet-300 transition-colors hover:text-violet-200"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-white/35">
            Customers book securely. Riders earn through protected in-platform delivery flow.
          </p>
        </div>
      </div>
    </div>
  );
}
