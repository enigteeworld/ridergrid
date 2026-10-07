import { useEffect, useState } from 'react';
import { BadgeCheck, Camera, FileCheck2, Upload, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { showToast } from '@/stores/uiStore';
import type { DocumentType, KycRecord } from '@/types';

const labels: Record<DocumentType, string> = { nin:'NIN', drivers_license:"Driver's licence", passport:'International passport', voters_card:"Voter's card", cac:'CAC document' };

export function KycVerificationCard() {
  const { user } = useAuthStore();
  const [record, setRecord] = useState<KycRecord | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>('nin');
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from('kyc_records').select('*').eq('profile_id', user.id).order('created_at', { ascending:false }).limit(1).maybeSingle();
    setRecord((data as KycRecord | null) || null);
    if (data) { setDocumentType(data.document_type as DocumentType); setDocumentNumber(data.document_number || ''); }
    setLoading(false);
  };
  useEffect(() => { load(); }, [user?.id]);

  const upload = async (file: File, kind: 'document'|'selfie') => {
    if (!user) throw new Error('Not signed in');
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${user.id}/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('kyc-documents').upload(path, file, { upsert:false, cacheControl:'3600' });
    if (error) throw error;
    return path;
  };

  const submit = async () => {
    if (!user || !documentNumber.trim() || !documentFile || !selfieFile) {
      showToast('error','Complete verification','Add your document number, ID image and a clear selfie.'); return;
    }
    setSubmitting(true);
    try {
      const [documentPath, selfiePath] = await Promise.all([upload(documentFile,'document'), upload(selfieFile,'selfie')]);
      const payload = { profile_id:user.id, document_type:documentType, document_number:documentNumber.trim(), document_image_url:documentPath, selfie_image_url:selfiePath, verification_status:'pending' as const, verified_at:null, verified_by:null, rejection_reason:null, updated_at:new Date().toISOString() };
      const { error } = await supabase.from('kyc_records').upsert(payload, { onConflict:'profile_id,document_type' });
      if (error) throw error;
      showToast('success','Verification submitted','Admin will review your identity details.');
      setDocumentFile(null); setSelfieFile(null); await load();
    } catch (e:any) { showToast('error','Submission failed',e.message || 'Could not submit verification'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <Card><CardContent className="p-5 text-sm text-gray-500">Loading identity verification…</CardContent></Card>;
  const status = record?.verification_status;
  if (status === 'verified') return <Card className="border-emerald-100"><CardContent className="flex items-center gap-3 p-5"><BadgeCheck className="h-8 w-8 text-emerald-600"/><div><p className="font-semibold text-gray-900">Identity verified</p><p className="text-sm text-gray-500">Your Dispatch NG identity check is complete.</p></div></CardContent></Card>;
  if (status === 'pending') return <Card className="border-amber-100"><CardContent className="flex items-center gap-3 p-5"><FileCheck2 className="h-8 w-8 text-amber-500"/><div><p className="font-semibold text-gray-900">Verification under review</p><p className="text-sm text-gray-500">Your submission is waiting for admin review.</p></div></CardContent></Card>;

  return <Card><CardContent className="space-y-4 p-5">
    <div><p className="font-semibold text-gray-900">Verify your identity</p><p className="text-sm text-gray-500">A lightweight check to protect customers, riders and deliveries.</p></div>
    {status === 'rejected' && <div className="flex gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"><XCircle className="h-5 w-5 shrink-0"/><span>{record?.rejection_reason || 'Your previous submission was not approved. Please submit again.'}</span></div>}
    <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>ID type</Label><Select value={documentType} onValueChange={(v)=>setDocumentType(v as DocumentType)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{(Object.keys(labels) as DocumentType[]).filter(k => user?.user_type === 'rider' || k !== 'cac').map(k=><SelectItem key={k} value={k}>{labels[k]}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>ID / document number</Label><Input value={documentNumber} onChange={e=>setDocumentNumber(e.target.value)} placeholder="Enter document number"/></div></div>
    <div className="grid gap-3 sm:grid-cols-2"><label className="cursor-pointer rounded-xl border border-dashed border-gray-300 p-4 text-center hover:bg-gray-50"><Upload className="mx-auto mb-2 h-5 w-5 text-emerald-600"/><span className="block text-sm font-medium">{documentFile?.name || 'Upload ID image'}</span><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={e=>setDocumentFile(e.target.files?.[0] || null)}/></label><label className="cursor-pointer rounded-xl border border-dashed border-gray-300 p-4 text-center hover:bg-gray-50"><Camera className="mx-auto mb-2 h-5 w-5 text-teal-600"/><span className="block text-sm font-medium">{selfieFile?.name || 'Upload clear selfie'}</span><input type="file" accept="image/jpeg,image/png,image/webp" capture="user" className="hidden" onChange={e=>setSelfieFile(e.target.files?.[0] || null)}/></label></div>
    <Button onClick={submit} disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-700">{submitting ? 'Submitting…' : 'Submit for verification'}</Button>
  </CardContent></Card>;
}
