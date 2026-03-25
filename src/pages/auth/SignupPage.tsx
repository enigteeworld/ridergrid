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

    if (password !== confirmPassword) {
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

  return (
    <div className="p-6 sm:p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          {step === 'account' ? 'Create account' : 'Choose account type'}
        </h2>
        <p className="text-gray-500 mt-2">
          {step === 'account'
            ? 'Enter your details to get started'
            : 'How will you use Dispatch NG?'}
        </p>
      </div>

      {step === 'account' ? (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="fullName"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={cn('pl-10', errors.fullName && 'border-red-500')}
              />
            </div>
            {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
          </div>

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
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="phone"
                type="tel"
                placeholder="+234 800 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={cn('pl-10', errors.phone && 'border-red-500')}
              />
            </div>
            {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={cn('pl-10', errors.confirmPassword && 'border-red-500')}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword}</p>
            )}
          </div>

          <Button
            onClick={handleContinue}
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white py-6"
          >
            <div className="flex items-center gap-2">
              Continue
              <ArrowRight className="w-5 h-5" />
            </div>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setUserType('customer')}
              className={cn(
                'p-6 rounded-2xl border-2 transition-all text-center',
                userType === 'customer'
                  ? 'border-violet-500 bg-violet-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div
                className={cn(
                  'w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3',
                  userType === 'customer'
                    ? 'bg-violet-500 text-white'
                    : 'bg-gray-100 text-gray-500'
                )}
              >
                <Package className="w-7 h-7" />
              </div>
              <h3
                className={cn(
                  'font-semibold',
                  userType === 'customer' ? 'text-violet-700' : 'text-gray-700'
                )}
              >
                Customer
              </h3>
              <p className="text-sm text-gray-500 mt-1">Send packages</p>
            </button>

            <button
              type="button"
              onClick={() => setUserType('rider')}
              className={cn(
                'p-6 rounded-2xl border-2 transition-all text-center',
                userType === 'rider'
                  ? 'border-violet-500 bg-violet-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div
                className={cn(
                  'w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3',
                  userType === 'rider'
                    ? 'bg-violet-500 text-white'
                    : 'bg-gray-100 text-gray-500'
                )}
              >
                <UserCircle className="w-7 h-7" />
              </div>
              <h3
                className={cn(
                  'font-semibold',
                  userType === 'rider' ? 'text-violet-700' : 'text-gray-700'
                )}
              >
                Rider
              </h3>
              <p className="text-sm text-gray-500 mt-1">Deliver packages</p>
            </button>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
            />
            <Label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer leading-relaxed">
              I agree to the{' '}
              <Link to="/terms" className="text-violet-600 hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-violet-600 hover:underline">
                Privacy Policy
              </Link>
            </Label>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !agreedToTerms}
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white py-6 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating account...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                Create Account
                <ArrowRight className="w-5 h-5" />
              </div>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => setStep('account')}
            className="w-full"
          >
            Back
          </Button>
        </form>
      )}

      <p className="text-center mt-6 text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="text-violet-600 hover:text-violet-700 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}