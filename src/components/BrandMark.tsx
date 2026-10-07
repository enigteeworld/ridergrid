import { Package } from 'lucide-react';
import { useBranding } from '@/hooks/useBranding';
import { cn } from '@/lib/utils';

type BrandMarkProps = {
  className?: string;
  iconClassName?: string;
  imageClassName?: string;
  fallbackClassName?: string;
};

export function BrandMark({
  className = '',
  iconClassName = 'h-6 w-6',
  imageClassName = '',
  fallbackClassName = '',
}: BrandMarkProps) {
  const { logo_url, site_name, isLoaded } = useBranding();

  // Do not flash the built-in icon while the saved branding is still loading.
  if (!isLoaded) {
    return <div className={cn('h-9 w-[116px] animate-pulse rounded-lg bg-slate-100', className)} aria-hidden="true" />;
  }

  if (logo_url) {
    return (
      <img
        src={logo_url}
        alt={`${site_name} logo`}
        className={cn('block h-auto max-h-10 w-auto max-w-[138px] object-contain object-left', className, imageClassName)}
      />
    );
  }

  return (
    <div className={cn('flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 p-2 text-white', className, fallbackClassName)}>
      <Package className={iconClassName} />
    </div>
  );
}
