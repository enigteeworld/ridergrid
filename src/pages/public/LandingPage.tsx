// ============================================
// DISPATCH NG - Public Landing Page
// ============================================
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Star,
  Shield,
  Wallet,
  Truck,
  CheckCircle,
  ArrowRight,
  Play,
  Users,
  Menu,
  X,
  Lock,
  BadgeCheck,
  Smartphone,
  MessageSquareWarning,
  ChevronRight,
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
    vehicleType: 'motorcycle',
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
    vehicleType: 'bicycle',
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
    vehicleType: 'motorcycle',
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
    vehicleType: 'van',
  },
];

const howItWorks = [
  {
    icon: Users,
    title: 'Create an Account',
    description:
      'Sign up as a customer to unlock verified riders, secure booking, wallet funding, and delivery protection.',
  },
  {
    icon: Wallet,
    title: 'Book Through the Platform',
    description:
      'Fund your wallet securely and create a delivery inside Dispatch NG so your payment stays protected.',
  },
  {
    icon: Truck,
    title: 'Rider Delivers',
    description:
      'Your assigned rider handles pickup and delivery while you track the job through the system.',
  },
  {
    icon: CheckCircle,
    title: 'Confirm & Close',
    description:
      'Confirm successful delivery before payout is released, with support and dispute handling available if needed.',
  },
];

const features = [
  {
    icon: Shield,
    title: 'Verified Riders',
    description:
      'Riders are reviewed before they can accept deliveries, helping customers book with more confidence.',
  },
  {
    icon: Wallet,
    title: 'Protected Payments',
    description:
      'Funds stay inside the platform flow so delivery payments can be tracked and handled properly.',
  },
  {
    icon: BadgeCheck,
    title: 'Dispute & Support Coverage',
    description:
      'Bookings made through Dispatch NG can be reviewed by admin if an issue comes up during delivery.',
  },
  {
    icon: Smartphone,
    title: 'Built for Fast Mobile Use',
    description:
      'Dispatch NG is designed for quick booking, rider discovery, wallet funding, and delivery tracking on mobile.',
  },
];

const trustPoints = [
  'Always book through Dispatch NG for payment protection.',
  'Off-platform payments are not covered by escrow, support, or dispute review.',
  'Rider payouts and delivery history are handled inside the system.',
];

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const authCtaLabel = useMemo(
    () => (isAuthenticated ? 'Go to Dashboard' : 'Get Started'),
    [isAuthenticated]
  );

  const handlePrimaryCta = () => {
    if (isAuthenticated) {
      navigate('/');
      return;
    }

    navigate('/signup');
  };

  const handleFindRiders = () => {
    if (isAuthenticated) {
      navigate('/riders');
      return;
    }

    navigate('/login');
  };

  const handleBecomeRider = () => {
    if (isAuthenticated) {
      navigate('/signup');
      return;
    }

    navigate('/signup');
  };

  const handleProtectedRidersPreview = () => {
    if (isAuthenticated) {
      navigate('/riders');
      return;
    }

    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3"
            type="button"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-sm">
              <Truck className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <div className="text-lg font-bold leading-none text-gray-900">Dispatch NG</div>
              <div className="text-[11px] text-gray-500">Secure rider marketplace</div>
            </div>
          </button>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#how-it-works" className="text-sm text-gray-600 transition-colors hover:text-violet-600">
              How It Works
            </a>
            <a href="#why-book-inside" className="text-sm text-gray-600 transition-colors hover:text-violet-600">
              Why Use Dispatch NG
            </a>
            <a href="#featured-riders" className="text-sm text-gray-600 transition-colors hover:text-violet-600">
              Riders Preview
            </a>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {!isAuthenticated && (
              <Button variant="ghost" onClick={() => navigate('/login')} className="text-gray-700">
                Sign In
              </Button>
            )}
            <Button
              onClick={handlePrimaryCta}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700"
            >
              {authCtaLabel}
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-700 md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-gray-100 bg-white md:hidden">
            <div className="space-y-3 px-4 py-4">
              <a
                href="#how-it-works"
                className="block rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-violet-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </a>
              <a
                href="#why-book-inside"
                className="block rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-violet-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Why Use Dispatch NG
              </a>
              <a
                href="#featured-riders"
                className="block rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-violet-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Riders Preview
              </a>

              <div className="grid grid-cols-1 gap-3 pt-2">
                {!isAuthenticated && (
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
                )}
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handlePrimaryCta();
                  }}
                  className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                >
                  {authCtaLabel}
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50" />
        <div className="absolute -top-20 right-0 h-72 w-72 rounded-full bg-violet-200/30 blur-3xl sm:h-96 sm:w-96" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-fuchsia-200/30 blur-3xl sm:h-96 sm:w-96" />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12 lg:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-2">
                <span className="h-2 w-2 rounded-full bg-violet-600 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                  Secure dispatch booking for Lagos and beyond
                </span>
              </div>

              <div className="space-y-4">
                <h1 className="max-w-2xl text-4xl font-bold leading-tight text-gray-900 sm:text-5xl lg:text-6xl">
                  Book trusted dispatch riders
                  <span className="block bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                    inside a protected system
                  </span>
                </h1>

                <p className="max-w-xl text-base leading-7 text-gray-600 sm:text-lg">
                  Dispatch NG helps customers find verified riders, fund deliveries safely, track jobs,
                  and keep payment, support, and dispute handling inside the platform.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button
                  size="lg"
                  onClick={handleFindRiders}
                  className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700"
                >
                  View Riders
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleBecomeRider}
                  className="w-full border-2 border-gray-200"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Become a Rider
                </Button>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                    <MessageSquareWarning className="h-5 w-5 text-amber-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-900">Always book through Dispatch NG</p>
                    <p className="mt-1 text-sm leading-6 text-amber-800">
                      Payments made outside the platform are not covered by escrow, support review,
                      or dispute resolution. Keep booking and payment inside Dispatch NG for protection.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <div className="flex -space-x-3">
                  {featuredRiders.slice(0, 4).map((rider) => (
                    <img
                      key={rider.id}
                      src={rider.avatar}
                      alt={rider.name}
                      className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-sm"
                    />
                  ))}
                </div>

                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">
                    Trusted by customers who want delivery handled through a proper system
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-[0_20px_80px_rgba(109,40,217,0.10)] sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Rider network preview</h3>
                    <p className="text-sm text-gray-500">Create an account to view and book riders</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleProtectedRidersPreview}
                    className="text-sm font-medium text-violet-600 hover:text-violet-700"
                  >
                    Open
                  </button>
                </div>

                <div className="space-y-3">
                  {featuredRiders.map((rider) => (
                    <button
                      key={rider.id}
                      type="button"
                      onClick={handleProtectedRidersPreview}
                      className="flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3 text-left transition-colors hover:bg-violet-50"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={rider.avatar}
                          alt={rider.name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                        {rider.isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-gray-900">{rider.name}</div>
                        <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{rider.location}</span>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span className="font-medium text-gray-900">{rider.rating}</span>
                        </div>
                        <div className="text-xs text-gray-500">{rider.deliveries} deliveries</div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                      <Lock className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-violet-900">Login required for full access</p>
                      <p className="mt-1 text-sm leading-6 text-violet-700">
                        Customers need an account to view rider details, contact riders, create deliveries,
                        and make protected payments through Dispatch NG.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="why-book-inside" className="border-y border-gray-100 bg-gray-50 py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Why customers should book inside Dispatch NG
            </h2>
            <p className="mt-3 text-base leading-7 text-gray-600">
              Dispatch NG is designed to keep booking, payment, rider accountability, and issue handling
              inside one trusted flow.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {trustPoints.map((point) => (
              <div
                key={point}
                className="rounded-2xl border border-white bg-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100">
                    <Shield className="h-4 w-4 text-violet-700" />
                  </div>
                  <p className="text-sm leading-6 text-gray-700">{point}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">How it works</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-gray-600">
              A cleaner, safer delivery process for customers and riders.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {howItWorks.map((step, index) => (
              <div
                key={step.title}
                className="relative rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"
              >
                <div className="absolute -top-3 left-5 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-sm font-bold text-white">
                  {index + 1}
                </div>

                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100">
                  <step.icon className="h-7 w-7 text-violet-600" />
                </div>

                <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-violet-600 to-fuchsia-600 py-14 sm:py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 text-center sm:px-6 md:grid-cols-4 lg:px-8">
          <div>
            <div className="text-3xl font-bold text-white sm:text-4xl">500+</div>
            <div className="mt-1 text-sm text-violet-100 sm:text-base">Verified Riders</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white sm:text-4xl">10K+</div>
            <div className="mt-1 text-sm text-violet-100 sm:text-base">Deliveries</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white sm:text-4xl">4.8</div>
            <div className="mt-1 text-sm text-violet-100 sm:text-base">Average Rating</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white sm:text-4xl">₦2M+</div>
            <div className="mt-1 text-sm text-violet-100 sm:text-base">Rider Earnings</div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20" id="features">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Why people choose Dispatch NG</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-gray-600">
              Built to help customers book properly and help riders operate inside a structured system.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex gap-4 rounded-3xl border border-gray-100 bg-gray-50 p-5 sm:p-6"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <feature.icon className="h-7 w-7 text-violet-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="featured-riders" className="bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Featured riders</h2>
              <p className="mt-2 text-base text-gray-600">
                A preview of riders on the Dispatch NG network.
              </p>
            </div>

            <Button variant="outline" onClick={handleProtectedRidersPreview} className="w-full sm:w-auto">
              Open rider network
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {featuredRiders.map((rider) => (
              <button
                key={rider.id}
                type="button"
                onClick={handleProtectedRidersPreview}
                className="group rounded-3xl border border-gray-100 bg-white p-5 text-left shadow-sm transition-all hover:border-violet-200 hover:shadow-md"
              >
                <div className="relative mb-4">
                  <img
                    src={rider.avatar}
                    alt={rider.name}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                  {rider.isOnline && (
                    <span className="absolute bottom-0 left-14 h-4 w-4 rounded-full border-2 border-white bg-green-500" />
                  )}
                </div>

                <h3 className="font-semibold text-gray-900 transition-colors group-hover:text-violet-700">
                  {rider.name}
                </h3>

                <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{rider.location}</span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-medium text-gray-900">{rider.rating}</span>
                  </div>
                  <span className="text-sm text-gray-500">{rider.deliveries} deliveries</span>
                </div>

                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-700">
                  Sign in to view rider details
                  <ChevronRight className="h-4 w-4" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-10 text-center sm:px-10 sm:py-14 md:px-14">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-20 -left-12 h-52 w-52 rounded-full bg-white/10 blur-2xl" />

            <div className="relative">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">Ready to use Dispatch NG properly?</h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-violet-100">
                Create an account to browse riders, fund deliveries, track jobs, and keep your bookings
                inside a secure platform flow.
              </p>

              <div className="mt-8 grid grid-cols-1 gap-3 sm:inline-flex sm:flex-wrap sm:justify-center">
                <Button
                  size="lg"
                  onClick={() => navigate('/signup')}
                  className="bg-white text-violet-700 hover:bg-gray-100"
                >
                  <Users className="mr-2 h-5 w-5" />
                  Sign Up as Customer
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/signup')}
                  className="border-2 border-white bg-transparent text-white hover:bg-white/10"
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
          <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
            <div>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600">
                  <Truck className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Dispatch NG</span>
              </div>
              <p className="text-sm leading-6 text-gray-400">
                A structured delivery marketplace helping customers and riders operate through a safer,
                more accountable platform flow.
              </p>
            </div>

            <div>
              <h4 className="mb-4 font-semibold text-white">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#how-it-works" className="hover:text-violet-400 transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={handleProtectedRidersPreview}
                    className="hover:text-violet-400 transition-colors"
                  >
                    Riders Preview
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate('/signup')}
                    className="hover:text-violet-400 transition-colors"
                  >
                    Become a Rider
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold text-white">Protection</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Verified riders</li>
                <li>Protected payment flow</li>
                <li>Support and dispute review</li>
                <li>Tracked delivery history</li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold text-white">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>support@dispatchng.com</li>
                <li>+234 800 123 4567</li>
                <li>Lagos, Nigeria</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
            © 2026 Dispatch NG. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
