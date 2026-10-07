import { Package } from 'lucide-react';
import { useBranding } from '@/hooks/useBranding';
import { cn } from '@/lib/utils';

export function BrandMark({ className = '', iconClassName = 'h-6 w-6' }: { className?: string; iconClassName?: string }) {
  const { logo_url, site_name } = useBranding();
  if (logo_url) return <img src={logo_url} alt={`${site_name} logo`} className={cn('max-h-10 max-w-[150px] object-contain', className)} />;
  return <div className={cn('flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 p-2 text-white', className)}><Package className={iconClassName} /></div>;
}
