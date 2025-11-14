import { cn } from '@/lib/utils';

interface ServiceStatusBadgeProps {
  status: string;
  className?: string;
}

export function ServiceStatusBadge({ status, className }: ServiceStatusBadgeProps) {
  const isActive = status.toLowerCase().includes('active');
  const isFailed = status.toLowerCase().includes('failed') || status.toLowerCase().includes('error');
  const isInactive = status.toLowerCase().includes('inactive') || status.toLowerCase().includes('dead');

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        isActive && 'bg-green-100 text-green-800 border border-green-200',
        isFailed && 'bg-red-100 text-red-800 border border-red-200',
        isInactive && 'bg-neutral-100 text-neutral-700 border border-neutral-200',
        !isActive && !isFailed && !isInactive && 'bg-orange-100 text-orange-800 border border-orange-200',
        className
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full mr-1.5',
          isActive && 'bg-green-600',
          isFailed && 'bg-red-600',
          isInactive && 'bg-neutral-400',
          !isActive && !isFailed && !isInactive && 'bg-orange-600'
        )}
      />
      {status}
    </span>
  );
}
