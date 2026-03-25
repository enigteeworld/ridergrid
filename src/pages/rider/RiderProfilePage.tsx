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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { showToast } from '@/stores/uiStore';
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
  const [vehicleType, setVehicleType] = useState<VehicleType>(riderProfile?.vehicle_type || 'motorcycle');
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
          throw new Error('Storage policy is blocking avatar upload. Run the storage.objects policy SQL first.');
        }

        if (uploadError.message?.toLowerCase().includes('bucket')) {
          throw new Error('Storage bucket "avatars" was not found. Create it in Supabase Storage first.');
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
      const { error } = await supabase
        .from('bank_accounts')
        .insert({
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
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            Verified
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
            Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500">Manage your rider profile</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center text-white text-3xl font-medium overflow-hidden">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                ) : (
                  user?.full_name?.charAt(0).toUpperCase()
                )}
              </div>

              <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-violet-700 transition-colors">
                <Camera className="w-5 h-5 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            </div>

            <h2 className="text-xl font-semibold text-gray-900">{user?.full_name}</h2>
            <div className="mt-2">{getVerificationBadge()}</div>
            {isUploading && <p className="text-sm text-gray-500 mt-3">Uploading photo...</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
              disabled={isSaving}
            >
              {isEditing ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save'}
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </>
              )}
            </Button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" /> Full Name
              </Label>
              {isEditing ? (
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              ) : (
                <p className="text-gray-700 p-2 bg-gray-50 rounded-lg">{user?.full_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" /> Email
              </Label>
              <p className="text-gray-700 p-2 bg-gray-50 rounded-lg">{user?.email}</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" /> Phone
              </Label>
              {isEditing ? (
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              ) : (
                <p className="text-gray-700 p-2 bg-gray-50 rounded-lg">{user?.phone || 'Not set'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Information</h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-400" /> Company Name
              </Label>
              {isEditing ? (
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Optional" />
              ) : (
                <p className="text-gray-700 p-2 bg-gray-50 rounded-lg">{riderProfile?.company_name || 'Not set'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Bike className="w-4 h-4 text-gray-400" /> Vehicle Type
              </Label>
              {isEditing ? (
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                  className="w-full p-2 border rounded-lg"
                >
                  {vehicleTypes.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-700 p-2 bg-gray-50 rounded-lg capitalize">{riderProfile?.vehicle_type}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Vehicle Plate</Label>
              {isEditing ? (
                <Input value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} />
              ) : (
                <p className="text-gray-700 p-2 bg-gray-50 rounded-lg uppercase">{riderProfile?.vehicle_plate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Vehicle Color</Label>
              {isEditing ? (
                <Input value={vehicleColor} onChange={(e) => setVehicleColor(e.target.value)} />
              ) : (
                <p className="text-gray-700 p-2 bg-gray-50 rounded-lg">{riderProfile?.vehicle_color || 'Not set'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" /> Service Radius
              </Label>
              {isEditing ? (
                <Input
                  type="number"
                  value={serviceRadius}
                  onChange={(e) => setServiceRadius(parseInt(e.target.value || '0', 10))}
                />
              ) : (
                <p className="text-gray-700 p-2 bg-gray-50 rounded-lg">{riderProfile?.service_radius_km} km</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Bank Accounts</h3>
            <Button size="sm" variant="outline" onClick={() => setShowBankDialog(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add
            </Button>
          </div>

          {bankAccounts.length === 0 ? (
            <p className="text-gray-500 text-sm">Add bank accounts to receive withdrawals</p>
          ) : (
            <div className="space-y-3">
              {bankAccounts.map((account) => (
                <div key={account.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{account.bank_name}</p>
                      <p className="text-sm text-gray-500">{account.account_number}</p>
                      <p className="text-sm text-gray-500">{account.account_name}</p>
                    </div>
                    {account.is_default && (
                      <span className="px-2 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-medium">
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
        className="w-full text-red-600 border-red-200 hover:bg-red-50"
      >
        <LogOut className="w-4 h-4 mr-2" /> Sign Out
      </Button>

      <Dialog open={showBankDialog} onOpenChange={setShowBankDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Bank Account</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Bank Name</Label>
              <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. GTBank" />
            </div>

            <div className="space-y-2">
              <Label>Account Number</Label>
              <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="10 digits" />
            </div>

            <div className="space-y-2">
              <Label>Account Name</Label>
              <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Name on account" />
            </div>

            <Button onClick={handleAddBankAccount} className="w-full bg-violet-600 hover:bg-violet-700 text-white">
              Add Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}