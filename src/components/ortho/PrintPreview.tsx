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
        className="bg-white text-black p-8 min-h-[297mm] w-full max-w-[210mm] mx-auto"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {/* Header */}
        <div className="text-center mb-6 border-b-2 border-black pb-4">
          <h1 className="text-2xl font-bold mb-1">SRR ORTHO IMPLANTS</h1>
          <p className="text-sm">Orthopedic Implant Delivery Challan</p>
        </div>

        {/* Info Section */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
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
        <table className="w-full border-collapse text-sm mb-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2 text-left w-12">S.No</th>
              <th className="border border-black p-2 text-left">Item Description</th>
              <th className="border border-black p-2 text-left w-32">Size/Details</th>
              <th className="border border-black p-2 text-center w-16">Qty</th>
            </tr>
          </thead>
          <tbody>
            {printItems.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border border-black p-2 text-center">{index + 1}</td>
                <td className="border border-black p-2">{item.name}</td>
                <td className="border border-black p-2">{item.description}</td>
                <td className="border border-black p-2 text-center font-semibold">
                  {item.qty}
                </td>
              </tr>
            ))}
            {printItems.length === 0 && (
              <tr>
                <td colSpan={4} className="border border-black p-4 text-center text-gray-500">
                  No items selected
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Instruments */}
        {allInstruments.length > 0 && (
          <div className="mb-6">
            <h3 className="font-bold mb-2 text-sm">Instruments Required:</h3>
            <p className="text-sm">{allInstruments.join(', ')}</p>
          </div>
        )}

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 mt-12 pt-4">
          <div className="text-center">
            <div className="border-t border-black pt-2 mt-16">
              <p className="text-sm font-semibold">Receiver's Signature</p>
              <p className="text-xs text-gray-600">Name & Date</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-black pt-2 mt-16">
              <p className="text-sm font-semibold">Authorized Signature</p>
              <p className="text-xs text-gray-600">SRR Ortho Implants</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 left-8 right-8 text-center text-xs text-gray-500 border-t pt-4">
          <p>This is a system-generated delivery challan</p>
        </div>
      </div>
    );
  }
);

PrintPreview.displayName = 'PrintPreview';
