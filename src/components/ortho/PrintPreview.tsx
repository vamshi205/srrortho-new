import { forwardRef, useMemo } from 'react';
import { ActiveProcedure } from '@/types/procedure';

interface PrintPreviewProps {
  activeProcedures: ActiveProcedure[];
  materialType: string;
  hospitalName: string;
  dcNo: string;
}

interface PrintItem {
  name: string;
  description: string;
  qty: number;
  procedure: string;
}

export const PrintPreview = forwardRef<HTMLDivElement, PrintPreviewProps>(
  ({ activeProcedures, materialType, hospitalName, dcNo }, ref) => {
    const printItems = useMemo(() => {
      const items: PrintItem[] = [];

      activeProcedures.forEach((procedure) => {
        // Selected items with sizes
        procedure.selectedItems.forEach((item, itemName) => {
          const displayName =
            materialType !== 'None' ? `${materialType} ${itemName}` : itemName;

          item.sizeQty.forEach((sq) => {
            items.push({
              name: displayName,
              description: sq.size ? `Size: ${sq.size}` : '',
              qty: parseInt(sq.qty) || 1,
              procedure: procedure.name,
            });
          });

          if (item.sizeQty.length === 0) {
            items.push({
              name: displayName,
              description: '',
              qty: 1,
              procedure: procedure.name,
            });
          }
        });

        // Fixed items
        procedure.fixedItems.forEach((fixedItem) => {
          const isSelected = procedure.selectedFixedItems.get(fixedItem.name) ?? true;
          if (isSelected) {
            const editedQty = procedure.fixedQtyEdits.get(fixedItem.name) ?? fixedItem.qty;
            const displayName =
              materialType !== 'None' ? `${materialType} ${fixedItem.name}` : fixedItem.name;
            items.push({
              name: displayName,
              description: '',
              qty: parseInt(editedQty) || 1,
              procedure: procedure.name,
            });
          }
        });
      });

      return items;
    }, [activeProcedures, materialType]);

    const allInstruments = useMemo(() => {
      const instruments = new Set<string>();
      activeProcedures.forEach((p) => p.instruments.forEach((i) => instruments.add(i)));
      return Array.from(instruments);
    }, [activeProcedures]);

    const today = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    return (
      <div
        ref={ref}
        className="bg-white text-black w-full max-w-[210mm]"
        style={{ 
          fontFamily: 'Arial, sans-serif',
          pageBreakInside: 'avoid',
          pageBreakAfter: 'avoid',
          pageBreakBefore: 'avoid',
          margin: '0 auto',
          padding: '0.5cm 1cm 0.5cm 1cm'
        }}
      >
        {/* Header */}
        <div className="text-center mb-1.5 border-b-2 border-black pb-1" style={{ pageBreakInside: 'avoid', marginTop: 0, paddingTop: 0 }}>
          <h1 className="text-lg font-bold mb-0.5">SRR ORTHO IMPLANTS</h1>
          <p className="text-[10px]">Orthopedic Implant Delivery Challan</p>
        </div>

        {/* Info Section */}
        <div className="grid grid-cols-2 gap-2 mb-2 text-[10px]" style={{ pageBreakInside: 'avoid' }}>
          <div>
            <p>
              <strong>Hospital:</strong> {hospitalName || '___________________'}
            </p>
            <p className="mt-1">
              <strong>DC No:</strong> {dcNo || '___________________'}
            </p>
          </div>
          <div className="text-right">
            <p>
              <strong>Date:</strong> {today}
            </p>
            <p className="mt-1">
              <strong>Procedures:</strong>{' '}
              {activeProcedures.map((p) => p.name).join(', ')}
            </p>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full border-collapse text-[10px] mb-2" style={{ pageBreakInside: 'avoid' }}>
          <thead style={{ display: 'table-header-group' }}>
            <tr className="bg-gray-100">
              <th className="border border-black p-1 text-left w-8" style={{ pageBreakInside: 'avoid' }}>S.No</th>
              <th className="border border-black p-1 text-left" style={{ pageBreakInside: 'avoid' }}>Item Description</th>
              <th className="border border-black p-1 text-left w-24" style={{ pageBreakInside: 'avoid' }}>Size/Details</th>
              <th className="border border-black p-1 text-center w-10" style={{ pageBreakInside: 'avoid' }}>Qty</th>
            </tr>
          </thead>
          <tbody>
            {printItems.map((item, index) => (
              <tr key={index} style={{ pageBreakInside: 'avoid' }}>
                <td className="border border-black p-1 text-center">{index + 1}</td>
                <td className="border border-black p-1">{item.name}</td>
                <td className="border border-black p-1">{item.description}</td>
                <td className="border border-black p-1 text-center font-semibold">
                  {item.qty}
                </td>
              </tr>
            ))}
            {printItems.length === 0 && (
              <tr>
                <td colSpan={4} className="border border-black p-2 text-center text-gray-500">
                  No items selected
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Instruments */}
        {allInstruments.length > 0 && (
          <div className="mb-1.5" style={{ pageBreakInside: 'avoid' }}>
            <h3 className="font-bold mb-0.5 text-[10px]">Instruments Required:</h3>
            <p className="text-[10px]">{allInstruments.join(', ')}</p>
          </div>
        )}

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-3 mt-2 pt-1" style={{ pageBreakInside: 'avoid', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <div className="text-center">
            <div className="border-t border-black pt-1 mt-4">
              <p className="text-[10px] font-semibold">Receiver's Signature</p>
              <p className="text-[9px] text-gray-600">Name & Date</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-black pt-1 mt-4">
              <p className="text-[10px] font-semibold">Authorized Signature</p>
              <p className="text-[9px] text-gray-600">SRR Ortho Implants</p>
            </div>
          </div>
        </div>

        {/* Footer - System Generated Notice */}
        <div className="mt-1 pt-0.5 text-center text-[9px] text-gray-500" style={{ pageBreakInside: 'avoid' }}>
          <p>This is a system-generated delivery challan.</p>
        </div>
      </div>
    );
  }
);

PrintPreview.displayName = 'PrintPreview';
