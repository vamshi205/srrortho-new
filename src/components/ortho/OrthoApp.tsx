import { useState, useRef, useCallback, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import { Activity, Printer, Download, Trash2, X, Settings2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { procedures, loading, procedureTypes, refetchSingleProcedure, searchProcedures, searchInstruments, searchItems } = useProcedures();

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
        instrumentImageMapping: procedure.instrumentImageMapping || {},
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
            instrumentImageMapping: updated.instrumentImageMapping || p.instrumentImageMapping || {}
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
