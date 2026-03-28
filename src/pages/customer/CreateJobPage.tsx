// ============================================
// DISPATCH NG - Create Job Page
// ============================================

import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  MapPin,
  Package,
  Phone,
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Wallet,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { showToast } from '@/stores/uiStore';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/lib/utils';

export function CreateJobPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, wallet } = useAuthStore();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [platformFee, setPlatformFee] = useState(200);
  const [isLoadingPlatformFee, setIsLoadingPlatformFee] = useState(true);

  // Selected rider passed from Find Riders page
  const selectedRiderId = searchParams.get('riderId') || location.state?.riderId || null;
  const selectedRiderName = location.state?.riderName || '';
  const selectedRiderCompanyName = location.state?.riderCompanyName || '';
  const selectedRiderVehicleType = location.state?.riderVehicleType || '';

  // Form data
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupContactName, setPickupContactName] = useState('');
  const [pickupContactPhone, setPickupContactPhone] = useState('');
  const [pickupNotes, setPickupNotes] = useState('');

  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryContactName, setDeliveryContactName] = useState('');
  const [deliveryContactPhone, setDeliveryContactPhone] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const [packageDescription, setPackageDescription] = useState('');
  const [packageWeight, setPackageWeight] = useState('');
  const [agreedAmount, setAgreedAmount] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const amountNumber = useMemo(() => parseFloat(agreedAmount) || 0, [agreedAmount]);
  const riderEarnings = useMemo(
    () => Math.max(amountNumber - platformFee, 0),
    [amountNumber, platformFee]
  );

  useEffect(() => {
    const fetchPlatformFee = async () => {
      try {
        setIsLoadingPlatformFee(true);

        const { data, error } = await supabase
          .from('platform_settings')
          .select('setting_value')
          .eq('setting_key', 'platform_fee_amount')
          .maybeSingle();

        if (error) throw error;

        const fee = Number(data?.setting_value || 200);
        setPlatformFee(Number.isFinite(fee) ? fee : 200);
      } catch (error) {
        console.error('Error fetching platform fee:', error);
        setPlatformFee(200);
      } finally {
        setIsLoadingPlatformFee(false);
      }
    };

    void fetchPlatformFee();
  }, []);

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!pickupAddress.trim()) newErrors.pickupAddress = 'Pickup address is required';
      if (!pickupContactName.trim()) newErrors.pickupContactName = 'Contact name is required';
      if (!pickupContactPhone.trim()) newErrors.pickupContactPhone = 'Contact phone is required';
    }

    if (step === 2) {
      if (!deliveryAddress.trim()) newErrors.deliveryAddress = 'Delivery address is required';
      if (!deliveryContactName.trim()) newErrors.deliveryContactName = 'Contact name is required';
      if (!deliveryContactPhone.trim()) newErrors.deliveryContactPhone = 'Contact phone is required';
    }

    if (step === 3) {
      if (!packageDescription.trim()) newErrors.packageDescription = 'Package description is required';

      if (!agreedAmount || amountNumber <= 0) {
        newErrors.agreedAmount = 'Please enter a valid amount';
      }

      if (amountNumber < 500) {
        newErrors.agreedAmount = 'Minimum delivery amount is ₦500';
      }

      if (amountNumber <= platformFee) {
        newErrors.agreedAmount = `Amount must be more than the platform fee of ₦${platformFee}`;
      }
    }

    if (step === 4) {
      if (!selectedRiderId) {
        newErrors.selectedRider = 'Please select a rider before creating this delivery';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (step < 4) {
        setStep(step + 1);
      } else {
        setShowConfirmDialog(true);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      showToast('error', 'Error', 'Please sign in first');
      return;
    }

    if (!selectedRiderId) {
      showToast('error', 'No rider selected', 'Please go back and choose a rider first');
      setShowConfirmDialog(false);
      navigate('/find-riders');
      return;
    }

    if ((wallet?.available_balance || 0) < amountNumber) {
      showToast('error', 'Insufficient balance', 'Please fund your wallet first');
      setShowConfirmDialog(false);
      navigate('/wallet');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: job, error: jobError } = await supabase
        .from('dispatch_jobs')
        .insert({
          customer_id: user.id,
          rider_id: selectedRiderId,
          pickup_address: pickupAddress,
          pickup_contact_name: pickupContactName,
          pickup_contact_phone: pickupContactPhone,
          pickup_notes: pickupNotes || null,
          delivery_address: deliveryAddress,
          delivery_contact_name: deliveryContactName,
          delivery_contact_phone: deliveryContactPhone,
          delivery_notes: deliveryNotes || null,
          package_description: packageDescription,
          package_weight_kg: packageWeight ? parseFloat(packageWeight) : null,
          agreed_amount: amountNumber,
          platform_fee: platformFee,
          rider_earnings: riderEarnings,
          status: 'awaiting_rider',
        })
        .select()
        .single();

      if (jobError) throw jobError;

      showToast(
        'success',
        'Delivery created!',
        'Your delivery request has been sent to the selected rider'
      );
      navigate(`/jobs/${job.id}`);
    } catch (error: any) {
      console.error('Error creating job:', error);
      showToast('error', 'Error', error.message || 'Failed to create delivery');
    } finally {
      setIsSubmitting(false);
      setShowConfirmDialog(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto bg-violet-100 rounded-full flex items-center justify-center mb-3">
                <MapPin className="w-6 h-6 text-violet-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Pickup Details</h3>
              <p className="text-gray-500">Where should the rider pick up the package?</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pickupAddress">Pickup Address *</Label>
                <Textarea
                  id="pickupAddress"
                  placeholder="Enter full address..."
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className={cn(errors.pickupAddress && 'border-red-500')}
                  rows={3}
                />
                {errors.pickupAddress && (
                  <p className="text-sm text-red-500">{errors.pickupAddress}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pickupContactName">Contact Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="pickupContactName"
                    placeholder="Who will hand over the package?"
                    value={pickupContactName}
                    onChange={(e) => setPickupContactName(e.target.value)}
                    className={cn('pl-10', errors.pickupContactName && 'border-red-500')}
                  />
                </div>
                {errors.pickupContactName && (
                  <p className="text-sm text-red-500">{errors.pickupContactName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pickupContactPhone">Contact Phone *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="pickupContactPhone"
                    type="tel"
                    placeholder="+234 800 000 0000"
                    value={pickupContactPhone}
                    onChange={(e) => setPickupContactPhone(e.target.value)}
                    className={cn('pl-10', errors.pickupContactPhone && 'border-red-500')}
                  />
                </div>
                {errors.pickupContactPhone && (
                  <p className="text-sm text-red-500">{errors.pickupContactPhone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pickupNotes">Additional Notes (Optional)</Label>
                <Textarea
                  id="pickupNotes"
                  placeholder="Any special instructions..."
                  value={pickupNotes}
                  onChange={(e) => setPickupNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto bg-violet-100 rounded-full flex items-center justify-center mb-3">
                <MapPin className="w-6 h-6 text-violet-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delivery Details</h3>
              <p className="text-gray-500">Where should the package be delivered?</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryAddress">Delivery Address *</Label>
                <Textarea
                  id="deliveryAddress"
                  placeholder="Enter full address..."
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className={cn(errors.deliveryAddress && 'border-red-500')}
                  rows={3}
                />
                {errors.deliveryAddress && (
                  <p className="text-sm text-red-500">{errors.deliveryAddress}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryContactName">Contact Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="deliveryContactName"
                    placeholder="Who will receive the package?"
                    value={deliveryContactName}
                    onChange={(e) => setDeliveryContactName(e.target.value)}
                    className={cn('pl-10', errors.deliveryContactName && 'border-red-500')}
                  />
                </div>
                {errors.deliveryContactName && (
                  <p className="text-sm text-red-500">{errors.deliveryContactName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryContactPhone">Contact Phone *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="deliveryContactPhone"
                    type="tel"
                    placeholder="+234 800 000 0000"
                    value={deliveryContactPhone}
                    onChange={(e) => setDeliveryContactPhone(e.target.value)}
                    className={cn('pl-10', errors.deliveryContactPhone && 'border-red-500')}
                  />
                </div>
                {errors.deliveryContactPhone && (
                  <p className="text-sm text-red-500">{errors.deliveryContactPhone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryNotes">Additional Notes (Optional)</Label>
                <Textarea
                  id="deliveryNotes"
                  placeholder="Any special instructions..."
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto bg-violet-100 rounded-full flex items-center justify-center mb-3">
                <Package className="w-6 h-6 text-violet-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Package Details</h3>
              <p className="text-gray-500">Tell us about the package and delivery fee</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="packageDescription">Package Description *</Label>
                <Textarea
                  id="packageDescription"
                  placeholder="What's in the package?"
                  value={packageDescription}
                  onChange={(e) => setPackageDescription(e.target.value)}
                  className={cn(errors.packageDescription && 'border-red-500')}
                  rows={3}
                />
                {errors.packageDescription && (
                  <p className="text-sm text-red-500">{errors.packageDescription}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="packageWeight">Weight (kg) - Optional</Label>
                <Input
                  id="packageWeight"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 2.5"
                  value={packageWeight}
                  onChange={(e) => setPackageWeight(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agreedAmount">Delivery Fee (₦) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    ₦
                  </span>
                  <Input
                    id="agreedAmount"
                    type="number"
                    placeholder="Amount you agree to pay"
                    value={agreedAmount}
                    onChange={(e) => setAgreedAmount(e.target.value)}
                    className={cn('pl-8', errors.agreedAmount && 'border-red-500')}
                  />
                </div>
                {errors.agreedAmount && (
                  <p className="text-sm text-red-500">{errors.agreedAmount}</p>
                )}
                <p className="text-sm text-gray-500">
                  Minimum: ₦500. Platform fee of ₦{platformFee} will be deducted.
                </p>
              </div>

              {isLoadingPlatformFee && (
                <p className="text-sm text-gray-500">Loading platform fee...</p>
              )}

              {agreedAmount && amountNumber > 0 && (
                <Card className="bg-violet-50 border-violet-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Info className="w-5 h-5 text-violet-600" />
                      <span className="font-medium text-violet-900">Cost Breakdown</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delivery Fee</span>
                        <span className="font-medium">{formatCurrency(amountNumber)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Platform Fee</span>
                        <span className="font-medium text-red-600">
                          -{formatCurrency(platformFee)}
                        </span>
                      </div>
                      <div className="border-t border-violet-200 pt-2 flex justify-between">
                        <span className="font-medium text-gray-900">Rider Receives</span>
                        <span className="font-bold text-violet-700">
                          {formatCurrency(riderEarnings)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Review & Confirm</h3>
              <p className="text-gray-500">Double-check your delivery details</p>
            </div>

            <div className="space-y-4">
              {!selectedRiderId && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <p className="text-sm text-red-700 font-medium">
                      No rider selected. Please go back and choose a rider first.
                    </p>
                  </CardContent>
                </Card>
              )}

              {selectedRiderId && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Selected Rider</h4>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-700">
                        <span className="font-medium">Name:</span>{' '}
                        {selectedRiderName || 'Selected rider'}
                      </p>
                      {selectedRiderCompanyName && (
                        <p className="text-gray-700">
                          <span className="font-medium">Company:</span> {selectedRiderCompanyName}
                        </p>
                      )}
                      {selectedRiderVehicleType && (
                        <p className="text-gray-700">
                          <span className="font-medium">Vehicle:</span>{' '}
                          <span className="capitalize">{selectedRiderVehicleType}</span>
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-violet-600" />
                    Pickup
                  </h4>
                  <p className="text-gray-700">{pickupAddress}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {pickupContactName} • {pickupContactPhone}
                  </p>
                  {pickupNotes && (
                    <p className="text-sm text-gray-500 mt-1">Note: {pickupNotes}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-600" />
                    Delivery
                  </h4>
                  <p className="text-gray-700">{deliveryAddress}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {deliveryContactName} • {deliveryContactPhone}
                  </p>
                  {deliveryNotes && (
                    <p className="text-sm text-gray-500 mt-1">Note: {deliveryNotes}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-600" />
                    Package
                  </h4>
                  <p className="text-gray-700">{packageDescription}</p>
                  {packageWeight && (
                    <p className="text-sm text-gray-500 mt-1">Weight: {packageWeight} kg</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-violet-50 border-violet-200">
                <CardContent className="p-4">
                  <h4 className="font-medium text-violet-900 mb-3 flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Payment
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount</span>
                      <span className="font-bold text-violet-900">
                        {formatCurrency(amountNumber)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Platform Fee</span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency(platformFee)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rider Receives</span>
                      <span className="font-medium text-violet-700">
                        {formatCurrency(riderEarnings)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">From Wallet</span>
                      <span className="text-gray-500">
                        {formatCurrency(wallet?.available_balance || 0)} available
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {errors.selectedRider && (
                <p className="text-sm text-red-500">{errors.selectedRider}</p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={cn(
              'w-3 h-3 rounded-full transition-colors',
              s <= step ? 'bg-violet-600' : 'bg-gray-200'
            )}
          />
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          {renderStep()}

          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={isLoadingPlatformFee}
              className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white"
            >
              {step === 4 ? (
                <>Create Delivery</>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delivery</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              You are about to create a delivery for <strong>{formatCurrency(amountNumber)}</strong>.
              This amount will be reserved from your wallet.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> The funds will be locked in escrow until the delivery is
                completed.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || isLoadingPlatformFee}
                className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </div>
                ) : (
                  'Confirm & Create'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
