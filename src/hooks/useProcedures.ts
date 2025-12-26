import { useState, useEffect, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import Fuse from 'fuse.js';
import { Procedure } from '@/types/procedure';

const SHEETS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQu2GZRYcJnEjFaDryWHowegMFVkf8xzewGsEKqNLw7onpe1if24LnJrIZAl4CB5QdgVFjE1PqFYmUa/pub?output=csv';

export function useProcedures() {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [procedureTypes, setProcedureTypes] = useState<string[]>(['All']);
  
  const procedureFuse = useRef<Fuse<Procedure> | null>(null);
  const itemFuse = useRef<Fuse<string> | null>(null);
  const instrumentFuse = useRef<Fuse<string> | null>(null);

  // Image mapping - fallback if not in Google Sheets
  const instrumentImageMap: Record<string, string> = {
    // Add instrument images here as fallback
    // Format: "Instrument Name": "Image URL"
  };
  
  const fixedItemImageMap: Record<string, string> = {
    // Add fixed item images here as fallback
    // Format: "Fixed Item Name": "Image URL"
  };
  
  const itemImageMap: Record<string, string> = {
    // Add selectable item images here as fallback
    // Format: "Item Name": "Image URL"
  };

  const parseProcedures = useCallback((data: string[][]): Procedure[] => {
    return data
      .filter((row) => row[0]?.trim()) // Filter rows with a procedure name
      .map((row) => {
        // Parse columns directly from array (matching implant-checklist format)
        // [name, items, fixedItems, fixedQty, instruments, type, instrumentImages, fixedItemImages, itemImages]
        const [name, items, fixedItems, fixedQty, instruments, type, instrumentImages, fixedItemImages, itemImages] = row;
        
        // Parse fixed items and qtys strictly by | only
        const fixedItemsArr = fixedItems ? fixedItems.split('|').map(s => s.trim()).filter(Boolean) : [];
        const fixedQtyArr = fixedQty ? fixedQty.split('|').map(s => s.trim()).filter(Boolean) : [];
        const fixedList = fixedItemsArr.map((item, idx) => ({ 
          name: item, 
          qty: fixedQtyArr[idx] || '1' 
        }));
        
        // Parse editable items (from Items column only, pipe-separated)
        const editableItems = items
          ? items.split('|').map(item => item.trim()).filter(Boolean)
          : [];
        
        // Parse instruments and their images
        const instrumentsArr = instruments 
          ? instruments.split('|').map(inst => inst.trim()).filter(Boolean) 
          : [];
        const instrumentImagesArr = instrumentImages 
          ? instrumentImages.split('|').map(url => url.trim()).filter(Boolean) 
          : [];
        
        // Parse fixed item images
        const fixedItemImagesArr = fixedItemImages 
          ? fixedItemImages.split('|').map(url => url.trim()).filter(Boolean) 
          : [];
        
        // Parse selectable item images
        const itemImagesArr = itemImages 
          ? itemImages.split('|').map(url => url.trim()).filter(Boolean) 
          : [];
        
        // Create instrument-image mapping for this procedure
        const instrumentImageMapping: Record<string, string | null> = {};
        instrumentsArr.forEach((inst, idx) => {
          instrumentImageMapping[inst] = instrumentImagesArr[idx] || instrumentImageMap[inst] || null;
        });
        
        // Create fixed item-image mapping for this procedure
        const fixedItemImageMapping: Record<string, string | null> = {};
        fixedItemsArr.forEach((item, idx) => {
          fixedItemImageMapping[item] = fixedItemImagesArr[idx] || fixedItemImageMap[item] || null;
        });
        
        // Create selectable item-image mapping for this procedure
        const itemImageMapping: Record<string, string | null> = {};
        editableItems.forEach((item, idx) => {
          // Extract item name without size/qty pattern for matching
          const itemName = item.match(/^(.+?)\s*\{/)?.[1]?.trim() || item.trim();
          itemImageMapping[itemName] = itemImagesArr[idx] || itemImageMap[itemName] || null;
        });
        
        return {
          name: name.trim(),
          items: editableItems,
          fixedItems: fixedList,
          instruments: instrumentsArr,
          type: type ? type.trim() : 'General',
          instrumentImageMapping,
          fixedItemImageMapping,
          itemImageMapping,
        };
      });
  }, []);

  const processParsedData = useCallback((parsed: Procedure[]) => {
    setProcedures(parsed);

    // Extract unique types - add "None" first as default, then "All", then other types
    const types = ['None', 'All', ...new Set(parsed.map((p) => p.type).filter(Boolean))];
    setProcedureTypes(types);

    // Setup Fuse instances
    procedureFuse.current = new Fuse(parsed, {
      keys: ['name'],
      threshold: 0.4,
    });

    const allItems = parsed.flatMap((p) => p.items);
    itemFuse.current = new Fuse([...new Set(allItems)], { threshold: 0.4 });

    const allInstruments = parsed.flatMap((p) => p.instruments);
    instrumentFuse.current = new Fuse([...new Set(allInstruments)], { threshold: 0.4 });

    setLoading(false);
  }, []);

  const fetchProcedures = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(SHEETS_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      const csvText = await response.text();

      // Parse without headers (like implant-checklist) - Google Sheets CSV uses array format
      Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          // Skip header row (first row), parse remaining rows as arrays
          const rows = results.data.slice(1) as string[][];
          const parsed = parseProcedures(rows);
          processParsedData(parsed);
        },
        error: (err: any) => {
          setError(err.message);
          setLoading(false);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch procedures');
      setLoading(false);
    }
  }, [parseProcedures, processParsedData]);

  const refetchSingleProcedure = useCallback(
    async (procedureName: string): Promise<Procedure | null> => {
      try {
        const response = await fetch(SHEETS_URL);
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }
        const csvText = await response.text();

        return new Promise((resolve) => {
          Papa.parse(csvText, {
            header: false,
            skipEmptyLines: true,
            complete: (results) => {
              // Skip header row, parse remaining rows as arrays
              const rows = results.data.slice(1) as string[][];
              const parsed = parseProcedures(rows);
              const found = parsed.find((p) => p.name === procedureName);
              if (found) {
                setProcedures((prev) =>
                  prev.map((p) => (p.name === procedureName ? found : p))
                );
              }
              resolve(found || null);
            },
            error: () => resolve(null),
          });
        });
      } catch {
        return null;
      }
    },
    [parseProcedures]
  );

  const searchProcedures = useCallback(
    (query: string, type?: string): Procedure[] => {
      // If "None" is selected and no search query, return empty array
      // But if there's a search query, allow searching
      if (type === 'None' && !query) {
        return [];
      }

      let results = procedures;

      if (query && procedureFuse.current) {
        results = procedureFuse.current.search(query).map((r) => r.item);
      }

      // If "None" is selected but there's a search query, show search results
      // Otherwise, filter by type if specified
      if (type && type !== 'All' && type !== 'None') {
        results = results.filter((p) => p.type === type);
      }

      return results;
    },
    [procedures]
  );

  const searchItems = useCallback((query: string): string[] => {
    if (!query || !itemFuse.current) return [];
    return itemFuse.current.search(query).map((r) => r.item);
  }, []);

  const searchInstruments = useCallback((query: string): string[] => {
    if (!query || !instrumentFuse.current) return [];
    return instrumentFuse.current.search(query).map((r) => r.item);
  }, []);

  useEffect(() => {
    fetchProcedures();
  }, [fetchProcedures]);

  return {
    procedures,
    loading,
    error,
    procedureTypes,
    fetchProcedures,
    refetchSingleProcedure,
    searchProcedures,
    searchItems,
    searchInstruments,
  };
}
