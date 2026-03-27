// ============================================
// DISPATCH NG - Job Details Page (Customer)
// ============================================

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Package,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  MessageCircle,
  Camera,
  ArrowLeft,
  XCircle,
  HelpCircle,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { showToast } from '@/stores/uiStore';
import type { JobDetails, Rating, Wallet as WalletType } from '@/types';
import {
  formatCurrency,
  formatDateTime,
  getStatusColorClass,
  formatJobStatus,
} from '@/utils/format';
import { cn } from '@/lib/utils';

type RpcResponse = {
  ok?: boolean;
  status?: string;
  message?: string;
};

export function JobDetailsPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user, wallet, setWallet } = useAuthStore();

  const [job, setJob] = useState<JobDetails | null>(null);
  const [deliveryProofs, setDeliveryProofs] = useState<any[]>([]);
  const [existingRating, setExistingRating] = useState<Rating | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFunding, setIsFunding] = useState(false);
  const [isConfirmingCompletion, setIsConfirmingCompletion] = useState(false);

  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);

  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');

  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDescription, setDisputeDescription] = useState('');

  useEffect(() => {
    if (jobId) {
      void fetchJobDetails();
    }
  }, [jobId]);

  const fetchCustomerWallet = async (): Promise<WalletType | null> => {
    if (!user?.id) return null;

    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching customer wallet:', error);
      return null;
    }

    return data ?? null;
  };

  const syncCustomerWallet = async () => {
    const latestWallet = await fetchCustomerWallet();
    if (latestWallet) {
      setWallet(latestWallet);
    }
  };

  const fetchJobDetails = async () => {
    try {
      setIsLoading(true);

      const { data: jobData, error: jobError } = await supabase
        .from('job_details')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;
      setJob(jobData);

      const { data: proofsData, error: proofsError } = await supabase
        .from('delivery_proofs')
        .select('*')
        .eq('dispatch_job_id', jobId);

      if (proofsError) {
        console.error('Error fetching delivery proofs:', proofsError);
      } else {
        setDeliveryProofs(proofsData ?? []);
      }

      const { data: ratingData, error: ratingError } = await supabase
        .from('ratings')
        .select('*')
        .eq('dispatch_job_id', jobId)
        .maybeSingle();

      if (ratingError) {
        console.error('Error fetching rating:', ratingError);
      } else if (ratingData) {
        setExistingRating(ratingData);
      } else {
        setExistingRating(null);
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      showToast('error', 'Error', 'Failed to load delivery details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFundDelivery = async () => {
    if (!job || !wallet || !user) return;

    if (job.status !== 'awaiting_funding') {
      showToast('info', 'Already updated', 'This delivery is no longer waiting for funding.');
      await fetchJobDetails();
      await syncCustomerWallet();
      return;
    }

    if ((wallet.available_balance || 0) < job.agreed_amount) {
      showToast(
        'error',
        'Insufficient balance',
        'Please fund your wallet before funding this delivery'
      );
      navigate('/wallet');
      return;
    }

    setIsFunding(true);

    try {
      const { data, error } = await supabase.rpc('fund_delivery_escrow', {
        p_job_id: job.id,
      });

      if (error) throw error;

      const response = (data ?? {}) as RpcResponse;

      await syncCustomerWallet();
      await fetchJobDetails();

      showToast(
        'success',
        'Delivery funded',
        response.message || 'Funds have been locked in escrow. The rider can now begin the delivery.'
      );
    } catch (error: any) {
      console.error('Funding error:', error);
      showToast('error', 'Error', error.message || 'Failed to fund delivery');
    } finally {
      setIsFunding(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!job) return;

    if (job.status === 'completed') {
      showToast('info', 'Already completed', 'This delivery has already been completed.');
      if (!existingRating) {
        setShowRatingDialog(true);
      }
      return;
    }

    if (job.status !== 'rider_marked_complete') {
      showToast(
        'warning',
        'Cannot complete yet',
        'The rider needs to mark this delivery as complete first.'
      );
      await fetchJobDetails();
      return;
    }

    setIsConfirmingCompletion(true);

    try {
      const { data, error } = await supabase.rpc('complete_delivery_and_settle', {
        p_job_id: job.id,
      });

      if (error) throw error;

      const response = (data ?? {}) as RpcResponse;

      await syncCustomerWallet();
      await fetchJobDetails();

      showToast(
        'success',
        'Delivery completed',
        response.message || 'Escrow has been released and the rider has been credited.'
      );

      setShowRatingDialog(true);
    } catch (error: any) {
      console.error('Completion error:', error);
      showToast('error', 'Error', error.message || 'Failed to complete delivery');
    } finally {
      setIsConfirmingCompletion(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!job || !job.rider_id || !user?.id) return;

    try {
      const { error } = await supabase.from('ratings').insert({
        dispatch_job_id: job.id,
        rider_id: job.rider_id,
        customer_id: user.id,
        rating,
        review: review.trim() || null,
      });

      if (error) throw error;

      showToast('success', 'Thank you!', 'Your rating has been submitted');
      setShowRatingDialog(false);
      await fetchJobDetails();
    } catch (error: any) {
      showToast('error', 'Error', error.message || 'Failed to submit rating');
    }
  };

  const handleOpenDispute = async () => {
    if (!job || !disputeDescription.trim() || !user?.id) return;

    try {
      const { error } = await supabase.from('disputes').insert({
        dispatch_job_id: job.id,
        raised_by: user.id,
        dispute_type: disputeReason || 'other',
        description: disputeDescription.trim(),
      });

      if (error) throw error;

      const { error: jobError } = await supabase
        .from('dispatch_jobs')
        .update({ status: 'disputed' })
        .eq('id', job.id);

      if (jobError) throw jobError;

      showToast('success', 'Dispute filed', 'We will review your case');
      setShowDisputeDialog(false);
      setDisputeReason('');
      setDisputeDescription('');
      await fetchJobDetails();
    } catch (error: any) {
      showToast('error', 'Error', error.message || 'Failed to open dispute');
    }
  };

  const handleCancelJob = async () => {
    if (!job || !user?.id) return;

    try {
      const { error } = await supabase
        .from('dispatch_jobs')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: user.id,
          cancellation_reason: 'Cancelled by customer',
        })
        .eq('id', job.id);

      if (error) throw error;

      showToast('success', 'Cancelled', 'Your delivery has been cancelled');
      await fetchJobDetails();
    } catch (error: any) {
      showToast('error', 'Error', error.message || 'Failed to cancel delivery');
    }
  };

  const getStatusStep = (status: string) => {
    const steps = [
      { status: 'awaiting_rider', label: 'Posted', icon: Package },
      { status: 'awaiting_funding', label: 'Assigned', icon: User },
      { status: 'funded', label: 'Funded', icon: CheckCircle },
      { status: 'in_progress', label: 'In Progress', icon: Clock },
      { status: 'completed', label: 'Completed', icon: CheckCircle },
    ];

    const normalizedStatus =
      status === 'rider_marked_complete' || status === 'customer_marked_complete'
        ? 'in_progress'
        : status;

    const currentIndex = steps.findIndex((s) => s.status === normalizedStatus);
    return { steps, currentIndex: currentIndex >= 0 ? currentIndex : 0 };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Delivery not found</h2>
        <Button onClick={() => navigate('/jobs')} className="mt-4">
          Back to My Deliveries
        </Button>
      </div>
    );
  }

  const { steps, currentIndex } = getStatusStep(job.status);

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/jobs')}
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to My Deliveries
      </button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 break-words">{job.job_number}</h1>
          <p className="text-gray-500">Created {formatDateTime(job.created_at)}</p>
        </div>

        <span
          className={cn(
            'inline-flex self-start px-3 py-1 rounded-full text-sm font-medium',
            getStatusColorClass(job.status)
          )}
        >
          {formatJobStatus(job.status)}
        </span>
      </div>

      {[
        'awaiting_rider',
        'awaiting_funding',
        'funded',
        'in_progress',
        'rider_marked_complete',
        'customer_marked_complete',
        'completed',
      ].includes(job.status) && (
        <Card>
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <div className="flex min-w-[560px] items-start justify-between gap-3">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index <= currentIndex;
                  const isCurrent = index === currentIndex;

                  return (
                    <div key={step.status} className="flex min-w-[92px] flex-col items-center text-center">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                          isActive ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-400',
                          isCurrent && 'ring-4 ring-violet-100'
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span
                        className={cn(
                          'text-xs mt-2',
                          isActive ? 'text-gray-900 font-medium' : 'text-gray-400'
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-4 sm:p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-violet-600" />
              Pickup
            </h3>

            <p className="text-gray-700 break-words">{job.pickup_address}</p>

            <div className="mt-3 space-y-2 text-sm text-gray-500">
              <p className="flex items-start gap-2">
                <User className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="break-words">{job.pickup_contact_name}</span>
              </p>
              <p className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="break-words">{job.pickup_contact_phone}</span>
              </p>
            </div>

            {job.pickup_notes && (
              <p className="mt-3 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg break-words">
                Note: {job.pickup_notes}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              Delivery
            </h3>

            <p className="text-gray-700 break-words">{job.delivery_address}</p>

            <div className="mt-3 space-y-2 text-sm text-gray-500">
              <p className="flex items-start gap-2">
                <User className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="break-words">{job.delivery_contact_name}</span>
              </p>
              <p className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="break-words">{job.delivery_contact_phone}</span>
              </p>
            </div>

            {job.delivery_notes && (
              <p className="mt-3 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg break-words">
                Note: {job.delivery_notes}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-4 sm:p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-600" />
              Package Details
            </h3>

            <p className="text-gray-700 break-words">{job.package_description}</p>

            {job.package_weight_kg && (
              <p className="mt-2 text-sm text-gray-500">Weight: {job.package_weight_kg} kg</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Payment</h3>

            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <span className="text-gray-600">Delivery Fee</span>
                <span className="font-medium text-right">{formatCurrency(job.agreed_amount)}</span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <span className="text-gray-600">Platform Fee</span>
                <span className="font-medium text-red-600 text-right">
                  -{formatCurrency(job.platform_fee)}
                </span>
              </div>

              <div className="border-t pt-3 flex items-start justify-between gap-3">
                <span className="font-medium text-gray-900">Rider Receives</span>
                <span className="font-bold text-violet-700 text-right">
                  {formatCurrency(job.rider_earnings)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {job.rider_name && (
        <Card>
          <CardContent className="p-4 sm:p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Rider</h3>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center text-white text-xl font-medium shrink-0">
                  {job.rider_name.charAt(0)}
                </div>

                <div className="min-w-0">
                  <p className="font-medium text-gray-900 break-words">{job.rider_name}</p>
                  <p className="text-sm text-gray-500 break-words">{job.rider_phone}</p>
                </div>
              </div>

              <div className="flex gap-2 sm:ml-auto">
                <a href={`tel:${job.rider_phone}`} className="flex-1 sm:flex-none">
                  <Button variant="outline" className="w-full sm:w-auto" size="icon">
                    <Phone className="w-4 h-4" />
                  </Button>
                </a>

                <a
                  href={`https://wa.me/${job.rider_phone?.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none"
                >
                  <Button variant="outline" className="w-full sm:w-auto" size="icon">
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {deliveryProofs.length > 0 && (
        <Card>
          <CardContent className="p-4 sm:p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Delivery Proof
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {deliveryProofs.map((proof, index) => (
                <div key={proof.id} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  {proof.image_url ? (
                    <img
                      src={proof.image_url}
                      alt={`Proof ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:flex xl:flex-wrap gap-3">
        {job.status === 'awaiting_funding' && (
          <Button
            onClick={handleFundDelivery}
            disabled={isFunding}
            className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white"
          >
            {isFunding ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Funding...
              </div>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                Fund Delivery
              </>
            )}
          </Button>
        )}

        {job.status === 'rider_marked_complete' && (
          <Button
            onClick={handleMarkComplete}
            disabled={isConfirmingCompletion}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
          >
            {isConfirmingCompletion ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Confirming...
              </div>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm Delivery
              </>
            )}
          </Button>
        )}

        {['awaiting_rider', 'awaiting_funding'].includes(job.status) && (
          <Button
            onClick={handleCancelJob}
            variant="outline"
            className="w-full sm:w-auto text-red-600 border-red-200 hover:bg-red-50"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Cancel Delivery
          </Button>
        )}

        {job.status === 'completed' && !existingRating && (
          <Button
            onClick={() => setShowRatingDialog(true)}
            className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white"
          >
            <Star className="w-4 h-4 mr-2" />
            Rate Rider
          </Button>
        )}

        {['in_progress', 'rider_marked_complete'].includes(job.status) && (
          <Button
            onClick={() => setShowDisputeDialog(true)}
            variant="outline"
            className="w-full sm:w-auto text-amber-600 border-amber-200 hover:bg-amber-50"
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            Report Issue
          </Button>
        )}
      </div>

      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rate Your Delivery</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-center gap-2 flex-wrap">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)} className="p-1">
                  <Star
                    className={cn(
                      'w-8 h-8 transition-colors',
                      star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                    )}
                  />
                </button>
              ))}
            </div>

            <Textarea
              placeholder="Share your experience (optional)..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
            />

            <Button
              onClick={handleSubmitRating}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            >
              Submit Rating
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDisputeDialog} onOpenChange={setShowDisputeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report an Issue</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Issue Type</label>
              <select
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="w-full mt-1 p-2 border rounded-lg bg-white"
              >
                <option value="">Select an issue</option>
                <option value="not_delivered">Package not delivered</option>
                <option value="damaged">Package damaged</option>
                <option value="wrong_item">Wrong item delivered</option>
                <option value="rider_no_show">Rider didn&apos;t show up</option>
                <option value="other">Other</option>
              </select>
            </div>

            <Textarea
              placeholder="Describe the issue..."
              value={disputeDescription}
              onChange={(e) => setDisputeDescription(e.target.value)}
              rows={4}
            />

            <Button
              onClick={handleOpenDispute}
              disabled={!disputeDescription.trim()}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            >
              Submit Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
