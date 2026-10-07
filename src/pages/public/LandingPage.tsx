// ============================================
// DISPATCH NG - App Launch Landing Page
// Inspired by Uber Eats / Bolt / Glovo
// ============================================
import { useEffect, useMemo, useRef, useState } from 'react';
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
  Apple,
  Smartphone,
  Download,
  Zap,
  Clock,
  BadgeCheck,
  TrendingUp,
  HeartHandshake,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { BrandMark } from '@/components/BrandMark';
import { useBranding } from '@/hooks/useBranding';
import { useAuthStore } from '@/stores/authStore';
import { showToast } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

type PublicFeaturedRider = {
  id: string;
  profile_id: string;
  name: string;
  avatar: string | null;
  rating: number;
  location: string;
  isOnline: boolean;
  deliveries: number;
  vehicleType: string;
  phone: string | null;
  companyName: string | null;
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

const howItWorks = [
  {
    icon: Smartphone,
    title: 'Download the app',
    description:
      'Get Dispatch NG on your phone. Sign up in seconds and verify your account to start booking.',
  },
  {
    icon: MapPin,
    title: 'Drop your pin',
    description:
      'Set pickup and delivery locations. See available verified riders nearby in real-time.',
  },
  {
    icon: Wallet,
    title: 'Pay securely',
    description:
      'Fund your wallet once. Every delivery payment stays locked in escrow until you confirm arrival.',
  },
  {
    icon: CheckCircle,
    title: 'Track & confirm',
    description:
      'Follow your rider live. Confirm delivery and release payment — or flag issues instantly.',
  },
];

const features = [
  {
    icon: Shield,
    title: 'Verified riders only',
    description:
      'Every rider is ID-verified and background-checked before they hit the road. No exceptions.',
  },
  {
    icon: Wallet,
    title: 'Escrow-backed payments',
    description:
      'Your money stays protected in-app until delivery is confirmed. Zero risk, full control.',
  },
  {
    icon: Star,
    title: 'Ratings that matter',
    description:
      'Real feedback from real deliveries. Top-rated riders rise. Low-rated riders get reviewed.',
  },
  {
    icon: HeartHandshake,
    title: '24/7 dispute support',
    description:
      'Something went wrong? Our support team and ticket trail have your back, always.',
  },
];

const appFeatures = [
  { icon: Zap, label: 'Lightning Fast', desc: 'Average pickup in under 15 mins' },
  { icon: Clock, label: 'Real-time Tracking', desc: 'Watch your delivery live on map' },
  { icon: BadgeCheck, label: 'Verified Fleet', desc: 'Every rider, every bike, checked' },
  { icon: TrendingUp, label: 'Fair Pricing', desc: 'Transparent rates, no hidden fees' },
];

export function LandingPage() {
  const branding = useBranding();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuredRiders, setFeaturedRiders] = useState<PublicFeaturedRider[]>([]);
  const [ridersLoading, setRidersLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetchFeaturedRiders();
  }, []);

  const fetchFeaturedRiders = async () => {
    try {
      setRidersLoading(true);

      const { data, error } = await supabase
        .from('public_rider_cards')
        .select('*')
        .eq('verification_status', 'verified')
        .order('rating_average', { ascending: false })
        .limit(4);

      if (error) throw error;

      const profileIds = (data || []).map((r: any) => r.profile_id).filter(Boolean);

      let completedJobsMap = new Map<string, number>();

      if (profileIds.length > 0) {
        const { data: completedJobs, error: completedJobsError } = await supabase
          .from('dispatch_jobs')
          .select('rider_id')
          .in('rider_id', profileIds)
          .eq('status', 'completed');

        if (completedJobsError) throw completedJobsError;

        completedJobsMap = (completedJobs || []).reduce(
          (map: Map<string, number>, job: { rider_id: string }) => {
            const current = map.get(job.rider_id) || 0;
            map.set(job.rider_id, current + 1);
            return map;
          },
          new Map<string, number>()
        );
      }

      const formatted: PublicFeaturedRider[] = (data || []).map((r: any) => {
        const completedCount =
          completedJobsMap.get(r.profile_id) || Number(r.total_deliveries || 0);

        const primaryLocation =
          r.location ||
          r.city ||
          r.area ||
          (r.service_radius_km ? `${Number(r.service_radius_km)}km radius` : 'Lagos, Nigeria');

        return {
          id: r.id,
          profile_id: r.profile_id,
          name: r.full_name || 'Rider',
          avatar: r.avatar_url || null,
          rating: Number(r.rating_average || 0),
          location: primaryLocation,
          isOnline: !!r.is_online,
          deliveries: completedCount,
          vehicleType: r.vehicle_type || 'motorcycle',
          phone: r.phone || null,
          companyName: r.company_name || null,
        };
      });

      setFeaturedRiders(formatted);
    } catch (error) {
      console.error('Error fetching featured riders:', error);
      setFeaturedRiders([]);
      showToast('error', 'Error', 'Failed to load rider preview');
    } finally {
      setRidersLoading(false);
    }
  };

  const handleProtectedRidersAccess = () => {
    if (isAuthenticated) {
      navigate('/find-riders');
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

  const handleSecondaryAction = () => {
    navigate('/signup');
  };

  const stats = [
    {
      value: `${featuredRiders.length}+`,
      label: 'Verified Riders',
    },
    {
      value: `${featuredRiders.reduce((sum, rider) => sum + rider.deliveries, 0)}+`,
      label: 'Deliveries Completed',
    },
    {
      value:
        featuredRiders.length > 0
          ? (
              featuredRiders.reduce((sum, rider) => sum + Number(rider.rating || 0), 0) /
              featuredRiders.length
            )
              .toFixed(1)
              .replace('.0', '')
          : '0.0',
      label: 'Avg. Rating',
    },
    {
      value: '100%',
      label: 'Escrow Protected',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      {/* Navigation */}
      <nav
        className={cn(
          'fixed top-0 z-50 w-full transition-all duration-300',
          scrolled
            ? 'border-b border-white/10 bg-gray-950/90 backdrop-blur-xl shadow-2xl shadow-black/20'
            : 'bg-transparent'
        )}
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/')}
            className="flex min-w-0 items-center gap-3 text-left"
          >
            <BrandMark className="h-11 min-w-11 shrink-0" iconClassName="h-5 w-5" />
            <div className="min-w-0">
              <p className="truncate text-xl font-bold leading-tight text-white">{branding.site_name}</p>
              <p className="truncate text-xs font-medium text-gray-400 uppercase tracking-wider">
                Coming to App Store
              </p>
            </div>
          </button>

          <div className="hidden items-center gap-8 lg:flex">
            {['How it works', 'Features', 'Riders', 'Support'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(' ', '-')}`}
                className="text-sm font-medium text-gray-300 transition-colors hover:text-teal-400"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            {isAuthenticated ? (
              <Button
                onClick={() => navigate('/dashboard')}
                className="h-11 rounded-full bg-teal-500 px-6 text-white hover:bg-teal-600 font-semibold"
              >
                Dashboard
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/login')}
                  className="h-11 rounded-full text-gray-300 hover:text-white hover:bg-white/10"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => navigate('/signup')}
                  className="h-11 rounded-full bg-teal-500 px-6 text-white hover:bg-teal-600 font-semibold shadow-lg shadow-teal-500/25"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white backdrop-blur-sm sm:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-white/10 bg-gray-950/95 backdrop-blur-xl px-4 pb-6 pt-4 sm:hidden">
            <div className="space-y-1">
              {['How it works', 'Features', 'Riders', 'Support'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(' ', '-')}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-xl px-4 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5 hover:text-teal-400"
                >
                  {item}
                </a>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3">
              {isAuthenticated ? (
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/dashboard');
                  }}
                  className="w-full h-12 rounded-full bg-teal-500 text-white hover:bg-teal-600 font-semibold"
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
                    className="w-full h-12 rounded-full border-white/20 bg-transparent text-white hover:bg-white/10"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/signup');
                    }}
                    className="w-full h-12 rounded-full bg-teal-500 text-white hover:bg-teal-600 font-semibold"
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative overflow-hidden bg-gray-950 pt-20">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute left-1/4 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-teal-500/10 blur-[120px]" />
          <div className="absolute right-0 top-1/3 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[100px]" />
          <div className="absolute bottom-0 left-1/2 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-teal-900/20 blur-[100px]" />
        </div>

        {/* Grid Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:px-8 lg:pb-32 lg:pt-32">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left Content */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-2 text-sm font-semibold text-teal-400 backdrop-blur-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-500" />
                </span>
                Launching soon on iOS & Android
              </div>

              <div className="space-y-6">
                <h1 className="text-5xl font-black leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl">
                  Delivery,
                  <br />
                  <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                    reimagined.
                  </span>
                </h1>

                <p className="max-w-lg text-lg leading-relaxed text-gray-400 sm:text-xl">
                  Book verified dispatch riders in seconds. Your payment stays locked in escrow until
                  your package is safely delivered. This is logistics, done right.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Button
                  size="lg"
                  onClick={handlePrimaryAction}
                  className="h-14 rounded-full bg-teal-500 px-8 text-base font-bold text-white hover:bg-teal-600 shadow-xl shadow-teal-500/20 transition-transform hover:scale-105"
                >
                  {isAuthenticated ? 'Open Dashboard' : 'Get Started Free'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleSecondaryAction}
                  className="h-14 rounded-full border-white/20 bg-white/5 px-8 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/10 hover:text-white"
                >
                  <Play className="mr-2 h-5 w-5 fill-white" />
                  Become a Rider
                </Button>
              </div>

              {/* App Store Badges */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-sm">
                  <Apple className="h-7 w-7 text-white" />
                  <div className="text-left">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500">Download on</p>
                    <p className="text-sm font-bold text-white">App Store</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-sm">
                  <Download className="h-7 w-7 text-white" />
                  <div className="text-left">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500">Get it on</p>
                    <p className="text-sm font-bold text-white">Google Play</p>
                  </div>
                </div>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-4 pt-4">
                <div className="flex -space-x-3">
                  {featuredRiders.slice(0, 4).map((rider) =>
                    rider.avatar ? (
                      <img
                        key={rider.id}
                        src={rider.avatar}
                        alt={rider.name}
                        className="h-10 w-10 rounded-full border-2 border-gray-950 object-cover"
                      />
                    ) : (
                      <div
                        key={rider.id}
                        className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-950 bg-gradient-to-br from-teal-500 to-emerald-600 text-xs font-bold text-white"
                      >
                        {getInitials(rider.name)}
                      </div>
                    )
                  )}
                  {featuredRiders.length === 0 && (
                    <>
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-950 bg-gray-800 text-xs font-bold text-gray-400"
                        >
                          {String.fromCharCode(64 + i)}
                        </div>
                      ))}
                    </>
                  )}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="ml-1 text-sm font-bold text-white">4.9</span>
                  </div>
                  <p className="text-xs text-gray-500">From 2,000+ happy customers</p>
                </div>
              </div>
            </div>

            {/* Right Content - Phone Mockup + Rider Cards */}
            <div className="relative hidden lg:block">
              {/* Phone Frame */}
              <div className="relative mx-auto w-[320px]">
                <div className="relative rounded-[3rem] border-[8px] border-gray-800 bg-gray-950 p-2 shadow-2xl shadow-teal-500/10">
                  <div className="absolute left-1/2 top-0 z-10 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-gray-800" />
                  <div className="overflow-hidden rounded-[2.2rem] bg-gray-900">
                    {/* Mock App Header */}
                    <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-5 pb-8 pt-12">
                      <div className="flex items-center justify-between">
                        <div className="h-8 w-8 rounded-full bg-white/20" />
                        <div className="h-8 w-8 rounded-full bg-white/20" />
                      </div>
                      <p className="mt-4 text-2xl font-bold text-white">Hello there 👋</p>
                      <p className="text-sm text-teal-100">Where are we delivering today?</p>
                    </div>

                    {/* Mock App Content */}
                    <div className="space-y-3 p-4">
                      <div className="rounded-2xl bg-gray-800/50 p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-teal-500/20" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 w-3/4 rounded bg-gray-700" />
                            <div className="h-2 w-1/2 rounded bg-gray-700" />
                          </div>
                        </div>
                      </div>

                      {/* Mock Rider Cards */}
                      {ridersLoading ? (
                        [1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-3 rounded-2xl bg-gray-800/30 p-3 animate-pulse">
                            <div className="h-10 w-10 rounded-full bg-gray-700" />
                            <div className="flex-1 space-y-2">
                              <div className="h-3 w-24 rounded bg-gray-700" />
                              <div className="h-2 w-16 rounded bg-gray-700" />
                            </div>
                          </div>
                        ))
                      ) : (
                        featuredRiders.slice(0, 3).map((rider) => (
                          <div
                            key={rider.id}
                            className="flex items-center gap-3 rounded-2xl bg-gray-800/50 p-3 border border-white/5"
                          >
                            {rider.avatar ? (
                              <img src={rider.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-xs font-bold text-white">
                                {getInitials(rider.name)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-sm font-semibold text-white">{rider.name}</p>
                              <p className="truncate text-xs text-gray-500">{rider.location}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              <span className="text-xs font-bold text-white">
                                {rider.rating.toFixed(1).replace('.0', '')}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -right-8 top-20 rounded-2xl border border-teal-500/20 bg-gray-900/90 p-4 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-500/20">
                      <Shield className="h-5 w-5 text-teal-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Escrow Active</p>
                      <p className="text-[10px] text-gray-400">Payment protected</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -left-6 bottom-32 rounded-2xl border border-amber-500/20 bg-gray-900/90 p-4 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
                      <CheckCircle className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Delivered!</p>
                      <p className="text-[10px] text-gray-400">2 mins ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" className="w-full">
            <path
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative z-10 -mt-2 bg-white pb-16 pt-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-gray-50 p-6 text-center transition-all hover:border-emerald-200 hover:shadow-lg hover:shadow-teal-500/5"
              >
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-teal-500/5 transition-transform group-hover:scale-150" />
                <div className="relative">
                  <div className="text-3xl font-black text-gray-900 sm:text-4xl">{stat.value}</div>
                  <div className="mt-1 text-sm font-medium text-gray-500">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Features Marquee-style */}
      <section className="border-y border-gray-100 bg-gray-50/50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {appFeatures.map((feat) => (
              <div
                key={feat.label}
                className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-sm border border-gray-100"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <feat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{feat.label}</p>
                  <p className="mt-1 text-sm text-gray-500">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-teal-600">How it works</p>
            <h2 className="mt-3 text-4xl font-black text-gray-900 sm:text-5xl">
              Book in 4 taps.
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              No stress. No back-and-forth. Just open the app and move your package.
            </p>
          </div>

          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute left-8 top-0 hidden h-full w-0.5 bg-gradient-to-b from-emerald-200 via-teal-200 to-cyan-200 lg:left-1/2 lg:-translate-x-1/2 xl:block" />

            <div className="space-y-12 xl:space-y-24">
              {howItWorks.map((step, index) => {
                const isEven = index % 2 === 0;
                return (
                  <div
                    key={step.title}
                    className={cn(
                      'relative flex flex-col items-center gap-8 xl:flex-row',
                      isEven ? 'xl:flex-row' : 'xl:flex-row-reverse'
                    )}
                  >
                    {/* Content */}
                    <div className={cn('flex-1 xl:text-left', isEven ? 'xl:pr-16' : 'xl:pl-16')}>
                      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-8 sm:p-10">
                        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/20">
                          <step.icon className="h-8 w-8" />
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700">
                            {index + 1}
                          </span>
                          <h3 className="text-2xl font-bold text-gray-900">{step.title}</h3>
                        </div>
                        <p className="text-base leading-relaxed text-gray-600">{step.description}</p>
                      </div>
                    </div>

                    {/* Center Dot */}
                    <div className="relative z-10 hidden xl:flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-white bg-teal-500 shadow-xl shadow-teal-500/30">
                      <div className="h-3 w-3 rounded-full bg-white" />
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="bg-gray-950 py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-teal-500/5 blur-[120px]" />
        <div className="absolute right-0 bottom-0 h-[400px] w-[400px] rounded-full bg-emerald-500/5 blur-[100px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-teal-400">Why Dispatch NG</p>
            <h2 className="mt-3 text-4xl font-black text-white sm:text-5xl">
              Built different.
            </h2>
            <p className="mt-4 text-lg text-gray-400">
              We didn't just build another logistics app. We built a system that actually protects you.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-3xl border border-white/5 bg-white/5 p-8 backdrop-blur-sm transition-all hover:border-teal-500/30 hover:bg-white/10"
              >
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-teal-500/10 transition-transform group-hover:scale-150" />
                <div className="relative flex gap-5">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 text-teal-400 ring-1 ring-teal-500/20">
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                    <p className="mt-2 leading-relaxed text-gray-400">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rider Preview Section */}
      <section id="riders" className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-widest text-teal-600">Rider Network</p>
              <h2 className="mt-3 text-4xl font-black text-gray-900 sm:text-5xl">
                Meet your riders.
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                Verified. Rated. Ready. These are the people moving Lagos — one delivery at a time.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={handleProtectedRidersAccess}
              className="h-12 rounded-full border-gray-200 px-6 text-base font-semibold text-gray-900 hover:border-emerald-300 hover:bg-teal-50 hover:text-teal-700"
            >
              {isAuthenticated ? 'View All Riders' : 'Login to Book'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {ridersLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="rounded-3xl border border-gray-100 bg-gray-50 p-6 animate-pulse"
                >
                  <div className="mx-auto h-24 w-24 rounded-full bg-gray-200" />
                  <div className="mt-5 h-5 w-32 mx-auto rounded bg-gray-200" />
                  <div className="mx-auto mt-3 h-4 w-24 rounded bg-gray-200" />
                  <div className="mt-6 h-20 rounded-2xl bg-gray-100" />
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="h-12 rounded-xl bg-gray-100" />
                    <div className="h-12 rounded-xl bg-gray-100" />
                  </div>
                  <div className="mt-3 h-12 rounded-xl bg-gray-200" />
                </div>
              ))}
            </div>
          ) : featuredRiders.length === 0 ? (
            <div className="rounded-3xl border border-gray-100 bg-gray-50 p-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-lg font-semibold text-gray-900">Riders loading soon</p>
              <p className="mt-2 text-gray-500">Our verified fleet is gearing up. Check back shortly.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {featuredRiders.map((rider) => (
                <div
                  key={rider.id}
                  className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-500/5"
                >
                  <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-teal-50 transition-transform group-hover:scale-150" />

                  <div className="relative">
                    <div className="relative mx-auto w-fit">
                      {rider.avatar ? (
                        <img
                          src={rider.avatar}
                          alt={rider.name}
                          className="h-24 w-24 rounded-full object-cover ring-4 ring-gray-50"
                        />
                      ) : (
                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-2xl font-bold text-white ring-4 ring-gray-50">
                          {getInitials(rider.name)}
                        </div>
                      )}

                      {rider.isOnline && (
                        <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-[3px] border-white bg-teal-500 shadow-sm" />
                      )}
                    </div>

                    <div className="mt-5 text-center">
                      <h3 className="text-lg font-bold text-gray-900">{rider.name}</h3>
                      <div className="mt-1 flex items-center justify-center gap-1.5 text-sm text-gray-500">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{rider.location}</span>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-gray-50 p-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span className="font-bold text-gray-900">
                            {rider.rating.toFixed(1).replace('.0', '')}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-medium text-gray-500">Rating</p>
                      </div>
                      <div className="text-center border-l border-gray-200">
                        <p className="font-bold text-gray-900">{rider.deliveries}</p>
                        <p className="mt-1 text-xs font-medium text-gray-500">Deliveries</p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <button
                        onClick={handleProtectedRidersAccess}
                        className="inline-flex items-center justify-center rounded-xl bg-teal-50 px-3 py-3 text-sm font-semibold text-teal-700 transition-colors hover:bg-teal-100"
                      >
                        <Phone className="mr-2 h-4 w-4" />
                        Call
                      </button>
                      <button
                        onClick={handleProtectedRidersAccess}
                        className="inline-flex items-center justify-center rounded-xl bg-teal-50 px-3 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-teal-100"
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Message
                      </button>
                    </div>

                    <Button
                      onClick={handleProtectedRidersAccess}
                      className="mt-3 h-12 w-full rounded-xl bg-gray-900 text-sm font-bold text-white hover:bg-gray-800 transition-colors"
                    >
                      {isAuthenticated ? 'View Profile' : 'Login to Book'}
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Download App CTA */}
      <section className="bg-gray-950 py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute left-1/4 top-1/2 h-[600px] w-[600px] -translate-y-1/2 rounded-full bg-teal-500/10 blur-[120px]" />
          <div className="absolute right-1/4 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-emerald-500/10 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="space-y-8">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-teal-400">Get the app</p>
                <h2 className="mt-3 text-4xl font-black text-white sm:text-5xl lg:text-6xl">
                  Your delivery,
                  <br />
                  <span className="text-teal-400">in your pocket.</span>
                </h2>
                <p className="mt-6 max-w-lg text-lg leading-relaxed text-gray-400">
                  Download Dispatch NG and book verified riders in seconds. Track deliveries in real-time.
                  Pay securely with escrow. All from your phone.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <button className="group flex items-center gap-3 rounded-2xl bg-white px-6 py-4 transition-transform hover:scale-105">
                  <Apple className="h-8 w-8 text-gray-900" />
                  <div className="text-left">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Coming soon</p>
                    <p className="text-base font-bold text-gray-900">App Store</p>
                  </div>
                </button>
                <button className="group flex items-center gap-3 rounded-2xl bg-white px-6 py-4 transition-transform hover:scale-105">
                  <Download className="h-8 w-8 text-gray-900" />
                  <div className="text-left">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Coming soon</p>
                    <p className="text-base font-bold text-gray-900">Google Play</p>
                  </div>
                </button>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-teal-500" />
                  <span>Free download</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-teal-500" />
                  <span>No hidden fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-teal-500" />
                  <span>iOS & Android</span>
                </div>
              </div>
            </div>

            {/* Phone Mockup */}
            <div className="relative hidden lg:flex justify-center">
              <div className="relative w-[280px] rotate-[-6deg] transition-transform hover:rotate-0 duration-500">
                <div className="rounded-[2.5rem] border-[6px] border-gray-800 bg-gray-950 p-2 shadow-2xl shadow-teal-500/10">
                  <div className="overflow-hidden rounded-[2rem] bg-gray-900">
                    <div className="bg-gradient-to-br from-teal-600 to-emerald-700 px-5 pb-6 pt-10">
                      <div className="flex items-center justify-between">
                        <div className="h-7 w-7 rounded-full bg-white/20" />
                        <div className="h-7 w-7 rounded-full bg-white/20" />
                      </div>
                      <p className="mt-3 text-xl font-bold text-white">Active Delivery</p>
                      <p className="text-xs text-emerald-200">Arriving in 8 mins</p>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="rounded-xl bg-gray-800/50 p-3 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-teal-500/20 flex items-center justify-center">
                          <Truck className="h-4 w-4 text-teal-400" />
                        </div>
                        <div className="flex-1">
                          <div className="h-2.5 w-20 rounded bg-gray-700" />
                          <div className="mt-1.5 h-2 w-14 rounded bg-gray-700" />
                        </div>
                      </div>
                      <div className="rounded-xl bg-gray-800/30 p-3 space-y-2">
                        <div className="h-2 w-full rounded bg-gray-700" />
                        <div className="h-2 w-3/4 rounded bg-gray-700" />
                      </div>
                      <div className="rounded-xl bg-teal-500/20 p-3 text-center">
                        <p className="text-xs font-bold text-teal-400">Confirm Delivery</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute right-20 top-10 w-[260px] rotate-[6deg] transition-transform hover:rotate-0 duration-500">
                <div className="rounded-[2.5rem] border-[6px] border-gray-800 bg-gray-950 p-2 shadow-2xl shadow-emerald-500/10 opacity-60">
                  <div className="overflow-hidden rounded-[2rem] bg-gray-900">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 px-5 pb-6 pt-10">
                      <p className="text-xl font-bold text-white">Wallet</p>
                      <p className="text-xs text-gray-400">₦24,500.00 available</p>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="rounded-xl bg-gray-800/50 p-3">
                        <div className="h-2 w-16 rounded bg-gray-700" />
                      </div>
                      <div className="rounded-xl bg-gray-800/30 p-3">
                        <div className="h-2 w-full rounded bg-gray-700" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-500 px-8 py-16 text-center sm:px-16 sm:py-20">
            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

            <div className="relative mx-auto max-w-3xl space-y-8">
              <h2 className="text-4xl font-black text-white sm:text-5xl">
                Ready to move?
              </h2>
              <p className="mx-auto max-w-xl text-lg leading-relaxed text-teal-50">
                Join thousands of Lagosians who've switched to safer, smarter deliveries.
                Your first booking takes 30 seconds.
              </p>

              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  onClick={() => navigate('/signup')}
                  className="h-14 rounded-full bg-white px-8 text-base font-bold text-teal-700 hover:bg-gray-100 shadow-xl"
                >
                  <Users className="mr-2 h-5 w-5" />
                  Sign Up — It's Free
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/signup')}
                  className="h-14 rounded-full border-white bg-white/10 px-8 text-base font-bold text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
                >
                  <Truck className="mr-2 h-5 w-5" />
                  Become a Rider
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 py-16 text-gray-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600">
                  <Truck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-white">Dispatch NG</p>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Secure logistics
                  </p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-gray-500">
                The safest way to book dispatch riders in Nigeria. Verified fleet, escrow payments,
                and real support when you need it.
              </p>
              <div className="flex gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-gray-400 hover:bg-teal-500/20 hover:text-teal-400 transition-colors cursor-pointer">
                  <Apple className="h-4 w-4" />
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-gray-400 hover:bg-teal-500/20 hover:text-teal-400 transition-colors cursor-pointer">
                  <Download className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-5 text-sm font-bold uppercase tracking-widest text-white">Platform</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <button
                    onClick={handleProtectedRidersAccess}
                    className="transition-colors hover:text-teal-400"
                  >
                    Find Riders
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/signup')}
                    className="transition-colors hover:text-teal-400"
                  >
                    Become a Rider
                  </button>
                </li>
                <li>
                  <a href="#how-it-works" className="transition-colors hover:text-teal-400">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#features" className="transition-colors hover:text-teal-400">
                    Features
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-5 text-sm font-bold uppercase tracking-widest text-white">Support</h4>
              <ul className="space-y-3 text-sm">
                <li className="text-gray-500">Help Center</li>
                <li className="text-gray-500">Dispute Review</li>
                <li className="text-gray-500">Safety Guidelines</li>
                <li className="text-gray-500">Platform Terms</li>
              </ul>
            </div>

            <div>
              <h4 className="mb-5 text-sm font-bold uppercase tracking-widest text-white">Contact</h4>
              <ul className="space-y-3 text-sm text-gray-500">
                <li>support@dispatchng.com</li>
                <li>+234 800 123 4567</li>
                <li>Lagos, Nigeria</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
            <p className="text-sm text-gray-600">© 2026 Dispatch NG. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-gray-600">
              <span className="hover:text-gray-400 cursor-pointer">Privacy</span>
              <span className="hover:text-gray-400 cursor-pointer">Terms</span>
              <span className="hover:text-gray-400 cursor-pointer">Cookies</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}