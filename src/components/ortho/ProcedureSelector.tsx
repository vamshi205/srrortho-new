import { useState, useMemo } from 'react';
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
}

export function ProcedureSelector({
  procedures,
  procedureTypes,
  activeProcedureNames,
  onSelectProcedure,
  searchProcedures,
}: ProcedureSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('None');

  const filteredProcedures = useMemo(() => {
    return searchProcedures(searchQuery, selectedType);
  }, [searchQuery, selectedType, searchProcedures]);

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search procedures..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 input-modern"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <div className="flex flex-wrap gap-2">
            {procedureTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
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

      {/* Procedures Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredProcedures.map((procedure, index) => {
          const isActive = activeProcedureNames.includes(procedure.name);
          return (
            <button
              key={procedure.name}
              onClick={() => onSelectProcedure(procedure)}
              className={`procedure-card text-left group ${isActive ? 'active' : ''}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {procedure.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {procedure.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {procedure.items.length} items
                    </span>
                  </div>
                </div>
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                  }`}
                >
                  {isActive ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
              </div>
            </button>
          );
        })}
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
