import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type BrandingSettings = { site_name: string; logo_url: string; favicon_url: string };
const defaults: BrandingSettings = { site_name: 'Dispatch NG', logo_url: '', favicon_url: '' };
let cache: BrandingSettings | null = null;

export function useBranding() {
  const [branding, setBranding] = useState<BrandingSettings>(cache || defaults);
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.from('platform_settings').select('setting_key,setting_value').in('setting_key', ['site_name','logo_url','favicon_url']);
      if (!active || !data) return;
      const next = { ...defaults };
      data.forEach((row: any) => { if (row.setting_key in next) (next as any)[row.setting_key] = row.setting_value || ''; });
      cache = next; setBranding(next);
      document.title = next.site_name || 'Dispatch NG';
      if (next.favicon_url) {
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
        if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
        link.href = next.favicon_url;
      }
    })();
    return () => { active = false; };
  }, []);
  return branding;
}

export function clearBrandingCache() { cache = null; }
