// ============================================
// DISPATCH NG - Rider Job Details Page
// ============================================
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Package,
  CheckCircle,
  ArrowLeft,
  MessageCircle,
  Clock3,
  Wallet,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { showToast } from '@/stores/uiStore';
import type { JobDetails } from '@/types';
import {
  formatCurrency,
  formatDateTime,
  getStatusColorClass,
  formatJobStatus,
} from '@/utils/format';
import { cn } from '@/lib/utils';

export function RiderJobDetailsPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [job, setJob] = useState<JobDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    if (jobId) {
      void fetchJobDetails();
    }
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('job_details')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      setJob(data);
    } catch (error) {
      console.error('Error fetching job:', error);
      showToast('error', 'Error', 'Failed to load job details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkInProgress = async () => {
    if (!jobId || !job) return;

    if (job.status !== 'funded') {
      showToast('warning', 'Not ready', 'This delivery has not been funded yet.');
      await fetchJobDetails();
      return;
    }

    setIsStarting(true);

    try {
      const { error } = await supabase
        .from('dispatch_jobs')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      if (error) throw error;

      showToast('success', 'Started', 'Delivery marked as in progress');
      await fetchJobDetails();
    } catch (error: any) {
      showToast('error', 'Error', error.message || 'Failed to start delivery');
    } finally {
      setIsStarting(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!jobId || !job) return;

    if (job.status !== 'in_progress') {
      showToast('warning', 'Not ready', 'Only in-progress deliveries can be completed.');
      await fetchJobDetails();
      return;
    }

    setIsCompleting(true);

    try {
      const { error } = await supabase
        .from('dispatch_jobs')
        .update({
          status: 'rider_marked_complete',
          rider_completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      if (error) throw error;

      if (deliveryNotes.trim()) {
        const { error: proofError } = await supabase.from('delivery_proofs').insert({
          dispatch_job_id: jobId,
          proof_type: 'note',
          notes: deliveryNotes.trim(),
          uploaded_by: user?.id,
        });

        if (proofError) {
          console.error('Delivery proof insert error:', proofError);
        }
      }

      showToast(
        'success',
        'Marked complete',
        'Waiting for the customer to confirm delivery and release payment.'
      );

      setShowCompleteDialog(false);
      setDeliveryNotes('');
      await fetchJobDetails();
    } catch (error: any) {
      showToast('error', 'Error', error.message || 'Failed to complete delivery');
    } finally {
      setIsCompleting(false);
    }
  };

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
        <h2 className="text-xl font-semibold text-gray-900">Job not found</h2>
        <Button onClick={() => navigate('/rider/jobs')} className="mt-4">
          Back to Jobs
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <button
        onClick={() => navigate('/rider/jobs')}
        className="inline-flex items-center gap-2 text-gray-500 transition-colors hover:text-gray-700"
      >
        <ArrowLeft className="h-5 w-5" />
        Back to Jobs
      </button>

      <Card className="overflow-hidden rounded-[28px] border-violet-100 bg-gradient-to-br from-violet-50/70 via-white to-fuchsia-50/50 shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-violet-700 ring-1 ring-violet-100">
                  Rider Job
                </span>
                <span
                  className={cn(
                    'inline-flex self-start rounded-full px-3 py-1 text-sm font-medium',
                    getStatusColorClass(job.status)
                  )}
                >
                  {formatJobStatus(job.status)}
                </span>
              </div>

              <h1 className="break-words text-2xl font-bold tracking-tight text-gray-900">
                {job.job_number}
              </h1>

              <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                <Clock3 className="h-4 w-4" />
                <span>{formatDateTime(job.created_at)}</span>
              </div>
            </div>

            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-violet-100 sm:min-w-[160px] sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
                You Earn
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-violet-700">
                {formatCurrency(job.rider_earnings)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="group relative overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]">
          <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-violet-500 to-fuchsia-500" />
          <CardContent className="p-5 pl-6 sm:p-6 sm:pl-7">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
              <MapPin className="h-5 w-5 text-violet-600" />
              Pickup
            </h3>

            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="break-words text-gray-700">{job.pickup_address}</p>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
                  Contact Name
                </p>
                <p className="mt-1 break-words text-sm font-medium text-gray-700">
                  {job.pickup_contact_name}
                </p>
              </div>

              <a
                href={`tel:${job.pickup_contact_phone}`}
                className="flex items-start gap-2 rounded-2xl border border-violet-100 bg-violet-50 p-4 text-violet-700 transition-colors hover:bg-violet-100"
              >
                <Phone className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="break-all text-sm font-medium">{job.pickup_contact_phone}</span>
              </a>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]">
          <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-emerald-400 to-green-500" />
          <CardContent className="p-5 pl-6 sm:p-6 sm:pl-7">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
              <MapPin className="h-5 w-5 text-green-600" />
              Delivery
            </h3>

            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="break-words text-gray-700">{job.delivery_address}</p>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
                  Contact Name
                </p>
                <p className="mt-1 break-words text-sm font-medium text-gray-700">
                  {job.delivery_contact_name}
                </p>
              </div>

              <a
                href={`tel:${job.delivery_contact_phone}`}
                className="flex items-start gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                <Phone className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="break-all text-sm font-medium">{job.delivery_contact_phone}</span>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="group relative overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-amber-400 to-orange-500" />
        <CardContent className="p-5 pl-6 sm:p-6 sm:pl-7">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
            <Package className="h-5 w-5 text-amber-600" />
            Package Details
          </h3>

          <div className="rounded-2xl bg-amber-50 p-4">
            <p className="break-words text-gray-700">{job.package_description}</p>
          </div>

          {job.package_weight_kg && (
            <div className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-600 ring-1 ring-gray-100">
              Weight: {job.package_weight_kg} kg
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="group relative overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-violet-500 to-fuchsia-500" />
        <CardContent className="p-5 pl-6 sm:p-6 sm:pl-7">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
            <Wallet className="h-5 w-5 text-violet-600" />
            Earnings
          </h3>

          <div className="flex flex-col gap-2 rounded-2xl bg-violet-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-gray-600">You will receive</span>
            <span className="break-words text-3xl font-bold tracking-tight text-violet-700">
              {formatCurrency(job.rider_earnings)}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:flex xl:flex-wrap">
        {job.status === 'funded' && (
          <Button
            onClick={handleMarkInProgress}
            disabled={isStarting}
            className="h-12 w-full rounded-2xl bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
          >
            {isStarting ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Starting...
              </div>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Started
              </>
            )}
          </Button>
        )}

        {job.status === 'in_progress' && (
          <Button
            onClick={() => setShowCompleteDialog(true)}
            className="h-12 w-full rounded-2xl bg-green-600 text-white hover:bg-green-700 sm:w-auto"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark as Complete
          </Button>
        )}

        <a
          href={`https://wa.me/${job.customer_phone?.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto"
        >
          <Button
            variant="outline"
            className="h-12 w-full rounded-2xl border-violet-200 bg-white text-violet-700 hover:bg-violet-50 hover:text-violet-800"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Message Customer
          </Button>
        </a>
      </div>

      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="overflow-hidden rounded-[28px] border-0 bg-white p-0 shadow-[0_24px_80px_rgba(15,23,42,0.20)] sm:max-w-md">
          <div className="bg-gradient-to-br from-emerald-50 via-white to-green-50">
            <DialogHeader className="border-b border-emerald-100/70 px-6 pb-4 pt-6 text-left">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-[0_10px_30px_rgba(34,197,94,0.22)]">
                <CheckCircle className="h-7 w-7 text-white" />
              </div>
              <DialogTitle className="text-2xl font-semibold tracking-tight text-gray-900">
                Complete Delivery
              </DialogTitle>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                Mark this delivery as complete. The customer will then confirm delivery and your
                earnings will be released.
              </p>
            </DialogHeader>

            <div className="space-y-5 px-6 py-5">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-emerald-900">Add proof note</p>
                    <p className="mt-1 text-sm leading-6 text-emerald-800">
                      Add any short handover note, delivery detail, or confirmation context for the
                      customer.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <label className="mb-3 block text-sm font-semibold text-gray-800">
                  Delivery Notes
                </label>
                <Textarea
                  placeholder="Add delivery notes (optional)..."
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  rows={4}
                  className="rounded-2xl border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder:text-gray-400 focus:border-emerald-300 focus:ring-emerald-200"
                />
              </div>

              <Button
                onClick={handleMarkComplete}
                disabled={isCompleting}
                className="h-12 w-full rounded-2xl bg-green-600 text-white hover:bg-green-700"
              >
                {isCompleting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Completing...
                  </div>
                ) : (
                  'Confirm Complete'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
