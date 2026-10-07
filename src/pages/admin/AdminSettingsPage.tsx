// ============================================
// DISPATCH NG - Admin Settings Page
// ============================================

import { useEffect, useState } from 'react';
import { Settings, DollarSign, Shield, Bell, Image as ImageIcon, Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/stores/uiStore';
import { refreshBranding, setBrandingImmediately } from '@/hooks/useBranding';

interface PlatformSettings {
  platform_fee_amount: number;
  min_wallet_funding: number;
  max_transaction_amount: number;
  auto_complete_hours: number;
  require_customer_kyc: boolean;
  require_rider_kyc: boolean;
  enable_delivery_otp: boolean;
  site_name: string;
  logo_url: string;
  favicon_url: string;
}

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>({
    platform_fee_amount: 200,
    min_wallet_funding: 500,
    max_transaction_amount: 500000,
    auto_complete_hours: 24,
    require_customer_kyc: false,
    require_rider_kyc: true,
    enable_delivery_otp: true,
    site_name: 'Dispatch NG',
    logo_url: '',
    favicon_url: '',
  });
  const [uploading, setUploading] = useState<'logo' | 'favicon' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*');

      if (error) throw error;

      if (data) {
        const settingsMap: Partial<PlatformSettings> = {};
        data.forEach((s: any) => {
          const value = s.setting_type === 'number' ? parseFloat(s.setting_value) :
                        s.setting_type === 'boolean' ? s.setting_value === 'true' :
                        s.setting_value;
          (settingsMap as any)[s.setting_key] = value;
        });
        setSettings({ ...settings, ...settingsMap });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadBrandAsset = async (kind: 'logo' | 'favicon', file?: File) => {
    if (!file) return;
    setUploading(kind);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const path = `${kind}/${kind}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('branding').upload(path, file, { upsert: true, cacheControl: '3600' });
      if (error) throw error;
      const { data } = supabase.storage.from('branding').getPublicUrl(path);
      const key = kind === 'logo' ? 'logo_url' : 'favicon_url';
      const publicUrl = data.publicUrl;

      // Persist the asset immediately. Uploading branding must not depend on a second Save click.
      const { error: persistError } = await supabase
        .from('platform_settings')
        .upsert({ setting_key: key, setting_value: publicUrl, setting_type: 'string', updated_at: new Date().toISOString() }, { onConflict: 'setting_key' });
      if (persistError) throw persistError;

      setSettings(prev => ({ ...prev, [key]: publicUrl }));
      setBrandingImmediately({ [key]: publicUrl });
      await refreshBranding();
      showToast('success', `${kind === 'logo' ? 'Logo' : 'Favicon'} updated`, `The ${kind} is now live across Dispatch NG.`);
    } catch (error: any) { showToast('error', 'Upload failed', error.message); }
    finally { setUploading(null); }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates: Array<{ key: string; value: string; type: 'string' | 'number' | 'boolean' }> = [
        { key: 'platform_fee_amount', value: settings.platform_fee_amount.toString(), type: 'number' },
        { key: 'min_wallet_funding', value: settings.min_wallet_funding.toString(), type: 'number' },
        { key: 'max_transaction_amount', value: settings.max_transaction_amount.toString(), type: 'number' },
        { key: 'auto_complete_hours', value: settings.auto_complete_hours.toString(), type: 'number' },
        { key: 'require_customer_kyc', value: settings.require_customer_kyc.toString(), type: 'boolean' },
        { key: 'require_rider_kyc', value: settings.require_rider_kyc.toString(), type: 'boolean' },
        { key: 'enable_delivery_otp', value: settings.enable_delivery_otp.toString(), type: 'boolean' },
        { key: 'site_name', value: settings.site_name, type: 'string' },
        { key: 'logo_url', value: settings.logo_url, type: 'string' },
        { key: 'favicon_url', value: settings.favicon_url, type: 'string' },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('platform_settings')
          .upsert({ setting_key: update.key, setting_value: update.value, setting_type: update.type, updated_at: new Date().toISOString() }, { onConflict: 'setting_key' });
        if (error) throw error;
      }

      await refreshBranding();
      showToast('success', 'Settings saved', 'Platform settings and branding have been updated');
    } catch (error: any) {
      showToast('error', 'Error', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
        <p className="text-gray-500">Configure platform-wide settings</p>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="mb-6 flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-teal-600" />
            <div><h3 className="text-lg font-semibold text-gray-900">Branding</h3><p className="text-sm text-gray-500">Set the logo and browser favicon used across Dispatch NG.</p></div>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2"><Label>Site Name</Label><Input value={settings.site_name} onChange={(e) => setSettings({ ...settings, site_name: e.target.value })} /></div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <Label className="mb-3 block">Platform Logo</Label>
              <div className="mb-4 flex h-20 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white">{settings.logo_url ? <img src={settings.logo_url} alt="Current logo" className="max-h-14 max-w-[220px] object-contain" /> : <span className="text-sm text-gray-400">No custom logo uploaded</span>}</div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"><Upload className="h-4 w-4" />{uploading === 'logo' ? 'Uploading...' : 'Upload logo'}<input className="hidden" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" disabled={!!uploading} onChange={(e) => uploadBrandAsset('logo', e.target.files?.[0])} /></label>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <Label className="mb-3 block">Browser Favicon</Label>
              <div className="mb-4 flex h-20 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white">{settings.favicon_url ? <img src={settings.favicon_url} alt="Current favicon" className="h-12 w-12 object-contain" /> : <span className="text-sm text-gray-400">No custom favicon uploaded</span>}</div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"><Upload className="h-4 w-4" />{uploading === 'favicon' ? 'Uploading...' : 'Upload favicon'}<input className="hidden" type="file" accept="image/png,image/x-icon,image/svg+xml,image/webp" disabled={!!uploading} onChange={(e) => uploadBrandAsset('favicon', e.target.files?.[0])} /></label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-gray-900">Payment Settings</h3>
          </div>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Platform Fee (₦)</Label>
                <Input
                  type="number"
                  value={settings.platform_fee_amount}
                  onChange={(e) => setSettings({ ...settings, platform_fee_amount: parseFloat(e.target.value) })}
                />
                <p className="text-sm text-gray-500">Fee deducted from each delivery</p>
              </div>

              <div className="space-y-2">
                <Label>Minimum Wallet Funding (₦)</Label>
                <Input
                  type="number"
                  value={settings.min_wallet_funding}
                  onChange={(e) => setSettings({ ...settings, min_wallet_funding: parseFloat(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label>Maximum Transaction (₦)</Label>
                <Input
                  type="number"
                  value={settings.max_transaction_amount}
                  onChange={(e) => setSettings({ ...settings, max_transaction_amount: parseFloat(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label>Auto-Complete Hours</Label>
                <Input
                  type="number"
                  value={settings.auto_complete_hours}
                  onChange={(e) => setSettings({ ...settings, auto_complete_hours: parseFloat(e.target.value) })}
                />
                <p className="text-sm text-gray-500">Hours before auto-marking complete</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-gray-900">KYC Settings</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Require Customer KYC</p>
                <p className="text-sm text-gray-500">Customers must verify identity</p>
              </div>
              <Switch
                checked={settings.require_customer_kyc}
                onCheckedChange={(checked) => setSettings({ ...settings, require_customer_kyc: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Require Rider KYC</p>
                <p className="text-sm text-gray-500">Riders must verify identity</p>
              </div>
              <Switch
                checked={settings.require_rider_kyc}
                onCheckedChange={(checked) => setSettings({ ...settings, require_rider_kyc: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-gray-900">Delivery Settings</h3>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Enable Delivery OTP</p>
              <p className="text-sm text-gray-500">Require OTP for delivery confirmation</p>
            </div>
            <Switch
              checked={settings.enable_delivery_otp}
              onCheckedChange={(checked) => setSettings({ ...settings, enable_delivery_otp: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        {isSaving ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  );
}
