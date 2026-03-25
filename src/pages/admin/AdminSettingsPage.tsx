// ============================================
// DISPATCH NG - Admin Settings Page
// ============================================

import { useEffect, useState } from 'react';
import { Settings, DollarSign, Shield, Bell } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/stores/uiStore';

interface PlatformSettings {
  platform_fee_amount: number;
  min_wallet_funding: number;
  max_transaction_amount: number;
  auto_complete_hours: number;
  require_customer_kyc: boolean;
  require_rider_kyc: boolean;
  enable_delivery_otp: boolean;
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
  });
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates = [
        { key: 'platform_fee_amount', value: settings.platform_fee_amount.toString(), type: 'number' },
        { key: 'min_wallet_funding', value: settings.min_wallet_funding.toString(), type: 'number' },
        { key: 'max_transaction_amount', value: settings.max_transaction_amount.toString(), type: 'number' },
        { key: 'auto_complete_hours', value: settings.auto_complete_hours.toString(), type: 'number' },
        { key: 'require_customer_kyc', value: settings.require_customer_kyc.toString(), type: 'boolean' },
        { key: 'require_rider_kyc', value: settings.require_rider_kyc.toString(), type: 'boolean' },
        { key: 'enable_delivery_otp', value: settings.enable_delivery_otp.toString(), type: 'boolean' },
      ];

      for (const update of updates) {
        await supabase
          .from('platform_settings')
          .update({ setting_value: update.value })
          .eq('setting_key', update.key);
      }

      showToast('success', 'Settings saved', 'Platform settings have been updated');
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

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <DollarSign className="w-5 h-5 text-violet-600" />
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
            <Shield className="w-5 h-5 text-violet-600" />
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
            <Bell className="w-5 h-5 text-violet-600" />
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
        className="w-full bg-violet-600 hover:bg-violet-700 text-white"
      >
        {isSaving ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  );
}
