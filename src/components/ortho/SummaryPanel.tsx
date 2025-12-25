import { useMemo, forwardRef } from 'react';
import { FileText, Package, Wrench, Building2, FileCheck } from 'lucide-react';
import { ActiveProcedure } from '@/types/procedure';

interface SummaryPanelProps {
  activeProcedures: ActiveProcedure[];
  materialType: string;
  hospitalName: string;
  dcNo: string;
}

interface SummaryItem {
  name: string;
  sizes: { size: string; qty: number }[];
  procedure: string;
}

export const SummaryPanel = forwardRef<HTMLDivElement, SummaryPanelProps>(
  ({ activeProcedures, materialType, hospitalName, dcNo }, ref) => {
    const summaryData = useMemo(() => {
      const items: SummaryItem[] = [];
      const instruments = new Set<string>();

      activeProcedures.forEach((procedure) => {
        // Process selected items
        procedure.selectedItems.forEach((item, itemName) => {
          const displayName =
            materialType !== 'None' ? `${materialType} ${itemName}` : itemName;
          items.push({
            name: displayName,
            sizes: item.sizeQty.map((sq) => ({
              size: sq.size,
              qty: parseInt(sq.qty) || 1,
            })),
            procedure: procedure.name,
          });
        });

        // Process fixed items
        procedure.fixedItems.forEach((fixedItem) => {
          const isSelected = procedure.selectedFixedItems.get(fixedItem.name) ?? true;
          if (isSelected) {
            const editedQty = procedure.fixedQtyEdits.get(fixedItem.name) ?? fixedItem.qty;
            const displayName =
              materialType !== 'None' ? `${materialType} ${fixedItem.name}` : fixedItem.name;
            items.push({
              name: displayName,
              sizes: [{ size: '', qty: parseInt(editedQty) || 1 }],
              procedure: procedure.name,
            });
          }
        });

        // Collect instruments
        procedure.instruments.forEach((inst) => instruments.add(inst));
      });

      return { items, instruments: Array.from(instruments) };
    }, [activeProcedures, materialType]);

    const totalItems = summaryData.items.reduce(
      (acc, item) => acc + item.sizes.reduce((a, s) => a + s.qty, 0),
      0
    );

    // Calculate total instrument quantity by parsing numbers after "-"
    const totalInstrumentQty = summaryData.instruments.reduce((total, instrument) => {
      const match = instrument.match(/-\s*(\d+)$/);
      if (match) {
        return total + parseInt(match[1], 10);
      }
      // If no "-" found, count as 1
      return total + 1;
    }, 0);

    if (activeProcedures.length === 0) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
          <FileText className="w-16 h-16 mb-4 opacity-40" />
          <p className="text-lg font-medium">No procedures selected</p>
          <p className="text-sm mt-1">Select procedures from the left to see the summary</p>
        </div>
      );
    }

    return (
      <div ref={ref} className="space-y-6">
        {/* Header Info */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/50 border-[3px] border-border/80">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Hospital</p>
              <p className="font-medium">{hospitalName || 'Not specified'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FileCheck className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">DC No.</p>
              <p className="font-medium">{dcNo || 'Not specified'}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-primary/10 border-[3px] border-primary/40 text-center">
            <p className="text-2xl font-bold text-primary">{activeProcedures.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Procedures</p>
          </div>
          <div className="p-4 rounded-xl bg-accent/10 border-[3px] border-accent/40 text-center">
            <p className="text-2xl font-bold text-accent">{totalItems}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Items</p>
          </div>
          <div className="p-4 rounded-xl bg-success/10 border-[3px] border-success/40 text-center">
            <p className="text-2xl font-bold text-success">{totalInstrumentQty}</p>
            <p className="text-xs text-muted-foreground mt-1">Instruments</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="rounded-xl border-[3px] border-border/80 overflow-hidden">
          <div className="p-3 bg-muted/50 border-b-[3px] border-border/80 flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            <h3 className="font-medium">Items Summary</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-[2px] border-border/80 bg-muted/30">
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Item Name</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Procedure</th>
                  <th className="text-center p-3 text-xs font-semibold text-muted-foreground">Size</th>
                  <th className="text-center p-3 text-xs font-semibold text-muted-foreground">Qty</th>
                </tr>
              </thead>
              <tbody>
                {summaryData.items.map((item, index) => {
                  const hasSizes = item.sizes.length > 0 && item.sizes[0].size;
                  const totalQty = item.sizes.reduce((a, s) => a + s.qty, 0);
                  
                  if (hasSizes) {
                    // Render each size/qty as a separate row
                    return item.sizes.map((s, sizeIndex) => (
                      <tr 
                        key={`${item.name}-${index}-${sizeIndex}`} 
                        className="border-b-[1px] border-border/50 hover:bg-muted/20 transition-colors"
                      >
                        {sizeIndex === 0 ? (
                          <>
                            <td className="p-3 text-sm font-medium align-top" rowSpan={item.sizes.length}>
                              {item.name}
                            </td>
                            <td className="p-3 text-xs text-muted-foreground align-top" rowSpan={item.sizes.length}>
                              {item.procedure}
                            </td>
                          </>
                        ) : null}
                        <td className="p-3 text-sm text-center">{s.size || '-'}</td>
                        <td className="p-3 text-sm font-semibold text-center">{s.qty}</td>
                      </tr>
                    ));
                  } else {
                    // Single row for items without sizes
                    return (
                      <tr 
                        key={`${item.name}-${index}`} 
                        className="border-b-[1px] border-border/50 hover:bg-muted/20 transition-colors"
                      >
                        <td className="p-3 text-sm font-medium">{item.name}</td>
                        <td className="p-3 text-xs text-muted-foreground">{item.procedure}</td>
                        <td className="p-3 text-sm text-center">-</td>
                        <td className="p-3 text-sm font-semibold text-center">{totalQty}</td>
                      </tr>
                    );
                  }
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Instruments */}
        {summaryData.instruments.length > 0 && (
          <div className="rounded-xl border-[3px] border-border/80 overflow-hidden">
            <div className="p-3 bg-muted/50 border-b-[3px] border-border/80 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-primary" />
              <h3 className="font-medium">Instruments</h3>
            </div>
            <div className="p-3 flex flex-wrap gap-2">
              {summaryData.instruments.map((instrument) => (
                <span
                  key={instrument}
                  className="px-3 py-1.5 rounded-full text-sm bg-secondary text-secondary-foreground"
                >
                  {instrument}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

SummaryPanel.displayName = 'SummaryPanel';
