// ============================================
// DISPATCH NG - Profile Page (Customer)
// ============================================
import { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Camera,
  LogOut,
  Edit2,
  Check,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { showToast } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

export function ProfilePage() {
  const { user, setUser, signOut } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setUser(data);
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
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
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
      showToast('error', 'Error', error.message || 'Failed to upload photo');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const infoFieldClass =
    'h-12 rounded-2xl border-gray-200 bg-gray-50 text-base text-gray-900 placeholder:text-gray-400 focus:border-violet-300 focus:ring-violet-200';

  const DetailBlock = ({
    icon: Icon,
    label,
    children,
  }: {
    icon: React.ElementType;
    label: string;
    children: React.ReactNode;
  }) => (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
      <Label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
        <Icon className="h-4 w-4 text-gray-400" />
        {label}
      </Label>
      {children}
    </div>
  );

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500">Manage your account settings</p>
      </div>

      <Card className="overflow-hidden rounded-[28px] border-violet-100 bg-gradient-to-r from-violet-50 via-white to-fuchsia-50 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100">
              <ShieldCheck className="h-5 w-5 text-violet-600" />
            </div>

            <div className="min-w-0">
              <p className="font-semibold text-gray-900">Your Dispatch NG identity</p>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                Keep your profile details current so riders, deliveries, and support interactions
                stay smooth across the app.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4 rounded-3xl bg-gray-50/60 p-2">
        <Card className="group relative overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]">
          <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-violet-500 to-fuchsia-500" />
          <CardContent className="p-6 pl-7">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-5">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-violet-400 to-fuchsia-400 text-4xl font-semibold text-white shadow-[0_12px_30px_rgba(124,58,237,0.22)]">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    user?.full_name?.charAt(0).toUpperCase()
                  )}
                </div>

                <label className="absolute -bottom-1 -right-1 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-violet-600 shadow-lg transition-colors hover:bg-violet-700">
                  <Camera className="h-5 w-5 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
                {user?.full_name}
              </h2>
              <p className="mt-1 capitalize text-gray-500">{user?.user_type}</p>

              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700">
                <Sparkles className="h-4 w-4" />
                Customer profile
              </div>

              {isUploading && <p className="mt-3 text-sm text-gray-500">Uploading photo...</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]">
          <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-blue-400 to-cyan-500" />
          <CardContent className="p-6 pl-7">
            <div className="mb-6 flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-gray-900">Personal Information</h3>

              <Button
                variant="outline"
                size="sm"
                onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                disabled={isSaving}
                className="rounded-xl border-violet-200 bg-white text-violet-700 hover:bg-violet-50 hover:text-violet-800"
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

            <div className="space-y-5">
              <DetailBlock icon={User} label="Full Name">
                {isEditing ? (
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={infoFieldClass}
                  />
                ) : (
                  <p className="rounded-2xl bg-white px-4 py-3 text-gray-700 shadow-sm">
                    {user?.full_name}
                  </p>
                )}
              </DetailBlock>

              <DetailBlock icon={Mail} label="Email">
                <p className="rounded-2xl bg-white px-4 py-3 text-gray-700 shadow-sm">
                  {user?.email}
                </p>
              </DetailBlock>

              <DetailBlock icon={Phone} label="Phone Number">
                {isEditing ? (
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={infoFieldClass}
                  />
                ) : (
                  <p className="rounded-2xl bg-white px-4 py-3 text-gray-700 shadow-sm">
                    {user?.phone || 'Not set'}
                  </p>
                )}
              </DetailBlock>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]">
          <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-emerald-400 to-green-500" />
          <CardContent className="p-6 pl-7">
            <h3 className="mb-5 text-xl font-semibold text-gray-900">Account Information</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 rounded-2xl bg-gray-50/80 px-4 py-3">
                <span className="text-gray-500">Account Type</span>
                <span className="font-medium capitalize text-gray-900">{user?.user_type}</span>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-2xl bg-gray-50/80 px-4 py-3">
                <span className="text-gray-500">Member Since</span>
                <span className="font-medium text-gray-900">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-2xl bg-gray-50/80 px-4 py-3">
                <span className="text-gray-500">Account Status</span>
                <span
                  className={cn(
                    'font-semibold',
                    user?.is_active ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {user?.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Button
        onClick={handleSignOut}
        variant="outline"
        className="h-12 w-full rounded-2xl border-red-200 text-red-600 hover:bg-red-50"
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );
}