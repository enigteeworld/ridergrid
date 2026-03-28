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
  Wallet,
  FileText,
  Sparkles,
  ShieldCheck,
  ChevronRight,
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

type JobDispute = {
  id: string;
  status: 'open' | 'under_review' | 'resolved' | 'closed';
  dispute_type: string;
  description: string;
  resolution_notes: string | null;
  created_at: string;
  updated_at?: string | null;
  resolved_at?: string | null;
};

export function JobDetailsPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user, wallet, setWallet } = useAuthStore();

  const [job, setJob] = useState<JobDetails | null>(null);
  const [deliveryProofs, setDeliveryProofs] = useState<any[]>([]);
  const [existingRating, setExistingRating] = useState<Rating | null>(null);
  const [existingDispute, setExistingDispute] = useState<JobDispute | null>(null);
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

      const { data: disputeData, error: disputeError } = await supabase
        .from('disputes')
        .select('*')
        .eq('dispatch_job_id', jobId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (disputeError) {
        console.error('Error fetching dispute:', disputeError);
      } else if (disputeData) {
        setExistingDispute({
          id: disputeData.id,
          status: (disputeData.status || 'open').toLowerCase(),
          dispute_type: disputeData.dispute_type || 'other',
          description: disputeData.description || '',
          resolution_notes: disputeData.resolution_notes || null,
          created_at: disputeData.created_at,
          updated_at: disputeData.updated_at || null,
          resolved_at: disputeData.resolved_at || null,
        });
      } else {
        setExistingDispute(null);
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
        response.message ||
          'Funds have been locked in escrow. The rider can now begin the delivery.'
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
      const { data: openCase, error: openCaseError } = await supabase
        .from('disputes')
        .select('id, status')
        .eq('dispatch_job_id', job.id)
        .in('status', ['open', 'under_review'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (openCaseError) throw openCaseError;

      if (openCase) {
        showToast(
          'info',
          'Support case already open',
          'There is already an active support case for this delivery.'
        );
        await fetchJobDetails();
        setShowDisputeDialog(false);
        return;
      }

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

      showToast(
        'success',
        'Support case opened',
        'Your issue has been submitted for admin review. Refunds, if approved, are handled manually.'
      );

      setShowDisputeDialog(false);
      setDisputeReason('');
      setDisputeDescription('');
      await fetchJobDetails();
    } catch (error: any) {
      console.error('Dispute error:', error);
      showToast('error', 'Error', error.message || 'Failed to open support case');
    } finally {
      setShowDisputeDialog(false);
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
      { status: 'funded', label: 'Funded', icon: Wallet },
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

  const getDisputeBadgeClass = (status: string) => {
    const styles: Record<string, string> = {
      open: 'bg-red-100 text-red-700',
      under_review: 'bg-amber-100 text-amber-700',
      resolved: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const formatDisputeText = (value: string) =>
    value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

  const getAccentGradient = (status: string) => {
    switch (status) {
      case 'completed':
        return 'from-emerald-400 to-green-500';
      case 'in_progress':
      case 'rider_marked_complete':
        return 'from-blue-400 to-cyan-500';
      case 'awaiting_rider':
      case 'awaiting_funding':
      case 'funded':
        return 'from-violet-500 to-fuchsia-500';
      case 'cancelled':
      case 'refunded':
      case 'disputed':
        return 'from-rose-400 to-red-500';
      default:
        return 'from-gray-300 to-gray-400';
    }
  };

  const InfoCard = ({
    title,
    icon: Icon,
    iconClassName,
    accent,
    children,
  }: {
    title: string;
    icon: React.ElementType;
    iconClassName: string;
    accent: string;
    children: React.ReactNode;
  }) => (
    <Card className="group relative overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]">
      <div className={cn('absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b', accent)} />
      <CardContent className="p-5 pl-6 sm:p-6 sm:pl-7">
        <div className="mb-4 flex items-center gap-3">
          <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl', iconClassName)}>
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold tracking-tight text-gray-900">{title}</h3>
        </div>
        {children}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-violet-600" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="py-12 text-center">
        <AlertCircle className="mx-auto mb-4 h-16 w-16 text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-900">Delivery not found</h2>
        <Button onClick={() => navigate('/jobs')} className="mt-4">
          Back to My Deliveries
        </Button>
      </div>
    );
  }

  const { steps, currentIndex } = getStatusStep(job.status);

  return (
    <div className="space-y-7">
      <button
        onClick={() => navigate('/jobs')}
        className="inline-flex items-center gap-2 text-gray-500 transition-colors hover:text-gray-700"
      >
        <ArrowLeft className="h-5 w-5" />
        Back to My Deliveries
      </button>

      <div className="relative overflow-hidden rounded-[32px] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50/70 p-5 shadow-sm sm:p-6">
        <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-violet-200/25 blur-3xl" />
        <div className="absolute -bottom-14 left-8 h-32 w-32 rounded-full bg-fuchsia-200/20 blur-3xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-violet-700 ring-1 ring-violet-100 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Delivery Details
            </div>

            <h1 className="break-words text-3xl font-bold tracking-tight text-gray-950">
              {job.job_number}
            </h1>
            <p className="mt-2 text-sm text-gray-600">Created {formatDateTime(job.created_at)}</p>
          </div>

          <span
            className={cn(
              'inline-flex self-start rounded-full px-3 py-1 text-sm font-medium shadow-sm',
              getStatusColorClass(job.status)
            )}
          >
            {formatJobStatus(job.status)}
          </span>
        </div>
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
        <Card className="overflow-hidden rounded-[28px] border-violet-100 bg-gradient-to-br from-violet-50/80 via-white to-fuchsia-50/50 shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delivery Progress</h3>
                <p className="text-sm text-gray-500">Track where this delivery currently stands</p>
              </div>
            </div>

            <div className="sm:hidden">
              <div className="space-y-4">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index <= currentIndex;
                  const isCurrent = index === currentIndex;
                  const isLast = index === steps.length - 1;

                  return (
                    <div key={step.status} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors',
                            isActive ? 'bg-violet-600 text-white' : 'bg-white text-gray-400 ring-1 ring-gray-200',
                            isCurrent && 'ring-4 ring-violet-100'
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        {!isLast && (
                          <div
                            className={cn(
                              'mt-2 h-9 w-0.5 rounded-full',
                              index < currentIndex ? 'bg-violet-600' : 'bg-gray-200'
                            )}
                          />
                        )}
                      </div>

                      <div className="pt-1">
                        <p
                          className={cn(
                            'text-sm',
                            isActive ? 'font-semibold text-gray-900' : 'text-gray-400'
                          )}
                        >
                          {step.label}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {isCurrent
                            ? 'Current step'
                            : index < currentIndex
                            ? 'Completed'
                            : 'Pending'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="hidden sm:block">
              <div className="relative">
                <div className="absolute left-0 right-0 top-5 h-1 rounded-full bg-gray-200" />
                <div
                  className="absolute left-0 top-5 h-1 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 transition-all"
                  style={{
                    width: `${steps.length > 1 ? (currentIndex / (steps.length - 1)) * 100 : 0}%`,
                  }}
                />

                <div className="relative flex items-start justify-between gap-3">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = index <= currentIndex;
                    const isCurrent = index === currentIndex;

                    return (
                      <div
                        key={step.status}
                        className="flex min-w-[92px] flex-col items-center text-center"
                      >
                        <div
                          className={cn(
                            'flex h-11 w-11 items-center justify-center rounded-full border-4 bg-white transition-colors',
                            isActive
                              ? 'border-violet-600 text-violet-600'
                              : 'border-gray-200 text-gray-400',
                            isCurrent && 'ring-4 ring-violet-100'
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <span
                          className={cn(
                            'mt-3 text-xs',
                            isActive ? 'font-medium text-gray-900' : 'text-gray-400'
                          )}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {existingDispute && (
        <Card className="overflow-hidden rounded-[28px] border-amber-200 bg-gradient-to-br from-amber-50/80 via-white to-orange-50/50 shadow-sm">
          <CardContent className="space-y-4 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-gray-500">Current support case</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {formatDisputeText(existingDispute.dispute_type)}
                </p>
              </div>

              <span
                className={cn(
                  'inline-flex self-start rounded-full px-2.5 py-1 text-xs font-medium',
                  getDisputeBadgeClass(existingDispute.status)
                )}
              >
                {formatDisputeText(existingDispute.status)}
              </span>
            </div>

            <div className="rounded-2xl bg-white/80 p-4 ring-1 ring-amber-100">
              <p className="mb-2 text-sm font-medium text-gray-500">Your message</p>
              <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {existingDispute.description}
              </p>
            </div>

            {existingDispute.resolution_notes && (
              <div className="rounded-2xl bg-white/80 p-4 ring-1 ring-amber-100">
                <p className="mb-2 text-sm font-medium text-gray-500">Admin update</p>
                <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                  {existingDispute.resolution_notes}
                </p>
              </div>
            )}

            <div className="text-xs text-gray-500">
              Opened {formatDateTime(existingDispute.created_at)}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <InfoCard
          title="Pickup"
          icon={MapPin}
          iconClassName="bg-violet-50 text-violet-600"
          accent="from-violet-500 to-fuchsia-500"
        >
          <p className="break-words text-gray-700">{job.pickup_address}</p>

          <div className="mt-4 space-y-2 text-sm text-gray-500">
            <p className="flex items-start gap-2">
              <User className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="break-words">{job.pickup_contact_name}</span>
            </p>
            <p className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="break-words">{job.pickup_contact_phone}</span>
            </p>
          </div>

          {job.pickup_notes && (
            <div className="mt-4 rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
                Notes
              </p>
              <p className="mt-2 break-words text-sm leading-6 text-gray-600">{job.pickup_notes}</p>
            </div>
          )}
        </InfoCard>

        <InfoCard
          title="Delivery"
          icon={MapPin}
          iconClassName="bg-emerald-50 text-green-600"
          accent="from-emerald-400 to-green-500"
        >
          <p className="break-words text-gray-700">{job.delivery_address}</p>

          <div className="mt-4 space-y-2 text-sm text-gray-500">
            <p className="flex items-start gap-2">
              <User className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="break-words">{job.delivery_contact_name}</span>
            </p>
            <p className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="break-words">{job.delivery_contact_phone}</span>
            </p>
          </div>

          {job.delivery_notes && (
            <div className="mt-4 rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
                Notes
              </p>
              <p className="mt-2 break-words text-sm leading-6 text-gray-600">
                {job.delivery_notes}
              </p>
            </div>
          )}
        </InfoCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <InfoCard
          title="Package Details"
          icon={Package}
          iconClassName="bg-amber-50 text-amber-600"
          accent="from-amber-400 to-orange-500"
        >
          <p className="break-words text-gray-700">{job.package_description}</p>

          {job.package_weight_kg && (
            <div className="mt-4 rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
                Weight
              </p>
              <p className="mt-2 text-sm text-gray-700">{job.package_weight_kg} kg</p>
            </div>
          )}
        </InfoCard>

        <InfoCard
          title="Payment"
          icon={Wallet}
          iconClassName="bg-violet-50 text-violet-600"
          accent="from-violet-500 to-fuchsia-500"
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <span className="text-gray-600">Delivery Fee</span>
              <span className="text-right font-medium">{formatCurrency(job.agreed_amount)}</span>
            </div>

            <div className="flex items-start justify-between gap-3">
              <span className="text-gray-600">Platform Fee</span>
              <span className="text-right font-medium text-red-600">
                -{formatCurrency(job.platform_fee)}
              </span>
            </div>

            <div className="flex items-start justify-between gap-3 rounded-2xl bg-violet-50 p-4">
              <span className="font-medium text-gray-900">Rider Receives</span>
              <span className="text-right text-lg font-bold text-violet-700">
                {formatCurrency(job.rider_earnings)}
              </span>
            </div>
          </div>
        </InfoCard>
      </div>

      {job.rider_name && (
        <Card className="group relative overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]">
          <div className={cn('absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b', getAccentGradient(job.status))} />
          <CardContent className="p-5 pl-6 sm:p-6 sm:pl-7">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                <User className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-gray-900">Rider</h3>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 text-xl font-medium text-white shadow-md">
                  {job.rider_name.charAt(0)}
                </div>

                <div className="min-w-0">
                  <p className="break-words font-medium text-gray-900">{job.rider_name}</p>
                  <p className="break-words text-sm text-gray-500">{job.rider_phone}</p>
                </div>
              </div>

              <div className="flex gap-2 sm:ml-auto">
                <a href={`tel:${job.rider_phone}`} className="flex-1 sm:flex-none">
                  <Button
                    variant="outline"
                    className="w-full rounded-xl border-green-200 bg-green-50 text-green-700 hover:bg-green-100 sm:w-auto"
                    size="icon"
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                </a>

                <a
                  href={`https://wa.me/${job.rider_phone?.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none"
                >
                  <Button
                    variant="outline"
                    className="w-full rounded-xl border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 sm:w-auto"
                    size="icon"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {deliveryProofs.length > 0 && (
        <Card className="overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          <CardContent className="p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Camera className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-gray-900">Delivery Proof</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {deliveryProofs.map((proof, index) => (
                <div
                  key={proof.id}
                  className="aspect-square overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-gray-100"
                >
                  {proof.image_url ? (
                    <img
                      src={proof.image_url}
                      alt={`Proof ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden rounded-[28px] border-violet-100 bg-gradient-to-br from-violet-50/80 via-white to-fuchsia-50/50 shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
            <p className="mt-1 text-sm text-gray-500">Manage this delivery based on its current status</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:flex xl:flex-wrap">
            {job.status === 'awaiting_funding' && (
              <Button
                onClick={handleFundDelivery}
                disabled={isFunding}
                className="h-12 w-full rounded-2xl bg-violet-600 text-white hover:bg-violet-700 sm:w-auto"
              >
                {isFunding ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Funding...
                  </div>
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    Fund Delivery
                  </>
                )}
              </Button>
            )}

            {job.status === 'rider_marked_complete' && (
              <Button
                onClick={handleMarkComplete}
                disabled={isConfirmingCompletion}
                className="h-12 w-full rounded-2xl bg-green-600 text-white hover:bg-green-700 sm:w-auto"
              >
                {isConfirmingCompletion ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Confirming...
                  </div>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirm Delivery
                  </>
                )}
              </Button>
            )}

            {['awaiting_rider', 'awaiting_funding'].includes(job.status) && (
              <Button
                onClick={handleCancelJob}
                variant="outline"
                className="h-12 w-full rounded-2xl border-red-200 text-red-600 hover:bg-red-50 sm:w-auto"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Delivery
              </Button>
            )}

            {job.status === 'completed' && !existingRating && (
              <Button
                onClick={() => setShowRatingDialog(true)}
                className="h-12 w-full rounded-2xl bg-violet-600 text-white hover:bg-violet-700 sm:w-auto"
              >
                <Star className="mr-2 h-4 w-4" />
                Rate Rider
              </Button>
            )}

            {['in_progress', 'rider_marked_complete'].includes(job.status) && !existingDispute && (
              <Button
                onClick={() => setShowDisputeDialog(true)}
                variant="outline"
                className="h-12 w-full rounded-2xl border-amber-200 text-amber-700 hover:bg-amber-50 sm:w-auto"
              >
                <FileText className="mr-2 h-4 w-4" />
                Open Support Case
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent className="overflow-hidden rounded-[28px] border-0 p-0 shadow-2xl sm:max-w-md">
          <div className="bg-gradient-to-br from-violet-50 via-white to-fuchsia-50/70 p-6">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-2xl font-bold tracking-tight text-gray-950">
                Rate Your Delivery
              </DialogTitle>
            </DialogHeader>

            <p className="mt-2 text-sm text-gray-500">
              Share how the rider handled your delivery experience.
            </p>

            <div className="mt-6 space-y-5">
              <div className="flex flex-wrap justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="rounded-xl p-1 transition-transform hover:scale-105"
                  >
                    <Star
                      className={cn(
                        'h-9 w-9 transition-colors',
                        star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
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
                className="rounded-2xl border-violet-100 bg-white"
              />

              <Button
                onClick={handleSubmitRating}
                className="h-12 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
              >
                Submit Rating
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDisputeDialog} onOpenChange={setShowDisputeDialog}>
        <DialogContent className="overflow-hidden rounded-[28px] border-0 p-0 shadow-2xl sm:max-w-md">
          <div className="bg-gradient-to-br from-amber-50 via-white to-orange-50/70 p-6">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-2xl font-bold tracking-tight text-gray-950">
                Open Support Case
              </DialogTitle>
            </DialogHeader>

            <div className="mt-5 rounded-2xl border border-amber-200 bg-white/80 p-4">
              <p className="text-sm leading-6 text-amber-900">
                This opens a manual review by admin. Refunds are not automatic and are handled only
                if approved after case review.
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Issue Type</label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="mt-1 h-12 w-full rounded-2xl border border-amber-200 bg-white px-3 text-sm outline-none transition focus:border-amber-400"
                >
                  <option value="">Select an issue</option>
                  <option value="not_delivered">Package not delivered</option>
                  <option value="damaged">Package damaged</option>
                  <option value="wrong_item">Wrong item delivered</option>
                  <option value="rider_no_show">Rider didn&apos;t show up</option>
                  <option value="refund_request">Refund request</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <Textarea
                placeholder="Describe the issue clearly. Include what happened, what you expected, and whether you are requesting a refund..."
                value={disputeDescription}
                onChange={(e) => setDisputeDescription(e.target.value)}
                rows={5}
                className="rounded-2xl border-amber-200 bg-white"
              />

              <Button
                onClick={handleOpenDispute}
                disabled={!disputeDescription.trim()}
                className="h-12 w-full rounded-2xl bg-amber-600 text-white hover:bg-amber-700"
              >
                Submit Support Case
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
