import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import { Activity, Printer, Download, Trash2, X, Settings2, Plus, ChevronDown, ChevronUp, Wrench, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LoginScreen } from '@/components/ortho/LoginScreen';
import { ProcedureSelector } from '@/components/ortho/ProcedureSelector';
import { ProcedureCard } from '@/components/ortho/ProcedureCard';
import { SummaryPanel } from '@/components/ortho/SummaryPanel';
import { PrintPreview } from '@/components/ortho/PrintPreview';
import { useProcedures } from '@/hooks/useProcedures';
import { Procedure, ActiveProcedure, SizeQty } from '@/types/procedure';

export default function OrthoApp() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { procedures, loading, procedureTypes, refetchSingleProcedure, searchProcedures, searchInstruments, searchItems, fetchProcedures } = useProcedures();

  // Initialize with empty array - no procedures selected by default
  const [activeProcedures, setActiveProcedures] = useState<ActiveProcedure[]>([]);
  const [collapsedProcedures, setCollapsedProcedures] = useState<Set<string>>(new Set());
  const [materialType, setMaterialType] = useState('SS');
  const [hospitalName, setHospitalName] = useState('');
  const [dcNo, setDcNo] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProcedureSelector, setShowProcedureSelector] = useState(false);
  const [initialFilterType, setInitialFilterType] = useState<string>('None');
  const [showSummaryMobile, setShowSummaryMobile] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  // Ensure no procedures are selected on mount and after login
  useEffect(() => {
    setActiveProcedures([]);
  }, []);

  // Clear procedures and show selector with "None" filter when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      setActiveProcedures([]);
      setShowProcedureSelector(true);
      setInitialFilterType('None');
    }
  }, [isAuthenticated]);

  const handleSelectProcedure = useCallback((procedure: Procedure) => {
    setActiveProcedures((prev) => {
      const exists = prev.find((p) => p.name === procedure.name);
      if (exists) {
        const newProcedures = prev.filter((p) => p.name !== procedure.name);
        // Show selector if no procedures left
        if (newProcedures.length === 0) {
          setShowProcedureSelector(true);
        }
        return newProcedures;
      }
      const activeProcedure: ActiveProcedure = {
        ...procedure,
        selectedItems: new Map(),
        selectedFixedItems: new Map(procedure.fixedItems.map((fi) => [fi.name, true])),
        fixedQtyEdits: new Map(),
        boxNumbers: [],
        instrumentImageMapping: procedure.instrumentImageMapping || {},
        fixedItemImageMapping: procedure.fixedItemImageMapping || {},
        itemImageMapping: procedure.itemImageMapping || {},
        instrumentLocationMapping: procedure.instrumentLocationMapping || {},
        fixedItemLocationMapping: procedure.fixedItemLocationMapping || {},
        itemLocationMapping: procedure.itemLocationMapping || {},
      };
      // Hide selector when a procedure is selected
      setShowProcedureSelector(false);
      return [...prev, activeProcedure];
    });
  }, []);

  const handleRemoveProcedure = useCallback((name: string) => {
    setActiveProcedures((prev) => {
      const newProcedures = prev.filter((p) => p.name !== name);
      // Show selector if no procedures left
      if (newProcedures.length === 0) {
        setShowProcedureSelector(true);
        setInitialFilterType('None');
      }
      return newProcedures;
    });
  }, []);

  const handleRefreshProcedure = useCallback(async (name: string) => {
    const updated = await refetchSingleProcedure(name);
    if (updated) {
      setActiveProcedures((prev) =>
        prev.map((p) =>
          p.name === name ? { 
            ...p, 
            ...updated, 
            selectedItems: p.selectedItems, 
            selectedFixedItems: p.selectedFixedItems, 
            fixedQtyEdits: p.fixedQtyEdits,
            boxNumbers: p.boxNumbers || [],
            instrumentImageMapping: updated.instrumentImageMapping || p.instrumentImageMapping || {},
            fixedItemImageMapping: updated.fixedItemImageMapping || p.fixedItemImageMapping || {},
            itemImageMapping: updated.itemImageMapping || p.itemImageMapping || {},
            instrumentLocationMapping: updated.instrumentLocationMapping || p.instrumentLocationMapping || {},
            fixedItemLocationMapping: updated.fixedItemLocationMapping || p.fixedItemLocationMapping || {},
            itemLocationMapping: updated.itemLocationMapping || p.itemLocationMapping || {}
          } : p
        )
      );
    }
  }, [refetchSingleProcedure]);

  const handleItemToggle = useCallback((procedureName: string, itemName: string, checked: boolean) => {
    setActiveProcedures((prev) =>
      prev.map((p) => {
        if (p.name !== procedureName) return p;
        const newMap = new Map(p.selectedItems);
        if (checked) {
          newMap.set(itemName, { itemName, sizeQty: [] });
        } else {
          newMap.delete(itemName);
        }
        return { ...p, selectedItems: newMap };
      })
    );
  }, []);

  const handleSizeQtyChange = useCallback((procedureName: string, itemName: string, sizeQty: SizeQty[]) => {
    setActiveProcedures((prev) =>
      prev.map((p) => {
        if (p.name !== procedureName) return p;
        const newMap = new Map(p.selectedItems);
        newMap.set(itemName, { itemName, sizeQty });
        return { ...p, selectedItems: newMap };
      })
    );
  }, []);

  const handleFixedItemToggle = useCallback((procedureName: string, itemName: string, checked: boolean) => {
    setActiveProcedures((prev) =>
      prev.map((p) => {
        if (p.name !== procedureName) return p;
        const newMap = new Map(p.selectedFixedItems);
        newMap.set(itemName, checked);
        return { ...p, selectedFixedItems: newMap };
      })
    );
  }, []);

  const handleFixedQtyChange = useCallback((procedureName: string, itemName: string, qty: string) => {
    setActiveProcedures((prev) =>
      prev.map((p) => {
        if (p.name !== procedureName) return p;
        const newMap = new Map(p.fixedQtyEdits);
        newMap.set(itemName, qty);
        return { ...p, fixedQtyEdits: newMap };
      })
    );
  }, []);

  const handleAddInstrument = useCallback((procedureName: string, instrument: string) => {
    setActiveProcedures((prev) =>
      prev.map((p) => {
        if (p.name !== procedureName) return p;
        if (p.instruments.includes(instrument)) return p;
        return { ...p, instruments: [...p.instruments, instrument] };
      })
    );
  }, []);

  const handleRemoveInstrument = useCallback((procedureName: string, instrument: string) => {
    setActiveProcedures((prev) =>
      prev.map((p) => {
        if (p.name !== procedureName) return p;
        return { ...p, instruments: p.instruments.filter((i) => i !== instrument) };
      })
    );
  }, []);

  const handleAddItem = useCallback((procedureName: string, itemName: string) => {
    setActiveProcedures((prev) =>
      prev.map((p) => {
        if (p.name === procedureName && !p.items.includes(itemName)) {
          return { ...p, items: [...p.items, itemName] };
        }
        return p;
      })
    );
  }, []);

  const handleRemoveFixedItemPart = useCallback((procedureName: string, itemName: string, partToRemove: string) => {
    setActiveProcedures((prev) =>
      prev.map((p) => {
        if (p.name !== procedureName) return p;
        
        // Find the fixed item and remove the part
        const updatedFixedItems = p.fixedItems.map((item) => {
          if (item.name === itemName) {
            const partToRemoveTrimmed = partToRemove.trim();
            
            // Simple approach: find the part in the string and remove it along with any comma
            // Handle cases like "120° DHS Plate Short Barrell 4hole,5hole,6hole"
            // The partToRemove might be just "4hole" but the actual part in the array is "120° DHS Plate Long Barrell 4hole"
            let newName = itemName;
            
            // Split by comma to get individual parts
            const parts = newName.split(',').map(p => p.trim());
            
            // Find which part contains the part to remove
            let foundAndRemoved = false;
            const updatedParts = parts.map((part, index) => {
              // If this is the part being removed
              if (part === partToRemoveTrimmed) {
                // First, try to detect if it has a suffix pattern (like "4hole", "5hole" at the end)
                // Pattern: space + number + word(s) at the end (e.g., " 4hole", " 5hole")
                const suffixPattern = /\s+(\d+\w+)$/; // Matches space + number + word at the end
                const match = part.match(suffixPattern);
                if (match) {
                  // Found a suffix pattern, remove just the suffix
                  const beforeSuffix = part.slice(0, -match[0].length).trim();
                  if (beforeSuffix.length > 0) {
                    foundAndRemoved = true;
                    return beforeSuffix;
                  }
                }
                
                // If no suffix pattern found, check if it's a short standalone part (like "5hole")
                // Remove the entire part if it's short and simple
                if (part.length < 15 && /^\d+\w+$/.test(part)) {
                  foundAndRemoved = true;
                  return null;
                }
                
                // Otherwise, if it's a longer part without a clear suffix pattern, remove the entire part
                foundAndRemoved = true;
                return null;
              }
              
              // If the part ends with the partToRemove and has content before it, remove just the suffix
              // This handles edge cases where partToRemove might be a substring
              if (part.endsWith(partToRemoveTrimmed) && part.length > partToRemoveTrimmed.length) {
                const charBeforeIndex = part.length - partToRemoveTrimmed.length - 1;
                const charBefore = charBeforeIndex >= 0 ? part[charBeforeIndex] : null;
                
                if (charBefore === ' ') {
                  const beforePart = part.slice(0, -partToRemoveTrimmed.length).trim();
                  if (beforePart.length > 0) {
                    foundAndRemoved = true;
                    return beforePart;
                  }
                }
              }
              
              return part;
            }).filter(p => p !== null && p.length > 0);
            
            if (updatedParts.length > 0 && foundAndRemoved) {
              // Join parts with commas
              newName = updatedParts.join(',');
            } else if (!foundAndRemoved) {
              // If we didn't find the part to remove, don't update
              return item;
            } else {
              // If all parts were removed, don't update
              return item;
            }
            
            // Only update if name actually changed
            if (newName !== itemName && newName.trim().length > 0) {
              // Update fixedQtyEdits if it exists
              const qtyMap = new Map(p.fixedQtyEdits);
              const oldQty = qtyMap.get(itemName);
              if (oldQty) {
                qtyMap.delete(itemName);
                qtyMap.set(newName.trim(), oldQty);
              }
              
              // Update selectedFixedItems
              const selectedMap = new Map(p.selectedFixedItems);
              const wasSelected = selectedMap.get(itemName);
              if (wasSelected !== undefined) {
                selectedMap.delete(itemName);
                selectedMap.set(newName.trim(), wasSelected);
              }
              
              return { ...item, name: newName.trim() };
            }
          }
          return item;
        });
        
        return { ...p, fixedItems: updatedFixedItems };
      })
    );
  }, []);

  const handleRemoveSelectableItemPart = useCallback((procedureName: string, itemName: string, partToRemove: string) => {
    setActiveProcedures((prev) =>
      prev.map((p) => {
        if (p.name !== procedureName) return p;
        
        // Update items array - find item and remove the part
        const updatedItems = p.items.map((item) => {
          // Parse the item to get the name
          const match = item.match(/^(.+?)\s*\{(.+)\}$/);
          if (match) {
            const name = match[1].trim();
            if (name === itemName) {
              const partToRemoveTrimmed = partToRemove.trim();
              
              // Simple approach: find the part in the string and remove it along with any comma
              let newName = name;
              
              // Try to find and remove the part with comma after it: "4hole,"
              const patternWithCommaAfter = partToRemoveTrimmed + ',';
              if (newName.includes(patternWithCommaAfter)) {
                newName = newName.replace(patternWithCommaAfter, '');
              } else {
                // Try to find and remove the part with comma before it: ",4hole"
                const patternWithCommaBefore = ',' + partToRemoveTrimmed;
                if (newName.includes(patternWithCommaBefore)) {
                  newName = newName.replace(patternWithCommaBefore, '');
                } else {
                  // Try to find if part is at the end of a word (like "4hole" in "120° DHS Plate Short Barrell 4hole")
                  const parts = newName.split(',').map(p => p.trim());
                  const updatedParts = parts.map(part => {
                    // If this is the part being removed
                    if (part === partToRemoveTrimmed) {
                      // First, try to detect if it has a suffix pattern (like "4hole", "5hole" at the end)
                      // Pattern: space + number + word(s) at the end (e.g., " 4hole", " 5hole")
                      const suffixPattern = /\s+(\d+\w+)$/; // Matches space + number + word at the end
                      const match = part.match(suffixPattern);
                      if (match) {
                        // Found a suffix pattern, remove just the suffix
                        const beforeSuffix = part.slice(0, -match[0].length).trim();
                        if (beforeSuffix.length > 0) {
                          return beforeSuffix;
                        }
                      }
                      
                      // If no suffix pattern found, check if it's a short standalone part (like "5hole")
                      // Remove the entire part if it's short and simple
                      if (part.length < 15 && /^\d+\w+$/.test(part)) {
                        return null;
                      }
                      
                      // Otherwise, if it's a longer part without a clear suffix pattern, remove the entire part
                      return null;
                    }
                    
                    // If the part ends with the partToRemove and has content before it, remove just the suffix
                    if (part.endsWith(partToRemoveTrimmed) && part.length > partToRemoveTrimmed.length) {
                      const charBeforeIndex = part.length - partToRemoveTrimmed.length - 1;
                      const charBefore = charBeforeIndex >= 0 ? part[charBeforeIndex] : null;
                      
                      if (charBefore === ' ') {
                        const beforePart = part.slice(0, -partToRemoveTrimmed.length).trim();
                        return beforePart.length > 0 ? beforePart : null;
                      }
                    }
                    
                    return part;
                  }).filter(p => p !== null && p.length > 0);
                  
                  if (updatedParts.length > 0) {
                    newName = updatedParts.join(',');
                  } else {
                    // If all parts were removed, don't update
                    return item;
                  }
                }
              }
              
              // Only update if name actually changed
              if (newName !== name && newName.trim().length > 0) {
                // Reconstruct the item string with new name
                return `${newName.trim()} {${match[2]}}`;
              }
            }
          } else {
            // Item without size/qty pattern
            if (item.trim() === itemName) {
              const partToRemoveTrimmed = partToRemove.trim();
              
              // Simple approach: find the part in the string and remove it along with any comma
              let newName = itemName;
              
              // Try to find and remove the part with comma after it: "4hole,"
              const patternWithCommaAfter = partToRemoveTrimmed + ',';
              if (newName.includes(patternWithCommaAfter)) {
                newName = newName.replace(patternWithCommaAfter, '');
              } else {
                // Try to find and remove the part with comma before it: ",4hole"
                const patternWithCommaBefore = ',' + partToRemoveTrimmed;
                if (newName.includes(patternWithCommaBefore)) {
                  newName = newName.replace(patternWithCommaBefore, '');
                } else {
                  // Try to find if part is at the end of a word
                  const parts = newName.split(',').map(p => p.trim());
                  const updatedParts = parts.map(part => {
                    // If this is the part being removed
                    if (part === partToRemoveTrimmed) {
                      // First, try to detect if it has a suffix pattern (like "4hole", "5hole" at the end)
                      // Pattern: space + number + word(s) at the end (e.g., " 4hole", " 5hole")
                      const suffixPattern = /\s+(\d+\w+)$/; // Matches space + number + word at the end
                      const match = part.match(suffixPattern);
                      if (match) {
                        // Found a suffix pattern, remove just the suffix
                        const beforeSuffix = part.slice(0, -match[0].length).trim();
                        if (beforeSuffix.length > 0) {
                          return beforeSuffix;
                        }
                      }
                      
                      // If no suffix pattern found, check if it's a short standalone part (like "5hole")
                      // Remove the entire part if it's short and simple
                      if (part.length < 15 && /^\d+\w+$/.test(part)) {
                        return null;
                      }
                      
                      // Otherwise, if it's a longer part without a clear suffix pattern, remove the entire part
                      return null;
                    }
                    
                    // If the part ends with the partToRemove and has content before it, remove just the suffix
                    if (part.endsWith(partToRemoveTrimmed) && part.length > partToRemoveTrimmed.length) {
                      const charBeforeIndex = part.length - partToRemoveTrimmed.length - 1;
                      const charBefore = charBeforeIndex >= 0 ? part[charBeforeIndex] : null;
                      
                      if (charBefore === ' ') {
                        const beforePart = part.slice(0, -partToRemoveTrimmed.length).trim();
                        return beforePart.length > 0 ? beforePart : null;
                      }
                    }
                    
                    return part;
                  }).filter(p => p !== null && p.length > 0);
                  
                  if (updatedParts.length > 0) {
                    newName = updatedParts.join(',');
                  } else {
                    // If all parts were removed, don't update
                    return item;
                  }
                }
              }
              
              // Only update if name actually changed
              if (newName !== itemName && newName.trim().length > 0) {
                return newName.trim();
              }
            }
          }
          return item;
        });
        
        // Update selectedItems map - find items that were updated
        const selectedMap = new Map(p.selectedItems);
        updatedItems.forEach((item) => {
          const match = item.match(/^(.+?)\s*\{(.+)\}$/);
          const newName = match ? match[1].trim() : item.trim();
          const oldItem = p.items.find((oldItem) => {
            const oldMatch = oldItem.match(/^(.+?)\s*\{(.+)\}$/);
            const oldName = oldMatch ? oldMatch[1].trim() : oldItem.trim();
            return oldName === itemName;
          });
          
          if (oldItem && newName !== itemName) {
            const selectedItem = selectedMap.get(itemName);
            if (selectedItem) {
              selectedMap.delete(itemName);
              selectedMap.set(newName, selectedItem);
            }
          }
        });
        
        return { ...p, items: updatedItems, selectedItems: selectedMap };
      })
    );
  }, []);

  const handlePrint = () => {
    if (!hospitalName || !dcNo) {
      setShowSettingsModal(true);
      return;
    }
    setShowPrintModal(true);
  };

  const handleSavePDF = async () => {
    if (!printRef.current) return;
    const opt = {
      margin: 10,
      filename: `SRR-Ortho-Implant-DC-${dcNo || 'draft'}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
    };
    await html2pdf().set(opt).from(printRef.current).save();
  };

  const handlePrintPDF = async () => {
    if (!printRef.current) return;
    const opt = {
      margin: 10,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
    };
    const pdf = await html2pdf().set(opt).from(printRef.current).outputPdf('blob');
    const blobUrl = URL.createObjectURL(pdf);
    const printWindow = window.open(blobUrl);
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleClearAll = () => {
    setActiveProcedures([]);
    setHospitalName('');
    setDcNo('');
    setShowProcedureSelector(true);
  };

  const handleAddBox = useCallback((procedureName: string, boxNumber: string) => {
    setActiveProcedures((prev) =>
      prev.map((p) => {
        if (p.name !== procedureName) return p;
        const trimmed = boxNumber.trim();
        if (trimmed && !p.boxNumbers.includes(trimmed)) {
          return { ...p, boxNumbers: [...p.boxNumbers, trimmed] };
        }
        return p;
      })
    );
  }, []);

  const handleRemoveBox = useCallback((procedureName: string, index: number) => {
    setActiveProcedures((prev) =>
      prev.map((p) => {
        if (p.name !== procedureName) return p;
        return { ...p, boxNumbers: p.boxNumbers.filter((_, i) => i !== index) };
      })
    );
  }, []);

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-hero overflow-x-hidden">
      {/* Header */}
      <header className="fixed md:sticky top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground flex-shrink-0">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="font-display font-bold text-sm sm:text-lg truncate">SRR Ortho Implant</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">DC Generator</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 sm:h-9 sm:w-9" 
                onClick={() => navigate('/admin')}
                title="Admin Panel"
              >
                <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
              <Select value={materialType} onValueChange={setMaterialType}>
                <SelectTrigger className="w-24 sm:w-32 h-8 sm:h-9 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SS">SS (Steel)</SelectItem>
                  <SelectItem value="Titanium">Titanium</SelectItem>
                  <SelectItem value="None">No Prefix</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 sm:h-9 sm:w-9" 
                onClick={() => {
                  fetchProcedures();
                }}
                title="Refresh data from Google Sheets"
                disabled={loading}
              >
                <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => setShowSettingsModal(true)}>
                <Settings2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={handleClearAll}>
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
              <Button onClick={handlePrint} className="btn-gradient h-8 sm:h-9 px-2 sm:px-4 text-xs sm:text-sm">
                <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Print</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pt-20 md:pt-6 overflow-x-hidden">
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left: Procedure Selection & Active Procedures */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 min-w-0">
            {/* Active Procedures - Show first if they exist */}
            {activeProcedures.length > 0 && (
              <div className="space-y-3 sm:space-y-4">
                <h2 className="font-display font-semibold text-base sm:text-lg">Active Procedures</h2>
                {activeProcedures.map((procedure) => (
                  <ProcedureCard
                    key={procedure.name}
                    procedure={procedure}
                    isCollapsed={collapsedProcedures.has(procedure.name)}
                    onToggleCollapse={() => setCollapsedProcedures((prev) => { const next = new Set(prev); next.has(procedure.name) ? next.delete(procedure.name) : next.add(procedure.name); return next; })}
                    onRemove={() => handleRemoveProcedure(procedure.name)}
                    onRefresh={() => handleRefreshProcedure(procedure.name)}
                    onItemToggle={(item, checked) => handleItemToggle(procedure.name, item, checked)}
                    onSizeQtyChange={(item, sq) => handleSizeQtyChange(procedure.name, item, sq)}
                    onFixedItemToggle={(item, checked) => handleFixedItemToggle(procedure.name, item, checked)}
                    onFixedQtyChange={(item, qty) => handleFixedQtyChange(procedure.name, item, qty)}
                    onAddInstrument={(inst) => handleAddInstrument(procedure.name, inst)}
                    onRemoveInstrument={(inst) => handleRemoveInstrument(procedure.name, inst)}
                    onAddItem={(item) => handleAddItem(procedure.name, item)}
                    onSearchItems={searchItems}
                    instrumentSuggestions={[]}
                    onSearchInstruments={searchInstruments}
                    onRemoveFixedItemPart={(item, part) => handleRemoveFixedItemPart(procedure.name, item, part)}
                    onRemoveSelectableItemPart={(item, part) => handleRemoveSelectableItemPart(procedure.name, item, part)}
                    onAddBox={(boxNumber) => handleAddBox(procedure.name, boxNumber)}
                    onRemoveBox={(index) => handleRemoveBox(procedure.name, index)}
                  />
                ))}
              </div>
            )}

            {/* Procedure Selector - Show full selector or compact button */}
            {showProcedureSelector ? (
              <div className="glass-card rounded-xl p-2.5 sm:p-4 min-w-0">
                <h2 className="font-display font-semibold text-base sm:text-lg mb-2 sm:mb-4">Select Procedures</h2>
                {loading ? (
                  <div className="py-12 text-center text-muted-foreground">Loading procedures...</div>
                ) : (
                  <ProcedureSelector
                    procedures={procedures}
                    procedureTypes={procedureTypes}
                    activeProcedureNames={activeProcedures.map((p) => p.name)}
                    onSelectProcedure={handleSelectProcedure}
                    searchProcedures={searchProcedures}
                    initialFilterType={initialFilterType}
                  />
                )}
              </div>
            ) : activeProcedures.length > 0 && (
              <div className="glass-card rounded-xl p-2.5 sm:p-4 flex items-center justify-center min-w-0">
                <Button
                  onClick={() => {
                    setInitialFilterType('All');
                    setShowProcedureSelector(true);
                  }}
                  className="btn-gradient w-full sm:w-auto"
                  size="lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Procedure
                </Button>
              </div>
            )}
          </div>

          {/* Right: Summary */}
          <div className="lg:col-span-1 min-w-0 lg:border-l lg:border-border lg:pl-6">
            {/* Mobile: Toggleable Summary */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setShowSummaryMobile(!showSummaryMobile)}
                className="w-full glass-card rounded-xl p-3 flex items-center justify-between"
              >
                <h2 className="font-display font-semibold text-base">Summary</h2>
                {showSummaryMobile ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
              {showSummaryMobile && (
                <div className="glass-card rounded-xl p-3 mt-4">
                  <SummaryPanel activeProcedures={activeProcedures} materialType={materialType} hospitalName={hospitalName} dcNo={dcNo} />
                </div>
              )}
            </div>

            {/* Desktop: Always visible Summary */}
            <div className="hidden lg:block">
              <div className="glass-card rounded-xl p-3 sm:p-4 sticky top-24">
                <h2 className="font-display font-semibold text-base sm:text-lg mb-3 sm:mb-4">Summary</h2>
                <SummaryPanel activeProcedures={activeProcedures} materialType={materialType} hospitalName={hospitalName} dcNo={dcNo} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>DC Details</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div><Label>Hospital Name</Label><Input value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} placeholder="Enter hospital name" className="mt-1" /></div>
            <div><Label>DC Number</Label><Input value={dcNo} onChange={(e) => setDcNo(e.target.value)} placeholder="Enter DC number" className="mt-1" /></div>
            <Button onClick={() => {
              if (hospitalName && dcNo) {
                setShowSettingsModal(false);
                setShowPrintModal(true);
              }
            }} className="w-full">Save & Continue</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print Modal */}
      <Dialog open={showPrintModal} onOpenChange={setShowPrintModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader className="no-print">
            <DialogTitle>Print Preview</DialogTitle>
          </DialogHeader>
          <div data-print-content>
            <PrintPreview ref={printRef} activeProcedures={activeProcedures} materialType={materialType} hospitalName={hospitalName} dcNo={dcNo} />
          </div>
          <div className="flex gap-3 mt-4 no-print" data-no-print>
            <Button onClick={handlePrintPDF} className="flex-1"><Printer className="w-4 h-4 mr-2" />Print</Button>
            <Button onClick={handleSavePDF} variant="outline" className="flex-1"><Download className="w-4 h-4 mr-2" />Save PDF</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
