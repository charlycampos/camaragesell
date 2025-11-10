/**
 * Barra de Búsqueda Reutilizable
 */
import { useState, useEffect } from 'react';
import './SearchBar.css';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (searchTerm: string) => void;
  debounceMs?: number;
  initialValue?: string;
}

export const SearchBar = ({
  placeholder = 'Buscar...',
  onSearch,
  debounceMs = 500,
  initialValue = ''
}: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, onSearch, debounceMs]);

  const handleClear = () => {
    setSearchTerm('');
  };

  return (
    <div className="search-bar">
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button className="search-clear-btn" onClick={handleClear} title="Limpiar">
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
