/**
 * StatusBadge - Componente para mostrar estados con colores y estilos atractivos
 */
import React from 'react';
import './StatusBadge.css';

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
            className: 'badge-warning',
            icon: '⏳',
            label: 'Pendiente'
          };
        case 'programada':
          return {
            className: 'badge-success',
            icon: '✅',
            label: 'Programada'
          };
        case 'rechazada':
          return {
            className: 'badge-danger',
            icon: '❌',
            label: 'Rechazada'
          };
        case 'cancelada':
          return {
            className: 'badge-gray',
            icon: '🚫',
            label: 'Cancelada'
          };
        default:
          return {
            className: 'badge-default',
            icon: '📋',
            label: status
          };
      }
    } else if (type === 'programacion') {
      switch (status.toLowerCase()) {
        case 'programada':
          return {
            className: 'badge-info',
            icon: '📅',
            label: 'Programada'
          };
        case 'realizada':
          return {
            className: 'badge-success',
            icon: '✔️',
            label: 'Realizada'
          };
        case 'reprogramada':
          return {
            className: 'badge-warning',
            icon: '🔄',
            label: 'Reprogramada'
          };
        case 'cancelada':
          return {
            className: 'badge-danger',
            icon: '🚫',
            label: 'Cancelada'
          };
        case 'no_asistio':
          return {
            className: 'badge-dark',
            icon: '⚠️',
            label: 'No Asistió'
          };
        default:
          return {
            className: 'badge-default',
            icon: '📋',
            label: status
          };
      }
    } else {
      // General
      return {
        className: 'badge-default',
        icon: '•',
        label: status
      };
    }
  };

  const config = getStatusConfig();

  return (
    <span className={`status-badge ${config.className} badge-${size}`}>
      <span className="badge-icon">{config.icon}</span>
      <span className="badge-label">{config.label}</span>
    </span>
  );
};

export default StatusBadge;
