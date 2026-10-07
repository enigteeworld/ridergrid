import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type BrandingSettings = {
  site_name: string;
  logo_url: string;
  favicon_url: string;
  isLoaded: boolean;
};

const defaults: BrandingSettings = { site_name: 'Dispatch NG', logo_url: '', favicon_url: '', isLoaded: false };
let cache: BrandingSettings | null = null;
let request: Promise<BrandingSettings> | null = null;
const listeners = new Set<(branding: BrandingSettings) => void>();

function versioned(url: string) {
  if (!url) return '';
  const join = url.includes('?') ? '&' : '?';
  return `${url}${join}v=${Date.now()}`;
}

function applyDocumentBranding(branding: BrandingSettings) {
  if (typeof document === 'undefined') return;
  document.title = branding.site_name || 'Dispatch NG';
  if (branding.favicon_url) {
    document.querySelectorAll("link[rel='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']").forEach((node) => node.remove());
    const icon = document.createElement('link');
    icon.rel = 'icon';
    icon.href = versioned(branding.favicon_url);
    document.head.appendChild(icon);
    const apple = document.createElement('link');
    apple.rel = 'apple-touch-icon';
    apple.href = versioned(branding.favicon_url);
    document.head.appendChild(apple);
  }
}

function publish(next: BrandingSettings) {
  cache = next;
  applyDocumentBranding(next);
  listeners.forEach((listener) => listener(next));
}

async function loadBranding(force = false): Promise<BrandingSettings> {
  if (!force && cache?.isLoaded) return cache;
  if (!force && request) return request;
  request = (async () => {
    try {
      const { data, error } = await supabase.from('platform_settings').select('setting_key,setting_value').in('setting_key', ['site_name', 'logo_url', 'favicon_url']);
      if (error) throw error;
      const next: BrandingSettings = { ...defaults, isLoaded: true };
      (data || []).forEach((row: any) => {
        if (row.setting_key === 'site_name') next.site_name = row.setting_value || defaults.site_name;
        if (row.setting_key === 'logo_url') next.logo_url = row.setting_value || '';
        if (row.setting_key === 'favicon_url') next.favicon_url = row.setting_value || '';
      });
      publish(next);
      return next;
    } catch (error) {
      console.error('Failed to load platform branding:', error);
      // Never overwrite a previously loaded custom brand because of a temporary fetch failure.
      const next = cache?.isLoaded ? cache : { ...defaults, isLoaded: true };
      publish(next);
      return next;
    } finally { request = null; }
  })();
  return request;
}

export function useBranding() {
  const [branding, setBranding] = useState<BrandingSettings>(cache || defaults);
  useEffect(() => {
    listeners.add(setBranding);
    void loadBranding();
    return () => { listeners.delete(setBranding); };
  }, []);
  return branding;
}

export function clearBrandingCache() { cache = null; request = null; }
export async function refreshBranding() { request = null; return loadBranding(true); }
export function setBrandingImmediately(patch: Partial<Omit<BrandingSettings, 'isLoaded'>>) {
  const next = { ...(cache?.isLoaded ? cache : { ...defaults, isLoaded: true }), ...patch, isLoaded: true };
  publish(next);
}
