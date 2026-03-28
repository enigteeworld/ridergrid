// ============================================
// DISPATCH NG - Rider Profile Page
// ============================================
import { useEffect, useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Bike,
  Building2,
  MapPin,
  LogOut,
  Edit2,
  Check,
  Camera,
  Plus,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { showToast } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import type { VehicleType, BankAccount } from '@/types';

const vehicleTypes: VehicleType[] = ['bicycle', 'motorcycle', 'car', 'van', 'truck'];

export function RiderProfilePage() {
  const { user, riderProfile, setRiderProfile, setUser, signOut } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [showBankDialog, setShowBankDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [companyName, setCompanyName] = useState(riderProfile?.company_name || '');
  const [vehicleType, setVehicleType] = useState<VehicleType>(
    riderProfile?.vehicle_type || 'motorcycle'
  );
  const [vehiclePlate, setVehiclePlate] = useState(riderProfile?.vehicle_plate || '');
  const [vehicleColor, setVehicleColor] = useState(riderProfile?.vehicle_color || '');
  const [serviceRadius, setServiceRadius] = useState(riderProfile?.service_radius_km || 10);
  const [isSaving, setIsSaving] = useState(false);

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  useEffect(() => {
    fetchBankAccounts();
  }, [user?.id]);

  const fetchBankAccounts = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBankAccounts(data || []);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  };

  const handleSave = async () => {
    if (!user || !riderProfile) return;

    setIsSaving(true);

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (profileError) throw profileError;
      setUser(profileData);

      const { data: riderData, error: riderError } = await supabase
        .from('rider_profiles')
        .update({
          company_name: companyName || null,
          vehicle_type: vehicleType,
          vehicle_plate: vehiclePlate.toUpperCase(),
          vehicle_color: vehicleColor,
          service_radius_km: serviceRadius,
          updated_at: new Date().toISOString(),
        })
        .eq('profile_id', user.id)
        .select()
        .single();

      if (riderError) throw riderError;
      setRiderProfile(riderData);

      setIsEditing(false);
      showToast('success', 'Profile updated', 'Your changes have been saved');
    } catch (error: any) {
      showToast('error', 'Error', error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        if (uploadError.message?.toLowerCase().includes('row-level security')) {
          throw new Error(
            'Storage policy is blocking avatar upload. Run the storage.objects policy SQL first.'
          );
        }

        if (uploadError.message?.toLowerCase().includes('bucket')) {
          throw new Error(
            'Storage bucket "avatars" was not found. Create it in Supabase Storage first.'
          );
        }

        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { data, error } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setUser(data);
      showToast('success', 'Photo updated', 'Your profile picture has been updated');
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      showToast('error', 'Error', error.message || 'Failed to upload photo');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleAddBankAccount = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase.from('bank_accounts').insert({
        profile_id: user.id,
        account_name: accountName,
        account_number: accountNumber,
        bank_name: bankName,
        is_default: bankAccounts.length === 0,
      });

      if (error) throw error;

      await fetchBankAccounts();

      showToast('success', 'Bank account added', 'You can now withdraw to this account');
      setShowBankDialog(false);
      setBankName('');
      setAccountNumber('');
      setAccountName('');
    } catch (error: any) {
      showToast('error', 'Error', error.message || 'Failed to add bank account');
    }
  };

  const handleSignOut = async () => {
    if (riderProfile?.is_online) {
      await supabase.from('rider_profiles').update({ is_online: false }).eq('profile_id', user?.id);
    }

    await signOut();
  };

  const getVerificationBadge = () => {
    switch (riderProfile?.verification_status) {
      case 'verified':
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            Verified
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
            Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const InfoRow = ({
    icon: Icon,
    label,
    value,
  }: {
    icon?: React.ElementType;
    label: string;
    value: React.ReactNode;
  }) => (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-sm font-medium text-gray-600">
        {Icon && <Icon className="h-4 w-4 text-gray-400" />}
        {label}
      </Label>
      <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-700 ring-1 ring-gray-100">
        {value}
      </div>
    </div>
  );

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500">Manage your rider profile</p>
      </div>

      <Card className="overflow-hidden rounded-[28px] border-violet-100 bg-gradient-to-br from-violet-50/70 via-white to-fuchsia-50/50 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 text-3xl font-medium text-white shadow-[0_10px_30px_rgba(124,58,237,0.20)] ring-4 ring-white">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  user?.full_name?.charAt(0).toUpperCase()
                )}
              </div>

              <label className="absolute -bottom-2 -right-2 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-violet-600 text-white shadow-lg transition-colors hover:bg-violet-700">
                <Camera className="h-5 w-5" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </label>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900">{user?.full_name}</h2>
            <p className="mt-1 text-sm text-gray-500">{user?.email}</p>

            <div className="mt-3 flex items-center gap-2">
              {getVerificationBadge()}
              {riderProfile?.is_online ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Online
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                  <span className="h-2 w-2 rounded-full bg-gray-400" />
                  Offline
                </span>
              )}
            </div>

            {isUploading && <p className="mt-3 text-sm text-gray-500">Uploading photo...</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="group relative overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-violet-500 to-fuchsia-500" />
        <CardContent className="p-6 pl-7">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Personal Information</h3>
              <p className="mt-1 text-sm text-gray-500">Update your rider identity and contact details</p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
              disabled={isSaving}
              className="rounded-xl"
            >
              {isEditing ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save'}
                </>
              ) : (
                <>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <User className="h-4 w-4 text-gray-400" />
                Full Name
              </Label>
              {isEditing ? (
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-12 rounded-2xl"
                />
              ) : (
                <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-700 ring-1 ring-gray-100">
                  {user?.full_name}
                </div>
              )}
            </div>

            <InfoRow icon={Mail} label="Email" value={user?.email} />

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <Phone className="h-4 w-4 text-gray-400" />
                Phone
              </Label>
              {isEditing ? (
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-12 rounded-2xl"
                />
              ) : (
                <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-700 ring-1 ring-gray-100">
                  {user?.phone || 'Not set'}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="group relative overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-emerald-400 to-green-500" />
        <CardContent className="p-6 pl-7">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Vehicle Information</h3>
              <p className="mt-1 text-sm text-gray-500">Keep your delivery and service details current</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <Building2 className="h-4 w-4 text-gray-400" />
                Company Name
              </Label>
              {isEditing ? (
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Optional"
                  className="h-12 rounded-2xl"
                />
              ) : (
                <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-700 ring-1 ring-gray-100">
                  {riderProfile?.company_name || 'Not set'}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <Bike className="h-4 w-4 text-gray-400" />
                Vehicle Type
              </Label>
              {isEditing ? (
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-700 outline-none ring-0 transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                >
                  {vehicleTypes.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm capitalize text-gray-700 ring-1 ring-gray-100">
                  {riderProfile?.vehicle_type}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Vehicle Plate</Label>
              {isEditing ? (
                <Input
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  className="h-12 rounded-2xl uppercase"
                />
              ) : (
                <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm uppercase text-gray-700 ring-1 ring-gray-100">
                  {riderProfile?.vehicle_plate || 'Not set'}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Vehicle Color</Label>
              {isEditing ? (
                <Input
                  value={vehicleColor}
                  onChange={(e) => setVehicleColor(e.target.value)}
                  className="h-12 rounded-2xl"
                />
              ) : (
                <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-700 ring-1 ring-gray-100">
                  {riderProfile?.vehicle_color || 'Not set'}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400" />
                Service Radius
              </Label>
              {isEditing ? (
                <Input
                  type="number"
                  value={serviceRadius}
                  onChange={(e) => setServiceRadius(parseInt(e.target.value || '0', 10))}
                  className="h-12 rounded-2xl"
                />
              ) : (
                <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-700 ring-1 ring-gray-100">
                  {riderProfile?.service_radius_km} km
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="group relative overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-blue-400 to-cyan-500" />
        <CardContent className="p-6 pl-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Bank Accounts</h3>
                <p className="mt-1 text-sm text-gray-500">Manage where your withdrawals are paid</p>
              </div>
            </div>

            <Button size="sm" variant="outline" onClick={() => setShowBankDialog(true)} className="rounded-xl">
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>

          {bankAccounts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
              Add bank accounts to receive withdrawals.
            </div>
          ) : (
            <div className="space-y-4">
              {bankAccounts.map((account) => (
                <div
                  key={account.id}
                  className="rounded-[24px] border border-gray-100 bg-gray-50/70 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900">{account.bank_name}</p>
                      <p className="mt-1 text-sm text-gray-500">{account.account_number}</p>
                      <p className="mt-1 text-sm text-gray-500">{account.account_name}</p>
                    </div>

                    {account.is_default && (
                      <span className="inline-flex shrink-0 items-center rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                        Default
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        onClick={handleSignOut}
        variant="outline"
        className="h-12 w-full rounded-2xl border-red-200 text-red-600 hover:bg-red-50"
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>

      <Dialog open={showBankDialog} onOpenChange={setShowBankDialog}>
        <DialogContent className="overflow-hidden rounded-[28px] border-0 bg-white p-0 shadow-[0_24px_80px_rgba(15,23,42,0.20)] sm:max-w-md">
          <div className="bg-gradient-to-br from-blue-50 via-white to-cyan-50">
            <DialogHeader className="border-b border-blue-100/70 px-6 pb-4 pt-6 text-left">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-[0_10px_30px_rgba(14,165,233,0.22)]">
                <CreditCard className="h-7 w-7 text-white" />
              </div>
              <DialogTitle className="text-2xl font-semibold tracking-tight text-gray-900">
                Add Bank Account
              </DialogTitle>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                Add a payout account for rider withdrawals and weekly settlements.
              </p>
            </DialogHeader>

            <div className="space-y-4 px-6 py-5">
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. GTBank"
                  className="h-12 rounded-2xl"
                />
              </div>

              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="10 digits"
                  className="h-12 rounded-2xl"
                />
              </div>

              <div className="space-y-2">
                <Label>Account Name</Label>
                <Input
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Name on account"
                  className="h-12 rounded-2xl"
                />
              </div>

              <Button
                onClick={handleAddBankAccount}
                className="h-12 w-full rounded-2xl bg-violet-600 text-white hover:bg-violet-700"
              >
                Add Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
