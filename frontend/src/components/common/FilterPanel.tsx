/**
 * Panel de Filtros Reutilizable - Refactorizado con Tailwind
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Filter as FilterIcon, X, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FilterIcon className="h-4 w-4" />
          <span>Filtros</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {activeFilterCount}
            </Badge>
          )}
          <ChevronDown className="h-4 w-4 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="start">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b">
            <h4 className="font-medium text-sm">Filtrar resultados</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3 mr-1" />
              Limpiar todo
            </Button>
          </div>

          {/* Filter Grid */}
          <div className="grid gap-4">
            {filters.map((filter) => (
              <div key={filter.name} className="space-y-2">
                <Label htmlFor={filter.name} className="text-sm font-medium">
                  {filter.label}
                </Label>

                {filter.type === 'select' && (
                  <Select
                    value={filterValues[filter.name] || ''}
                    onValueChange={(value) => handleFilterChange(filter.name, value)}
                  >
                    <SelectTrigger id={filter.name}>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      {filter.options?.map((option) => (
                        <SelectItem key={option.value} value={String(option.value)}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {filter.type === 'date' && (
                  <Input
                    type="date"
                    id={filter.name}
                    value={filterValues[filter.name] || ''}
                    onChange={(e) => handleFilterChange(filter.name, e.target.value)}
                  />
                )}

                {filter.type === 'text' && (
                  <Input
                    type="text"
                    id={filter.name}
                    value={filterValues[filter.name] || ''}
                    onChange={(e) => handleFilterChange(filter.name, e.target.value)}
                    placeholder={filter.placeholder}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-3 border-t">
            <Button onClick={handleApply} className="flex-1">
              Aplicar Filtros
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FilterPanel;
