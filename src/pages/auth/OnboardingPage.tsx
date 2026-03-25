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
      setStep(step + 1);
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
        const { error: riderInsertError } = await supabase
          .from('rider_profiles')
          .insert({
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

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900">Choose your vehicle</h3>
              <p className="text-gray-500 mt-2">
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
                    'p-4 rounded-xl border-2 transition-all text-center',
                    vehicleType === type
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-8 h-8 mx-auto mb-2',
                      vehicleType === type ? 'text-violet-600' : 'text-gray-400'
                    )}
                  />
                  <span
                    className={cn(
                      'text-sm font-medium',
                      vehicleType === type ? 'text-violet-700' : 'text-gray-700'
                    )}
                  >
                    {label}
                  </span>
                </button>
              ))}
            </div>

            <Button
              onClick={handleNext}
              className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white py-6"
            >
              <div className="flex items-center gap-2">
                Continue
                <ArrowRight className="w-5 h-5" />
              </div>
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900">Vehicle Details</h3>
              <p className="text-gray-500 mt-2">Enter your vehicle information</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name (Optional)</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="companyName"
                  placeholder="Your dispatch company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehiclePlate">Vehicle Plate Number *</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="vehiclePlate"
                  placeholder="ABC-123-XYZ"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  className={cn('pl-10 uppercase', errors.vehiclePlate && 'border-red-500')}
                />
              </div>
              {errors.vehiclePlate && (
                <p className="text-sm text-red-500">{errors.vehiclePlate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicleColor">Vehicle Color *</Label>
              <div className="relative">
                <Palette className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="vehicleColor"
                  placeholder="e.g., Red, Black, Blue"
                  value={vehicleColor}
                  onChange={(e) => setVehicleColor(e.target.value)}
                  className={cn('pl-10', errors.vehicleColor && 'border-red-500')}
                />
              </div>
              {errors.vehicleColor && (
                <p className="text-sm text-red-500">{errors.vehicleColor}</p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white py-6"
              >
                <div className="flex items-center gap-2">
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </div>
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900">Driver&apos;s License</h3>
              <p className="text-gray-500 mt-2">
                Enter your license information for verification
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="licenseNumber">License Number *</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="licenseNumber"
                  placeholder="Your driver's license number"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className={cn('pl-10 uppercase', errors.licenseNumber && 'border-red-500')}
                />
              </div>
              {errors.licenseNumber && (
                <p className="text-sm text-red-500">{errors.licenseNumber}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceRadius">Service Radius (km)</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="serviceRadius"
                  type="number"
                  min={5}
                  max={100}
                  value={serviceRadius}
                  onChange={(e) => setServiceRadius(parseInt(e.target.value, 10) || 10)}
                  className="pl-10"
                />
              </div>
              <p className="text-sm text-gray-500">
                Maximum distance you&apos;re willing to travel for deliveries
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white py-6"
              >
                <div className="flex items-center gap-2">
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </div>
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Ready to submit!</h3>
              <p className="text-gray-500 mt-2">
                Review your information before submitting
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Vehicle Type</span>
                <span className="font-medium capitalize">{vehicleType}</span>
              </div>

              {companyName && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Company</span>
                  <span className="font-medium">{companyName}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-500">Plate Number</span>
                <span className="font-medium uppercase">{vehiclePlate}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Color</span>
                <span className="font-medium">{vehicleColor}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">License</span>
                <span className="font-medium uppercase">{licenseNumber}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Service Radius</span>
                <span className="font-medium">{serviceRadius} km</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(3)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white py-6"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Submit Application
                    <ArrowRight className="w-5 h-5" />
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
    <div className="min-h-screen bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={cn(
                'w-3 h-3 rounded-full transition-colors',
                s <= step ? 'bg-white' : 'bg-white/30'
              )}
            />
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}