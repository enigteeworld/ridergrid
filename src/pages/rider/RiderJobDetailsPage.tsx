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
  Camera,
  Upload,
  X,
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
import { DeliveryChat } from '@/components/DeliveryChat';

export function RiderJobDetailsPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [job, setJob] = useState<JobDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [proofFiles, setProofFiles] = useState<File[]>([]);
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

  const handleProofFiles = (files: FileList | null) => {
    if (!files) return;
    const incoming = Array.from(files);
    const allowed = incoming.filter((file) =>
      ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) && file.size <= 8 * 1024 * 1024
    );
    if (allowed.length !== incoming.length) {
      showToast('warning', 'Some photos were skipped', 'Use JPG, PNG or WEBP images up to 8MB each.');
    }
    setProofFiles((current) => [...current, ...allowed].slice(0, 3));
  };

  const handleMarkComplete = async () => {
    if (!jobId || !job || !user?.id) return;

    if (job.status !== 'in_progress') {
      showToast('warning', 'Not ready', 'Only in-progress deliveries can be completed.');
      await fetchJobDetails();
      return;
    }

    if (proofFiles.length === 0) {
      showToast('warning', 'Photo proof required', 'Upload at least one delivery photo before completing this delivery.');
      return;
    }

    setIsCompleting(true);
    const uploadedPaths: string[] = [];

    try {
      for (const [index, file] of proofFiles.entries()) {
        const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `${jobId}/${user.id}/${Date.now()}-${index}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from('delivery-proofs')
          .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
        if (uploadError) throw uploadError;
        uploadedPaths.push(path);
      }

      const proofRows = uploadedPaths.map((path, index) => ({
        dispatch_job_id: jobId,
        proof_type: 'photo' as const,
        storage_path: path,
        notes: index === 0 && deliveryNotes.trim() ? deliveryNotes.trim() : null,
        uploaded_by: user.id,
      }));
      const { error: proofError } = await supabase.from('delivery_proofs').insert(proofRows);
      if (proofError) throw proofError;

      const { error } = await supabase
        .from('dispatch_jobs')
        .update({ status: 'rider_marked_complete', rider_completed_at: new Date().toISOString() })
        .eq('id', jobId)
        .eq('rider_id', user.id)
        .eq('status', 'in_progress');
      if (error) throw error;

      showToast('success', 'Delivery submitted', 'Photo proof was saved. Waiting for the customer to confirm delivery and release payment.');
      setShowCompleteDialog(false);
      setDeliveryNotes('');
      setProofFiles([]);
      await fetchJobDetails();
    } catch (error: any) {
      if (uploadedPaths.length) {
        await supabase.storage.from('delivery-proofs').remove(uploadedPaths);
      }
      showToast('error', 'Could not complete delivery', error.message || 'Proof upload failed. Please try again.');
    } finally {
      setIsCompleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600" />
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
    <div className="space-y-5">
      <button
        onClick={() => navigate('/rider/jobs')}
        className="inline-flex items-center gap-2 text-gray-500 transition-colors hover:text-gray-700"
      >
        <ArrowLeft className="h-5 w-5" />
        Back to Jobs
      </button>

      <Card className="overflow-hidden rounded-[24px] border-slate-200 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 ring-1 ring-emerald-100">
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

            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-emerald-100 sm:min-w-[160px] sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
                You Earn
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-700">
                {formatCurrency(job.rider_earnings)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="group relative overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-[0_5px_20px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]">
          <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-emerald-500 to-teal-500" />
          <CardContent className="p-5 pl-6 sm:p-6 sm:pl-7">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
              <MapPin className="h-5 w-5 text-emerald-600" />
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
                className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                <Phone className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="break-all text-sm font-medium">{job.pickup_contact_phone}</span>
              </a>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-[0_5px_20px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]">
          <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-emerald-400 to-green-500" />
          <CardContent className="p-5 pl-6 sm:p-6 sm:pl-7">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
              <MapPin className="h-5 w-5 text-green-600" />
              Delivery
            </h3>

            <div className="rounded-2xl bg-slate-50 p-4">
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
                className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                <Phone className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="break-all text-sm font-medium">{job.delivery_contact_phone}</span>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="group relative overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-[0_5px_20px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]">
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

      <Card className="group relative overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-[0_5px_20px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-emerald-500 to-teal-500" />
        <CardContent className="p-5 pl-6 sm:p-6 sm:pl-7">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
            <Wallet className="h-5 w-5 text-emerald-600" />
            Earnings
          </h3>

          <div className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-gray-600">You will receive</span>
            <span className="break-words text-3xl font-bold tracking-tight text-emerald-700">
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
            className="h-12 w-full rounded-2xl border-emerald-200 bg-white text-emerald-700 hover:bg-slate-50 hover:text-emerald-800"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Message Customer
          </Button>
        </a>
      </div>

      {job && <DeliveryChat jobId={job.id} enabled={!['cancelled','refunded'].includes(job.status)} />}

      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="overflow-hidden rounded-[24px] border-0 bg-white p-0 shadow-[0_24px_80px_rgba(15,23,42,0.20)] sm:max-w-md">
          <div className="bg-gradient-to-br from-emerald-50 via-white to-green-50">
            <DialogHeader className="border-b border-slate-200 px-6 pb-4 pt-6 text-left">
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
              <div className="rounded-2xl border border-emerald-200 bg-slate-50 p-4">
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
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800">Delivery photo proof *</label>
                    <p className="mt-1 text-xs text-gray-500">1–3 photos · JPG, PNG or WEBP · max 8MB each</p>
                  </div>
                  <Camera className="h-5 w-5 text-emerald-600" />
                </div>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-emerald-200 bg-slate-50/50 px-4 py-5 text-sm font-semibold text-emerald-700 hover:bg-slate-50">
                  <Upload className="h-4 w-4" /> Choose delivery photos
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => { handleProofFiles(e.target.files); e.currentTarget.value = ''; }} />
                </label>
                {proofFiles.length > 0 && <div className="mt-3 grid grid-cols-3 gap-2">{proofFiles.map((file,index) => <div key={`${file.name}-${index}`} className="relative aspect-square overflow-hidden rounded-xl bg-gray-100"><img src={URL.createObjectURL(file)} alt={`Delivery proof ${index+1}`} className="h-full w-full object-cover"/><button type="button" onClick={()=>setProofFiles(files=>files.filter((_,i)=>i!==index))} className="absolute right-1 top-1 rounded-full bg-black/65 p-1 text-white"><X className="h-3.5 w-3.5"/></button></div>)}</div>}
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
                disabled={isCompleting || proofFiles.length === 0}
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
