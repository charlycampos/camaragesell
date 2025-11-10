/**
 * Panel de Filtros Reutilizable
 */
import { useState } from 'react';
import './FilterPanel.css';

export interface FilterOption {
  label: string;
  value: string | number;
}

export interface Filter {
  name: string;
  label: string;
  type: 'select' | 'date' | 'text';
  options?: FilterOption[];
  placeholder?: string;
}

interface FilterPanelProps {
  filters: Filter[];
  onApplyFilters: (filters: Record<string, any>) => void;
  onClearFilters: () => void;
}

export const FilterPanel = ({ filters, onApplyFilters, onClearFilters }: FilterPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});

  const handleFilterChange = (name: string, value: any) => {
    const newFilters = { ...filterValues, [name]: value };
    setFilterValues(newFilters);
  };

  const handleApply = () => {
    // Filtrar valores vacíos
    const activeFilters = Object.fromEntries(
      Object.entries(filterValues).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
    );
    onApplyFilters(activeFilters);
    setIsOpen(false);
  };

  const handleClear = () => {
    setFilterValues({});
    onClearFilters();
  };

  const activeFilterCount = Object.values(filterValues).filter(v => v !== '' && v !== null && v !== undefined).length;

  return (
    <div className="filter-panel">
      <button className="filter-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
        <span className="filter-icon">🎛️</span>
        <span>Filtros</span>
        {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
        <span className="filter-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="filter-dropdown">
          <div className="filter-header">
            <h4>Filtrar resultados</h4>
            <button className="filter-clear" onClick={handleClear}>
              Limpiar todo
            </button>
          </div>

          <div className="filter-grid">
            {filters.map((filter) => (
              <div key={filter.name} className="filter-item">
                <label htmlFor={filter.name}>{filter.label}</label>

                {filter.type === 'select' && (
                  <select
                    id={filter.name}
                    value={filterValues[filter.name] || ''}
                    onChange={(e) => handleFilterChange(filter.name, e.target.value)}
                    className="filter-select"
                  >
                    <option value="">Todos</option>
                    {filter.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}

                {filter.type === 'date' && (
                  <input
                    type="date"
                    id={filter.name}
                    value={filterValues[filter.name] || ''}
                    onChange={(e) => handleFilterChange(filter.name, e.target.value)}
                    className="filter-input"
                  />
                )}

                {filter.type === 'text' && (
                  <input
                    type="text"
                    id={filter.name}
                    value={filterValues[filter.name] || ''}
                    onChange={(e) => handleFilterChange(filter.name, e.target.value)}
                    placeholder={filter.placeholder}
                    className="filter-input"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="filter-actions">
            <button className="btn-apply" onClick={handleApply}>
              Aplicar Filtros
            </button>
            <button className="btn-cancel" onClick={() => setIsOpen(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
