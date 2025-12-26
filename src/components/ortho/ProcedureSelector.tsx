import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Plus, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Procedure } from '@/types/procedure';

interface ProcedureSelectorProps {
  procedures: Procedure[];
  procedureTypes: string[];
  activeProcedureNames: string[];
  onSelectProcedure: (procedure: Procedure) => void;
  searchProcedures: (query: string, type?: string) => Procedure[];
  initialFilterType?: string;
}

export function ProcedureSelector({
  procedures,
  procedureTypes,
  activeProcedureNames,
  onSelectProcedure,
  searchProcedures,
  initialFilterType,
}: ProcedureSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState(initialFilterType || 'None');

  // Reset filter when initialFilterType changes
  useEffect(() => {
    if (initialFilterType) {
      setSelectedType(initialFilterType);
    }
  }, [initialFilterType]);

  const filteredProcedures = useMemo(() => {
    return searchProcedures(searchQuery, selectedType);
  }, [searchQuery, selectedType, searchProcedures]);

  const hasActiveProcedures = activeProcedureNames.length > 0;
  // Reduce height when procedures are selected (both mobile and desktop)
  const maxHeight = hasActiveProcedures ? 'max-h-[200px] sm:max-h-[250px]' : 'max-h-[400px] sm:max-h-none';

  return (
    <div className="space-y-3 sm:space-y-4 w-full min-w-0">
      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full min-w-0">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          <Input
            placeholder="Search procedures..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 sm:pl-10 h-9 sm:h-11 text-sm sm:text-base input-modern w-full"
          />
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
          <div className="flex flex-wrap gap-1.5 sm:gap-2 overflow-x-auto pb-1 -mb-1 min-w-0">
            {procedureTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                  selectedType === type
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Procedures Grid - Scrollable on Mobile, Reduced height on mobile when procedures are selected */}
      <div className={`${maxHeight} overflow-y-auto sm:overflow-visible transition-all duration-300 w-full min-w-0`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 w-full min-w-0">
          {filteredProcedures.map((procedure, index) => {
            const isActive = activeProcedureNames.includes(procedure.name);
            return (
              <button
                key={procedure.name}
                onClick={() => onSelectProcedure(procedure)}
                className={`procedure-card text-left group ${isActive ? 'active' : ''} p-2.5 sm:p-4 w-full min-w-0`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm sm:text-base text-foreground truncate group-hover:text-primary transition-colors">
                      {procedure.name}
                    </h3>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                      <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0 sm:px-2 sm:py-0.5">
                        {procedure.type}
                      </Badge>
                      <span className="text-[10px] sm:text-xs text-muted-foreground">
                        {procedure.items.length} items
                      </span>
                    </div>
                  </div>
                  <div
                    className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                    }`}
                  >
                    {isActive ? <Check className="w-3 h-3 sm:w-4 sm:h-4" /> : <Plus className="w-3 h-3 sm:w-4 sm:h-4" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {filteredProcedures.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No procedures found matching your search</p>
        </div>
      )}
    </div>
  );
}
