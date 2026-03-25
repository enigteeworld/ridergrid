// ============================================
// DISPATCH NG - Public Landing Page
// ============================================

import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Star, 
  Phone, 
  MessageCircle, 
  Shield, 
  Wallet, 
  Truck, 
  CheckCircle,
  ArrowRight,
  Play,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';

// Mock featured riders data
const featuredRiders = [
  {
    id: '1',
    name: 'Emmanuel Okafor',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    rating: 4.9,
    reviews: 127,
    location: 'Ikeja, Lagos',
    isOnline: true,
    deliveries: 342,
    vehicleType: 'motorcycle'
  },
  {
    id: '2',
    name: 'Adebayo Johnson',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    rating: 4.8,
    reviews: 89,
    location: 'Yaba, Lagos',
    isOnline: true,
    deliveries: 215,
    vehicleType: 'bicycle'
  },
  {
    id: '3',
    name: 'Chioma Nwosu',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    rating: 5.0,
    reviews: 156,
    location: 'Lekki, Lagos',
    isOnline: false,
    deliveries: 478,
    vehicleType: 'motorcycle'
  },
  {
    id: '4',
    name: 'Ibrahim Mohammed',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    rating: 4.7,
    reviews: 64,
    location: 'Victoria Island, Lagos',
    isOnline: true,
    deliveries: 128,
    vehicleType: 'van'
  }
];

const howItWorks = [
  {
    icon: MapPin,
    title: 'Find a Rider',
    description: 'Browse verified dispatch riders near your location. Filter by rating, vehicle type, and availability.'
  },
  {
    icon: Wallet,
    title: 'Fund Your Wallet',
    description: 'Add money to your wallet securely. Your funds stay locked in escrow until delivery is complete.'
  },
  {
    icon: Truck,
    title: 'Create a Delivery',
    description: 'Enter pickup and drop-off details. Your rider gets notified instantly and heads your way.'
  },
  {
    icon: CheckCircle,
    title: 'Track & Confirm',
    description: 'Monitor delivery in real-time. Release payment only when you confirm successful delivery.'
  }
];

const features = [
  {
    icon: Shield,
    title: 'Verified Riders',
    description: 'All riders go through KYC verification before they can accept deliveries.'
  },
  {
    icon: Wallet,
    title: 'Secure Escrow',
    description: 'Your money is safe. Funds are only released to riders after delivery confirmation.'
  },
  {
    icon: Star,
    title: 'Rating System',
    description: 'Rate your experience and help others find the best dispatch riders.'
  },
  {
    icon: Phone,
    title: 'Direct Contact',
    description: 'Call, WhatsApp, or SMS your rider directly once connected.'
  }
];

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                Dispatch NG
              </span>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-gray-600 hover:text-violet-600 transition-colors">How It Works</a>
              <a href="#features" className="text-gray-600 hover:text-violet-600 transition-colors">Features</a>
              <a href="#riders" className="text-gray-600 hover:text-violet-600 transition-colors">Find Riders</a>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Button 
                  onClick={() => navigate('/')}
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                >
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate('/login')}
                    className="text-gray-600"
                  >
                    Sign In
                  </Button>
                  <Button 
                    onClick={() => navigate('/signup')}
                    className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-violet-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-fuchsia-200/30 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 rounded-full">
                <span className="w-2 h-2 bg-violet-600 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-violet-700">Now serving Lagos & Abuja</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Find Trusted Dispatch
                <span className="block bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                  Riders Near You
                </span>
              </h1>
              
              <p className="text-lg text-gray-600 max-w-lg">
                Connect with verified dispatch riders in your area. Secure payments, 
                real-time tracking, and peace of mind with every delivery.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg"
                  onClick={() => navigate('/riders')}
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-8"
                >
                  Find a Rider
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/signup')}
                  className="border-2 border-gray-200"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Become a Rider
                </Button>
              </div>

              <div className="flex items-center gap-6 pt-4">
                <div className="flex -space-x-3">
                  {featuredRiders.slice(0, 4).map((rider, i) => (
                    <img
                      key={i}
                      src={rider.avatar}
                      alt=""
                      className="w-10 h-10 rounded-full border-2 border-white object-cover"
                    />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">2,500+</span> deliveries completed
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative bg-white rounded-3xl shadow-2xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-gray-900">Featured Riders</h3>
                  <span className="text-sm text-violet-600 font-medium cursor-pointer" onClick={() => navigate('/riders')}>
                    View All
                  </span>
                </div>
                
                <div className="space-y-4">
                  {featuredRiders.map((rider) => (
                    <div 
                      key={rider.id}
                      onClick={() => navigate('/riders')}
                      className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-violet-50 transition-colors cursor-pointer group"
                    >
                      <div className="relative">
                        <img
                          src={rider.avatar}
                          alt={rider.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        {rider.isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 group-hover:text-violet-700 transition-colors">
                          {rider.name}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="truncate">{rider.location}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span className="font-medium text-gray-900">{rider.rating}</span>
                        </div>
                        <span className="text-xs text-gray-500">{rider.reviews} reviews</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-violet-600 to-fuchsia-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-white">500+</div>
              <div className="text-violet-100 mt-1">Verified Riders</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-white">10K+</div>
              <div className="text-violet-100 mt-1">Deliveries</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-white">4.8</div>
              <div className="text-violet-100 mt-1">Average Rating</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-white">₦2M+</div>
              <div className="text-violet-100 mt-1">Rider Earnings</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get your items delivered in 4 simple steps. Fast, secure, and reliable.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 h-full">
                  <div className="w-14 h-14 bg-gradient-to-br from-violet-100 to-fuchsia-100 rounded-xl flex items-center justify-center mb-6">
                    <step.icon className="w-7 h-7 text-violet-600" />
                  </div>
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Dispatch NG
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Built with security and convenience in mind for both customers and riders.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="flex gap-6 p-6 rounded-2xl bg-gray-50 hover:bg-violet-50 transition-colors"
              >
                <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-7 h-7 text-violet-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Riders Section */}
      <section id="riders" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Featured Riders
              </h2>
              <p className="text-gray-600">
                Top-rated dispatch riders ready to deliver
              </p>
            </div>
            <Button 
              variant="outline"
              onClick={() => navigate('/riders')}
              className="hidden md:flex"
            >
              View All Riders
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredRiders.map((rider) => (
              <div 
                key={rider.id}
                onClick={() => navigate('/riders')}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-violet-200 transition-all cursor-pointer group"
              >
                <div className="relative mb-4">
                  <img
                    src={rider.avatar}
                    alt={rider.name}
                    className="w-20 h-20 rounded-full mx-auto object-cover"
                  />
                  {rider.isOnline && (
                    <span className="absolute bottom-0 right-1/3 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 group-hover:text-violet-700 transition-colors">
                    {rider.name}
                  </h3>
                  <div className="flex items-center justify-center gap-1 text-sm text-gray-500 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {rider.location}
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="font-medium">{rider.rating}</span>
                    </div>
                    <span className="text-gray-300">|</span>
                    <span className="text-sm text-gray-500">{rider.deliveries} deliveries</span>
                  </div>
                  <div className="flex justify-center gap-3 mt-4">
                    <button className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors">
                      <Phone className="w-4 h-4 text-green-600" />
                    </button>
                    <button className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center hover:bg-emerald-200 transition-colors">
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Button 
              variant="outline"
              onClick={() => navigate('/riders')}
            >
              View All Riders
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-violet-100 text-lg max-w-2xl mx-auto mb-8">
                Join thousands of satisfied customers and riders on Nigeria's most trusted dispatch platform.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button 
                  size="lg"
                  onClick={() => navigate('/signup')}
                  className="bg-white text-violet-600 hover:bg-gray-100"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Sign Up as Customer
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/signup')}
                  className="border-2 border-white text-white hover:bg-white/10"
                >
                  <Truck className="w-5 h-5 mr-2" />
                  Become a Rider
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">
                  Dispatch NG
                </span>
              </div>
              <p className="text-gray-400">
                Nigeria's most trusted logistics marketplace. Connecting customers with verified dispatch riders.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="/riders" className="hover:text-violet-400 transition-colors">Find Riders</a></li>
                <li><a href="/signup" className="hover:text-violet-400 transition-colors">Become a Rider</a></li>
                <li><a href="#how-it-works" className="hover:text-violet-400 transition-colors">How It Works</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-violet-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-violet-400 transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-violet-400 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-2">
                <li>support@dispatchng.com</li>
                <li>+234 800 123 4567</li>
                <li>Lagos, Nigeria</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500">
            © 2025 Dispatch NG. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
