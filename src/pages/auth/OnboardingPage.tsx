// ============================================
// DISPATCH NG - Rider Onboarding Page
// ============================================
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bike,
  Car,
  Truck,
  CheckCircle,
  ArrowRight,
  MapPin,
  Building2,
  Palette,
  Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { showToast } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import type { VehicleType } from '@/types';

const vehicleTypes: { type: VehicleType; icon: typeof Bike; label: string }[] = [
  { type: 'bicycle', icon: Bike, label: 'Bicycle' },
  { type: 'motorcycle', icon: Bike, label: 'Motorcycle' },
  { type: 'car', icon: Car, label: 'Car' },
  { type: 'van', icon: Truck, label: 'Van' },
  { type: 'truck', icon: Truck, label: 'Truck' },
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuthStore();

  const [step, setStep] = useState(1);
  const [vehicleType, setVehicleType] = useState<VehicleType>('motorcycle');
  const [companyName, setCompanyName] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [serviceRadius, setServiceRadius] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    if (step === 2) {
      if (!vehiclePlate.trim()) {
        newErrors.vehiclePlate = 'Vehicle plate number is required';
      }

      if (!vehicleColor.trim()) {
        newErrors.vehicleColor = 'Vehicle color is required';
      }
    }

    if (step === 3) {
      if (!licenseNumber.trim()) {
        newErrors.licenseNumber = "Driver's license number is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((prev) => prev + 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      showToast('error', 'Error', 'Please sign in first');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: existingRider, error: existingError } = await supabase
        .from('rider_profiles')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (!existingRider) {
        const { error: riderInsertError } = await supabase.from('rider_profiles').insert({
          profile_id: user.id,
          company_name: companyName || null,
          vehicle_type: vehicleType,
          vehicle_plate: vehiclePlate.toUpperCase(),
          vehicle_color: vehicleColor,
          license_number: licenseNumber.toUpperCase(),
          service_radius_km: serviceRadius,
          verification_status: 'pending',
        });

        if (riderInsertError) throw riderInsertError;
      }

      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          user_type: 'rider',
          role: 'rider',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileUpdateError) throw profileUpdateError;

      await refreshUser();

      showToast(
        'success',
        'Application submitted!',
        "Your rider application is under review. We'll notify you once approved."
      );

      navigate('/rider');
    } catch (error: any) {
      console.error('Onboarding error:', error);
      showToast('error', 'Error', error.message || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldBaseClass =
    'h-12 rounded-2xl border border-white/14 bg-white/[0.08] pl-12 pr-4 text-[15px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md placeholder:text-white/32 transition-all duration-200 focus:border-violet-400/70 focus:bg-white/[0.1] focus:text-white focus:ring-4 focus:ring-violet-500/10 focus-visible:ring-4 focus-visible:ring-violet-500/10 selection:bg-violet-500/30';

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-5">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white">Choose your vehicle</h3>
              <p className="mt-2 text-sm text-white/60">
                Select the type of vehicle you&apos;ll use for deliveries
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {vehicleTypes.map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setVehicleType(type)}
                  className={cn(
                    'rounded-2xl border p-4 text-center transition-all',
                    vehicleType === type
                      ? 'border-violet-400 bg-violet-500/12 shadow-lg shadow-violet-900/10'
                      : 'border-white/12 bg-white/[0.05] hover:bg-white/[0.09]'
                  )}
                >
                  <div
                    className={cn(
                      'mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full',
                      vehicleType === type
                        ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white'
                        : 'bg-white/10 text-white/60'
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  <span
                    className={cn(
                      'text-sm font-medium',
                      vehicleType === type ? 'text-violet-200' : 'text-white/80'
                    )}
                  >
                    {label}
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-2">
              <Button
                onClick={handleNext}
                className="h-12 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-900/30 transition-all duration-300 hover:from-violet-700 hover:to-fuchsia-700 hover:shadow-xl hover:shadow-violet-900/40"
              >
                <div className="flex items-center gap-2">
                  Continue
                  <ArrowRight className="h-5 w-5" />
                </div>
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white">Vehicle details</h3>
              <p className="mt-2 text-sm text-white/60">Enter your vehicle information</p>
            </div>

            <div
              className={cn(
                'space-y-1.5 transition-transform duration-200',
                focusedField === 'companyName' && 'scale-[1.005]'
              )}
            >
              <Label htmlFor="companyName" className="text-sm font-medium text-white/70">
                Company Name <span className="text-white/40">(Optional)</span>
              </Label>

              <div className="relative">
                <Building2
                  className={cn(
                    'absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 transition-colors duration-200',
                    focusedField === 'companyName' ? 'text-violet-300' : 'text-white/45'
                  )}
                />
                <Input
                  id="companyName"
                  placeholder="Your dispatch company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  onFocus={() => setFocusedField('companyName')}
                  onBlur={() => setFocusedField(null)}
                  className={fieldBaseClass}
                />
              </div>
            </div>

            <div
              className={cn(
                'space-y-1.5 transition-transform duration-200',
                focusedField === 'vehiclePlate' && 'scale-[1.005]'
              )}
            >
              <Label htmlFor="vehiclePlate" className="text-sm font-medium text-white/70">
                Vehicle Plate Number
              </Label>

              <div className="relative">
                <Hash
                  className={cn(
                    'absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 transition-colors duration-200',
                    focusedField === 'vehiclePlate' ? 'text-violet-300' : 'text-white/45',
                    errors.vehiclePlate && 'text-red-300'
                  )}
                />
                <Input
                  id="vehiclePlate"
                  placeholder="ABC-123-XYZ"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  onFocus={() => setFocusedField('vehiclePlate')}
                  onBlur={() => setFocusedField(null)}
                  className={cn(
                    fieldBaseClass,
                    'uppercase',
                    errors.vehiclePlate &&
                      'border-red-300/70 focus:border-red-400 focus:ring-red-500/10'
                  )}
                />
              </div>

              {errors.vehiclePlate && <p className="text-sm text-red-300">{errors.vehiclePlate}</p>}
            </div>

            <div
              className={cn(
                'space-y-1.5 transition-transform duration-200',
                focusedField === 'vehicleColor' && 'scale-[1.005]'
              )}
            >
              <Label htmlFor="vehicleColor" className="text-sm font-medium text-white/70">
                Vehicle Color
              </Label>

              <div className="relative">
                <Palette
                  className={cn(
                    'absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 transition-colors duration-200',
                    focusedField === 'vehicleColor' ? 'text-violet-300' : 'text-white/45',
                    errors.vehicleColor && 'text-red-300'
                  )}
                />
                <Input
                  id="vehicleColor"
                  placeholder="e.g. Red, Black, Blue"
                  value={vehicleColor}
                  onChange={(e) => setVehicleColor(e.target.value)}
                  onFocus={() => setFocusedField('vehicleColor')}
                  onBlur={() => setFocusedField(null)}
                  className={cn(
                    fieldBaseClass,
                    errors.vehicleColor &&
                      'border-red-300/70 focus:border-red-400 focus:ring-red-500/10'
                  )}
                />
              </div>

              {errors.vehicleColor && <p className="text-sm text-red-300">{errors.vehicleColor}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="h-12 rounded-2xl border-white/12 bg-white/[0.05] text-white hover:bg-white/[0.09] hover:text-white"
              >
                Back
              </Button>

              <Button
                onClick={handleNext}
                className="h-12 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-900/30 transition-all duration-300 hover:from-violet-700 hover:to-fuchsia-700 hover:shadow-xl hover:shadow-violet-900/40"
              >
                <div className="flex items-center gap-2">
                  Continue
                  <ArrowRight className="h-5 w-5" />
                </div>
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white">Driver&apos;s license</h3>
              <p className="mt-2 text-sm text-white/60">
                Enter your license information for verification
              </p>
            </div>

            <div
              className={cn(
                'space-y-1.5 transition-transform duration-200',
                focusedField === 'licenseNumber' && 'scale-[1.005]'
              )}
            >
              <Label htmlFor="licenseNumber" className="text-sm font-medium text-white/70">
                License Number
              </Label>

              <div className="relative">
                <Hash
                  className={cn(
                    'absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 transition-colors duration-200',
                    focusedField === 'licenseNumber' ? 'text-violet-300' : 'text-white/45',
                    errors.licenseNumber && 'text-red-300'
                  )}
                />
                <Input
                  id="licenseNumber"
                  placeholder="Your driver's license number"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  onFocus={() => setFocusedField('licenseNumber')}
                  onBlur={() => setFocusedField(null)}
                  className={cn(
                    fieldBaseClass,
                    'uppercase',
                    errors.licenseNumber &&
                      'border-red-300/70 focus:border-red-400 focus:ring-red-500/10'
                  )}
                />
              </div>

              {errors.licenseNumber && (
                <p className="text-sm text-red-300">{errors.licenseNumber}</p>
              )}
            </div>

            <div
              className={cn(
                'space-y-1.5 transition-transform duration-200',
                focusedField === 'serviceRadius' && 'scale-[1.005]'
              )}
            >
              <Label htmlFor="serviceRadius" className="text-sm font-medium text-white/70">
                Service Radius (km)
              </Label>

              <div className="relative">
                <MapPin
                  className={cn(
                    'absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 transition-colors duration-200',
                    focusedField === 'serviceRadius' ? 'text-violet-300' : 'text-white/45'
                  )}
                />
                <Input
                  id="serviceRadius"
                  type="number"
                  min={5}
                  max={100}
                  value={serviceRadius}
                  onChange={(e) => setServiceRadius(parseInt(e.target.value, 10) || 10)}
                  onFocus={() => setFocusedField('serviceRadius')}
                  onBlur={() => setFocusedField(null)}
                  className={fieldBaseClass}
                />
              </div>

              <p className="text-sm text-white/50">
                Maximum distance you&apos;re willing to travel for deliveries
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
                className="h-12 rounded-2xl border-white/12 bg-white/[0.05] text-white hover:bg-white/[0.09] hover:text-white"
              >
                Back
              </Button>

              <Button
                onClick={handleNext}
                className="h-12 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-900/30 transition-all duration-300 hover:from-violet-700 hover:to-fuchsia-700 hover:shadow-xl hover:shadow-violet-900/40"
              >
                <div className="flex items-center gap-2">
                  Continue
                  <ArrowRight className="h-5 w-5" />
                </div>
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-5">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/20">
                <CheckCircle className="h-10 w-10 text-emerald-400" />
              </div>

              <h3 className="text-xl font-semibold text-white">Ready to submit</h3>
              <p className="mt-2 text-sm text-white/60">
                Review your information before submitting
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-white/50">Vehicle Type</span>
                <span className="text-sm font-medium capitalize text-white">{vehicleType}</span>
              </div>

              {companyName && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-white/50">Company</span>
                  <span className="text-sm font-medium text-white">{companyName}</span>
                </div>
              )}

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-white/50">Plate Number</span>
                <span className="text-sm font-medium uppercase text-white">{vehiclePlate}</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-white/50">Color</span>
                <span className="text-sm font-medium text-white">{vehicleColor}</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-white/50">License</span>
                <span className="text-sm font-medium uppercase text-white">{licenseNumber}</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-white/50">Service Radius</span>
                <span className="text-sm font-medium text-white">{serviceRadius} km</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(3)}
                className="h-12 rounded-2xl border-white/12 bg-white/[0.05] text-white hover:bg-white/[0.09] hover:text-white"
              >
                Back
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="h-12 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-900/30 transition-all duration-300 hover:from-violet-700 hover:to-fuchsia-700 hover:shadow-xl hover:shadow-violet-900/40"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Submitting...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Submit
                    <ArrowRight className="h-5 w-5" />
                  </div>
                )}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#090912] via-[#151529] to-[#0b0b14]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.28),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(217,70,239,0.24),transparent_30%),radial-gradient(circle_at_center,rgba(255,255,255,0.04),transparent_45%)]" />
      <div className="absolute -top-24 -left-16 h-56 w-56 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="absolute -bottom-20 -right-14 h-56 w-56 rounded-full bg-fuchsia-600/20 blur-3xl" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-5 sm:px-6 sm:py-8">
        <div className="w-full max-w-md">
          <div className="rounded-[28px] border border-white/12 bg-white/10 shadow-2xl shadow-black/30 backdrop-blur-2xl">
            <div className="rounded-[28px] border border-white/5 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-5 sm:p-6">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-900/30">
                  <Truck className="h-8 w-8 text-white" />
                </div>

                <h2 className="mb-1.5 text-2xl font-bold text-white sm:text-3xl">
                  Rider onboarding
                </h2>
                <p className="text-sm text-white/65 sm:text-[15px]">
                  Complete your setup to start delivering with Dispatch NG
                </p>
              </div>

              <div className="mb-5 flex items-center justify-center gap-2">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={cn(
                      'h-2 w-14 rounded-full transition-all duration-300',
                      s <= step
                        ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
                        : 'bg-white/10'
                    )}
                  />
                ))}
              </div>

              {renderStep()}
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-white/35">
            Rider applications are reviewed before activation for safety and service quality.
          </p>
        </div>
      </div>
    </div>
  );
}
