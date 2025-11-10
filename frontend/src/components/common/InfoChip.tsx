/**
 * InfoChip - Componente para mostrar información enriquecida de forma visual
 * Usado para mostrar nombres de despachos, peritos, salas, etc.
 */
import React from 'react';
import './InfoChip.css';

interface InfoChipProps {
  icon?: string;
  label: string;
  value: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'purple' | 'teal';
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
}

const InfoChip: React.FC<InfoChipProps> = ({
  icon,
  label,
  value,
  variant = 'primary',
  size = 'medium',
  onClick
}) => {
  const isClickable = !!onClick;

  return (
    <div
      className={`info-chip chip-${variant} chip-${size} ${isClickable ? 'chip-clickable' : ''}`}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {icon && <span className="chip-icon">{icon}</span>}
      <div className="chip-content">
        <span className="chip-label">{label}</span>
        <span className="chip-value">{value}</span>
      </div>
    </div>
  );
};

export default InfoChip;
