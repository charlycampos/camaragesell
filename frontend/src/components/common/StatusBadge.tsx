/**
 * StatusBadge - Componente para mostrar estados con colores y estilos - Refactorizado con Tailwind
 */
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, XCircle, Ban, Calendar, Check, RotateCcw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  type?: 'solicitud' | 'programacion' | 'general';
  size?: 'small' | 'medium' | 'large';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'general',
  size = 'medium'
}) => {

  const getStatusConfig = () => {
    if (type === 'solicitud') {
      switch (status.toLowerCase()) {
        case 'pendiente':
          return {
            variant: 'outline' as const,
            className: 'border-yellow-500 text-yellow-700 bg-yellow-50 dark:border-yellow-600 dark:text-yellow-400 dark:bg-yellow-950',
            icon: <Clock className="h-3 w-3" />,
            label: 'Pendiente'
          };
        case 'programada':
          return {
            variant: 'outline' as const,
            className: 'border-green-500 text-green-700 bg-green-50 dark:border-green-600 dark:text-green-400 dark:bg-green-950',
            icon: <CheckCircle2 className="h-3 w-3" />,
            label: 'Programada'
          };
        case 'rechazada':
          return {
            variant: 'outline' as const,
            className: 'border-red-500 text-red-700 bg-red-50 dark:border-red-600 dark:text-red-400 dark:bg-red-950',
            icon: <XCircle className="h-3 w-3" />,
            label: 'Rechazada'
          };
        case 'cancelada':
          return {
            variant: 'outline' as const,
            className: 'border-gray-500 text-gray-700 bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:bg-gray-950',
            icon: <Ban className="h-3 w-3" />,
            label: 'Cancelada'
          };
        default:
          return {
            variant: 'outline' as const,
            className: 'border-slate-500 text-slate-700 bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:bg-slate-950',
            icon: <Calendar className="h-3 w-3" />,
            label: status
          };
      }
    } else if (type === 'programacion') {
      switch (status.toLowerCase()) {
        case 'programada':
          return {
            variant: 'outline' as const,
            className: 'border-blue-500 text-blue-700 bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:bg-blue-950',
            icon: <Calendar className="h-3 w-3" />,
            label: 'Programada'
          };
        case 'realizada':
          return {
            variant: 'outline' as const,
            className: 'border-green-500 text-green-700 bg-green-50 dark:border-green-600 dark:text-green-400 dark:bg-green-950',
            icon: <Check className="h-3 w-3" />,
            label: 'Realizada'
          };
        case 'reprogramada':
          return {
            variant: 'outline' as const,
            className: 'border-yellow-500 text-yellow-700 bg-yellow-50 dark:border-yellow-600 dark:text-yellow-400 dark:bg-yellow-950',
            icon: <RotateCcw className="h-3 w-3" />,
            label: 'Reprogramada'
          };
        case 'cancelada':
          return {
            variant: 'outline' as const,
            className: 'border-red-500 text-red-700 bg-red-50 dark:border-red-600 dark:text-red-400 dark:bg-red-950',
            icon: <Ban className="h-3 w-3" />,
            label: 'Cancelada'
          };
        case 'no_asistio':
          return {
            variant: 'outline' as const,
            className: 'border-orange-500 text-orange-700 bg-orange-50 dark:border-orange-600 dark:text-orange-400 dark:bg-orange-950',
            icon: <AlertTriangle className="h-3 w-3" />,
            label: 'No Asistió'
          };
        default:
          return {
            variant: 'outline' as const,
            className: 'border-slate-500 text-slate-700 bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:bg-slate-950',
            icon: <Calendar className="h-3 w-3" />,
            label: status
          };
      }
    } else {
      // General
      return {
        variant: 'outline' as const,
        className: 'border-slate-500 text-slate-700 bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:bg-slate-950',
        icon: null,
        label: status
      };
    }
  };

  const config = getStatusConfig();

  const sizeClasses = {
    small: 'text-xs px-2 py-0.5',
    medium: 'text-sm px-2.5 py-1',
    large: 'text-base px-3 py-1.5'
  };

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'inline-flex items-center gap-1.5 font-medium',
        config.className,
        sizeClasses[size]
      )}
    >
      {config.icon}
      <span>{config.label}</span>
    </Badge>
  );
};

export default StatusBadge;
