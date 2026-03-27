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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Job not found</h2>
        <Button onClick={() => navigate('/rider/jobs')} className="mt-4">
          Back to Jobs
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/rider/jobs')}
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Jobs
      </button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 break-words">{job.job_number}</h1>
          <p className="text-gray-500">{formatDateTime(job.created_at)}</p>
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-4 sm:p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-violet-600" />
              Pickup
            </h3>

            <p className="text-gray-700 break-words">{job.pickup_address}</p>

            <div className="mt-3 space-y-2 text-sm text-gray-500">
              <p className="break-words">{job.pickup_contact_name}</p>
              <a
                href={`tel:${job.pickup_contact_phone}`}
                className="text-violet-600 flex items-start gap-1 break-all"
              >
                <Phone className="w-4 h-4 mt-0.5 shrink-0" />
                {job.pickup_contact_phone}
              </a>
            </div>
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
              <p className="break-words">{job.delivery_contact_name}</p>
              <a
                href={`tel:${job.delivery_contact_phone}`}
                className="text-violet-600 flex items-start gap-1 break-all"
              >
                <Phone className="w-4 h-4 mt-0.5 shrink-0" />
                {job.delivery_contact_phone}
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

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
          <h3 className="font-semibold text-gray-900 mb-4">Earnings</h3>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-gray-600">You will receive</span>
            <span className="text-2xl font-bold text-violet-700 break-words">
              {formatCurrency(job.rider_earnings)}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:flex xl:flex-wrap gap-3">
        {job.status === 'funded' && (
          <Button
            onClick={handleMarkInProgress}
            disabled={isStarting}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isStarting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Starting...
              </div>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Started
              </>
            )}
          </Button>
        )}

        {job.status === 'in_progress' && (
          <Button
            onClick={() => setShowCompleteDialog(true)}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark as Complete
          </Button>
        )}

        <a
          href={`https://wa.me/${job.customer_phone?.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto"
        >
          <Button variant="outline" className="w-full">
            <MessageCircle className="w-4 h-4 mr-2" />
            Message Customer
          </Button>
        </a>
      </div>

      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Delivery</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-gray-600">
              Mark this delivery as complete. The customer will then confirm delivery and your
              earnings will be released.
            </p>

            <Textarea
              placeholder="Add delivery notes (optional)..."
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              rows={3}
            />

            <Button
              onClick={handleMarkComplete}
              disabled={isCompleting}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {isCompleting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Completing...
                </div>
              ) : (
                'Confirm Complete'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}