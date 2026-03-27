// ============================================
// DISPATCH NG - Public Landing Page
// ============================================
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle,
  ChevronRight,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Play,
  Shield,
  Star,
  Truck,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

const featuredRiders = [
  {
    id: '1',
    name: 'Emmanuel Okafor',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    rating: 4.9,
    reviews: 127,
    location: 'Ikeja, Lagos',
    isOnline: true,
    deliveries: 342,
    vehicleType: 'Motorcycle',
  },
  {
    id: '2',
    name: 'Adebayo Johnson',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    rating: 4.8,
    reviews: 89,
    location: 'Yaba, Lagos',
    isOnline: true,
    deliveries: 215,
    vehicleType: 'Bicycle',
  },
  {
    id: '3',
    name: 'Chioma Nwosu',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    rating: 5.0,
    reviews: 156,
    location: 'Lekki, Lagos',
    isOnline: false,
    deliveries: 478,
    vehicleType: 'Motorcycle',
  },
  {
    id: '4',
    name: 'Ibrahim Mohammed',
    avatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    rating: 4.7,
    reviews: 64,
    location: 'Victoria Island, Lagos',
    isOnline: true,
    deliveries: 128,
    vehicleType: 'Van',
  },
];

const howItWorks = [
  {
    icon: MapPin,
    title: 'Create an account',
    description:
      'Sign up first so every booking, payout, rating, and issue stays inside the Dispatch NG system.',
  },
  {
    icon: Wallet,
    title: 'Fund securely',
    description:
      'Add money to your wallet and keep delivery payment protected inside escrow until completion.',
  },
  {
    icon: Truck,
    title: 'Book a rider',
    description:
      'Choose a verified rider, create your delivery request, and keep all job details inside the platform.',
  },
  {
    icon: CheckCircle,
    title: 'Confirm before payout',
    description:
      'Customer confirms successful delivery before rider payout is released, with dispute handling if needed.',
  },
];

const features = [
  {
    icon: Shield,
    title: 'Verified riders only',
    description:
      'Riders are reviewed before they can take jobs, helping customers book with more confidence.',
  },
  {
    icon: Wallet,
    title: 'Escrow-backed flow',
    description:
      'Payments made inside the system stay protected until delivery is confirmed properly.',
  },
  {
    icon: Star,
    title: 'Ratings that matter',
    description:
      'Customers can rate completed jobs, helping the best riders stand out over time.',
  },
  {
    icon: MessageCircle,
    title: 'Support and dispute trail',
    description:
      'If anything goes wrong, the platform keeps a ticket trail for support and admin review.',
  },
];

const stats = [
  { value: '500+', label: 'Verified Riders' },
  { value: '10K+', label: 'Deliveries' },
  { value: '4.8', label: 'Average Rating' },
  { value: '₦2M+', label: 'Rider Earnings' },
];

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const trustedPreviewText = useMemo(() => {
    return 'Trusted by customers who want delivery handled through a proper system';
  }, []);

  const handleProtectedRidersAccess = () => {
    if (isAuthenticated) {
      navigate('/riders');
      return;
    }

    navigate('/login');
  };

  const handlePrimaryAction = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
      return;
    }

    navigate('/signup');
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/')}
            className="flex min-w-0 items-center gap-3 text-left"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-200/60">
              <Truck className="h-5 w-5 text-white" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-xl font-bold leading-tight">Dispatch NG</p>
              <p className="truncate text-sm text-gray-500">Secure rider marketplace</p>
            </div>
          </button>

          <div className="hidden items-center gap-8 lg:flex">
            <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-violet-600">
              How it works
            </a>
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-violet-600">
              Features
            </a>
            <a href="#riders" className="text-sm font-medium text-gray-600 hover:text-violet-600">
              Rider preview
            </a>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            {isAuthenticated ? (
              <Button
                onClick={() => navigate('/dashboard')}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700"
              >
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/login')} className="text-gray-600">
                  Sign In
                </Button>
                <Button
                  onClick={() => navigate('/signup')}
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-700 shadow-sm sm:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-gray-100 bg-white px-4 pb-5 pt-3 sm:hidden">
            <div className="space-y-2">
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-xl px-3 py-3 text-sm font-medium text-gray-700 hover:bg-violet-50 hover:text-violet-700"
              >
                How it works
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-xl px-3 py-3 text-sm font-medium text-gray-700 hover:bg-violet-50 hover:text-violet-700"
              >
                Features
              </a>
              <a
                href="#riders"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-xl px-3 py-3 text-sm font-medium text-gray-700 hover:bg-violet-50 hover:text-violet-700"
              >
                Rider preview
              </a>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              {isAuthenticated ? (
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/dashboard');
                  }}
                  className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700"
                >
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/login');
                    }}
                    className="w-full"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/signup');
                    }}
                    className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700"
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50" />
        <div className="absolute right-[-120px] top-[-40px] h-72 w-72 rounded-full bg-violet-200/40 blur-3xl" />
        <div className="absolute bottom-[-80px] left-[-100px] h-72 w-72 rounded-full bg-fuchsia-200/40 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-8 sm:px-6 sm:pb-20 sm:pt-10 lg:px-8 lg:pb-24 lg:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-4 py-2 text-sm font-medium text-violet-700 shadow-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-violet-600 animate-pulse" />
                Built for protected delivery booking
              </div>

              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">
                  Book trusted dispatch riders
                  <span className="block bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                    the proper way.
                  </span>
                </h1>

                <p className="max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
                  Dispatch NG helps customers book verified riders, keep payments inside escrow,
                  confirm successful delivery before payout, and open support tickets if anything
                  goes wrong.
                </p>
              </div>

              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
                <p className="text-sm leading-7 text-amber-800 sm:text-base">
                  Payments made outside the platform are not covered by escrow, support review, or
                  dispute resolution.
                  <span className="font-semibold">
                    {' '}
                    Keep booking and payment inside Dispatch NG for protection.
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <Button
                  size="lg"
                  onClick={handlePrimaryAction}
                  className="h-12 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700"
                >
                  {isAuthenticated ? 'Go to Dashboard' : 'Create Account'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/signup')}
                  className="h-12 rounded-2xl border-gray-200 bg-white"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Become a Rider
                </Button>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-3">
                    {featuredRiders.slice(0, 4).map((rider) => (
                      <img
                        key={rider.id}
                        src={rider.avatar}
                        alt={rider.name}
                        className="h-11 w-11 rounded-full border-2 border-white object-cover shadow-sm"
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>

                <p className="max-w-md text-sm leading-6 text-gray-600">{trustedPreviewText}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
                <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Rider network preview</h3>
                      <p className="text-sm text-gray-500">
                        Create an account to view and book riders properly
                      </p>
                    </div>

                    <button
                      onClick={handleProtectedRidersAccess}
                      className="text-sm font-semibold text-violet-600"
                    >
                      Open
                    </button>
                  </div>
                </div>

                <div className="space-y-1 px-3 py-3 sm:px-4">
                  {featuredRiders.map((rider) => (
                    <button
                      key={rider.id}
                      onClick={handleProtectedRidersAccess}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-violet-50"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={rider.avatar}
                          alt={rider.name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                        {rider.isOnline && (
                          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-gray-900">{rider.name}</p>
                        <div className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{rider.location}</span>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span className="font-semibold text-gray-900">{rider.rating}</span>
                        </div>
                        <p className="text-xs text-gray-500">{rider.deliveries} deliveries</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-violet-100 bg-white/80 p-4 shadow-sm backdrop-blur-sm sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                    <Shield className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900">Why the system matters</p>
                    <p className="mt-1 text-sm leading-6 text-gray-600">
                      Booking inside Dispatch NG protects both customer and rider with wallet trail,
                      escrow flow, ratings, admin review, and disputes when needed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-violet-600 to-fuchsia-600 py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-5">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-3xl border border-white/15 bg-white/10 px-4 py-5 text-center backdrop-blur-sm"
              >
                <div className="text-3xl font-bold text-white sm:text-4xl">{stat.value}</div>
                <div className="mt-1 text-sm text-violet-100 sm:text-base">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-12 max-w-3xl text-center sm:mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">How it works</h2>
            <p className="mt-4 text-base leading-7 text-gray-600 sm:text-lg">
              The flow is designed to keep delivery, payout, and support inside one clean system.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {howItWorks.map((step, index) => (
              <div
                key={step.title}
                className="relative h-full rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm"
              >
                <div className="absolute left-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-sm font-bold text-white">
                  {index + 1}
                </div>

                <div className="mt-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-700">
                  <step.icon className="h-7 w-7" />
                </div>

                <h3 className="mt-5 text-lg font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-12 max-w-3xl text-center sm:mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Why people choose Dispatch NG
            </h2>
            <p className="mt-4 text-base leading-7 text-gray-600 sm:text-lg">
              Built to help customers book properly and help riders get paid through a safer flow.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex gap-4 rounded-[28px] border border-gray-100 bg-gray-50 p-5 sm:gap-5 sm:p-6"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm">
                  <feature.icon className="h-7 w-7" />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-gray-600 sm:text-base">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="riders" className="bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-4 sm:mb-12 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Featured riders</h2>
              <p className="mt-3 text-base leading-7 text-gray-600">
                Public preview is limited. Customers should create an account and log in before
                booking or contacting riders through the system.
              </p>
            </div>

            <Button variant="outline" onClick={handleProtectedRidersAccess} className="w-full md:w-auto">
              {isAuthenticated ? 'Open Rider Directory' : 'Login to View Riders'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {featuredRiders.map((rider) => (
              <div
                key={rider.id}
                className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="relative mx-auto w-fit">
                  <img
                    src={rider.avatar}
                    alt={rider.name}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                  {rider.isOnline && (
                    <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white bg-green-500" />
                  )}
                </div>

                <div className="mt-4 text-center">
                  <h3 className="text-lg font-semibold text-gray-900">{rider.name}</h3>
                  <div className="mt-1 flex items-center justify-center gap-1 text-sm text-gray-500">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{rider.location}</span>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-gray-50 p-3 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-gray-900">{rider.rating}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Rating</p>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900">{rider.deliveries}</p>
                    <p className="mt-1 text-xs text-gray-500">Deliveries</p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    onClick={handleProtectedRidersAccess}
                    className="inline-flex items-center justify-center rounded-2xl bg-green-50 px-3 py-3 text-sm font-medium text-green-700 transition-colors hover:bg-green-100"
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Call
                  </button>

                  <button
                    onClick={handleProtectedRidersAccess}
                    className="inline-flex items-center justify-center rounded-2xl bg-emerald-50 px-3 py-3 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    WhatsApp
                  </button>
                </div>

                <Button
                  onClick={handleProtectedRidersAccess}
                  className="mt-3 h-11 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700"
                >
                  {isAuthenticated ? 'View Rider' : 'Login to Book'}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-10 text-center sm:px-10 sm:py-14 md:px-14 md:py-16">
            <div className="absolute right-[-80px] top-[-80px] h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-[-90px] left-[-70px] h-48 w-48 rounded-full bg-white/10 blur-2xl" />

            <div className="relative mx-auto max-w-3xl">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">Ready to get started?</h2>
              <p className="mt-4 text-base leading-7 text-violet-100 sm:text-lg">
                Join customers and riders using one cleaner delivery flow with booking, escrow,
                payout control, and support trail in one place.
              </p>

              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <Button
                  size="lg"
                  onClick={() => navigate('/signup')}
                  className="h-12 rounded-2xl bg-white text-violet-700 hover:bg-violet-50"
                >
                  <Users className="mr-2 h-5 w-5" />
                  Sign Up as Customer
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/signup')}
                  className="h-12 rounded-2xl border-white text-violet-700 hover:bg-white/10"
                >
                  <Truck className="mr-2 h-5 w-5" />
                  Become a Rider
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-950 py-14 text-gray-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600">
                  <Truck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-white">Dispatch NG</p>
                  <p className="text-sm text-gray-400">Secure rider marketplace</p>
                </div>
              </div>

              <p className="text-sm leading-7 text-gray-400">
                A cleaner logistics system for verified riders, protected customer booking, escrow,
                and admin-supported dispute handling.
              </p>
            </div>

            <div>
              <h4 className="mb-4 font-semibold text-white">Quick Links</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <button onClick={handleProtectedRidersAccess} className="hover:text-violet-400">
                    Find Riders
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/signup')} className="hover:text-violet-400">
                    Become a Rider
                  </button>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-violet-400">
                    How It Works
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold text-white">Support</h4>
              <ul className="space-y-3 text-sm">
                <li className="text-gray-400">Help Center</li>
                <li className="text-gray-400">Dispute Review</li>
                <li className="text-gray-400">Platform Terms</li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold text-white">Contact</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li>support@dispatchng.com</li>
                <li>+234 800 123 4567</li>
                <li>Lagos, Nigeria</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-6 text-center text-sm text-gray-500">
            © 2026 Dispatch NG. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
