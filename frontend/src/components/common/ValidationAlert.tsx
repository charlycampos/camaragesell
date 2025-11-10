/**
 * ValidationAlert - Componente para mostrar errores y advertencias de validación
 * Diseño impactante con animaciones
 */
import React from 'react';
import './ValidationAlert.css';

export interface ValidationError {
  message: string;
  type?: 'error' | 'warning' | 'info';
}

interface ValidationAlertProps {
  errors: string[];
  warnings?: string[];
  onClose?: () => void;
  className?: string;
}

const ValidationAlert: React.FC<ValidationAlertProps> = ({
  errors,
  warnings = [],
  onClose,
  className = ''
}) => {
  if (errors.length === 0 && warnings.length === 0) {
    return null;
  }

  return (
    <div className={`validation-alert-container ${className}`}>
      {/* Errores */}
      {errors.length > 0 && (
        <div className="validation-alert validation-error">
          <div className="alert-header">
            <div className="alert-icon-title">
              <span className="alert-icon">🚫</span>
              <h3 className="alert-title">
                {errors.length === 1 ? 'Error de Validación' : `${errors.length} Errores de Validación`}
              </h3>
            </div>
            {onClose && (
              <button className="alert-close" onClick={onClose} aria-label="Cerrar">
                ✕
              </button>
            )}
          </div>
          <div className="alert-body">
            <ul className="alert-list">
              {errors.map((error, index) => (
                <li key={index} className="alert-item">
                  <span className="alert-bullet">•</span>
                  <span className="alert-message">{error}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Advertencias */}
      {warnings.length > 0 && (
        <div className="validation-alert validation-warning">
          <div className="alert-header">
            <div className="alert-icon-title">
              <span className="alert-icon">⚠️</span>
              <h3 className="alert-title">
                {warnings.length === 1 ? 'Advertencia' : `${warnings.length} Advertencias`}
              </h3>
            </div>
            {onClose && (
              <button className="alert-close" onClick={onClose} aria-label="Cerrar">
                ✕
              </button>
            )}
          </div>
          <div className="alert-body">
            <ul className="alert-list">
              {warnings.map((warning, index) => (
                <li key={index} className="alert-item">
                  <span className="alert-bullet">•</span>
                  <span className="alert-message">{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationAlert;
