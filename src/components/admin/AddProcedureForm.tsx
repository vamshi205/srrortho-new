import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Save, Upload, Copy, Edit, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveProcedureToSheets, copyProcedureDataToClipboard, formatProcedureAsCSV, ProcedureRowData } from '@/services/googleSheetsService';
import { useProcedures } from '@/hooks/useProcedures';
import { Procedure } from '@/types/procedure';

interface ItemWithSizes {
  name: string;
  sizes: Array<{ size: string; qty: string }>;
  imageUrl: string;
  isFixed: boolean;
  fixedQty?: string;
  location?: { room: string; rack: string; box: string };
}

interface Instrument {
  name: string;
  imageUrl: string;
  location?: { room: string; rack: string; box: string };
}

export function AddProcedureForm() {
  const { toast } = useToast();
  const { procedures, loading: proceduresLoading } = useProcedures();
  const [selectedProcedureToEdit, setSelectedProcedureToEdit] = useState<string>('__NEW__');
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalProcedureName, setOriginalProcedureName] = useState('');
  const [procedureName, setProcedureName] = useState('');
  const [procedureType, setProcedureType] = useState('General');
  const [items, setItems] = useState<ItemWithSizes[]>([]);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const addItem = () => {
    setItems([...items, { name: '', sizes: [{ size: '', qty: '1' }], imageUrl: '', isFixed: false, location: { room: '', rack: '', box: '' } }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ItemWithSizes, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const addItemSize = (itemIndex: number) => {
    const updated = [...items];
    updated[itemIndex].sizes.push({ size: '', qty: '1' });
    setItems(updated);
  };

  const removeItemSize = (itemIndex: number, sizeIndex: number) => {
    const updated = [...items];
    updated[itemIndex].sizes = updated[itemIndex].sizes.filter((_, i) => i !== sizeIndex);
    setItems(updated);
  };

  const updateItemSize = (itemIndex: number, sizeIndex: number, field: 'size' | 'qty', value: string) => {
    const updated = [...items];
    updated[itemIndex].sizes[sizeIndex][field] = value;
    setItems(updated);
  };

  const addInstrument = () => {
    setInstruments([...instruments, { name: '', imageUrl: '', location: { room: '', rack: '', box: '' } }]);
  };

  const removeInstrument = (index: number) => {
    setInstruments(instruments.filter((_, i) => i !== index));
  };

  const updateInstrument = (index: number, field: keyof Instrument, value: string) => {
    const updated = [...instruments];
    updated[index][field] = value;
    setInstruments(updated);
  };

  // Parse item string with size/qty pattern: "ItemName {size1:qty1, size2:qty2}"
  const parseItemString = (itemString: string): { name: string; sizes: Array<{ size: string; qty: string }> } => {
    const match = itemString.match(/^(.+?)\s*\{([^}]+)\}$/);
    if (match) {
      const name = match[1].trim();
      const sizeQtyStr = match[2];
      const sizes = sizeQtyStr.split(',').map(sq => {
        const [size, qty] = sq.split(':').map(s => s.trim());
        return { size: size || '', qty: qty || '1' };
      });
      return { name, sizes };
    }
    return { name: itemString.trim(), sizes: [] };
  };

  // Load procedure data into form for editing
  const loadProcedureForEdit = (procedure: Procedure) => {
    setOriginalProcedureName(procedure.name);
    setProcedureName(procedure.name);
    setProcedureType(procedure.type || 'General');
    
    // Load fixed items
    const fixedItemsData: ItemWithSizes[] = procedure.fixedItems.map((fixedItem, idx) => {
      const location = procedure.fixedItemLocationMapping?.[fixedItem.name];
      return {
        name: fixedItem.name,
        sizes: [],
        imageUrl: procedure.fixedItemImageMapping?.[fixedItem.name] || '',
        isFixed: true,
        fixedQty: fixedItem.qty,
        location: location || { room: '', rack: '', box: '' },
      };
    });
    
    // Load selectable items
    const selectableItemsData: ItemWithSizes[] = procedure.items.map((itemString, idx) => {
      const parsed = parseItemString(itemString);
      const location = procedure.itemLocationMapping?.[parsed.name];
      return {
        name: parsed.name,
        sizes: parsed.sizes.length > 0 ? parsed.sizes : [{ size: '', qty: '1' }],
        imageUrl: procedure.itemImageMapping?.[parsed.name] || '',
        isFixed: false,
        location: location || { room: '', rack: '', box: '' },
      };
    });
    
    setItems([...fixedItemsData, ...selectableItemsData]);
    
    // Load instruments
    const instrumentsData: Instrument[] = procedure.instruments.map((instName, idx) => {
      const location = procedure.instrumentLocationMapping?.[instName];
      return {
        name: instName,
        imageUrl: procedure.instrumentImageMapping?.[instName] || '',
        location: location || { room: '', rack: '', box: '' },
      };
    });
    
    setInstruments(instrumentsData);
    setIsEditMode(true);
  };

  // Handle procedure selection for editing
  useEffect(() => {
    if (selectedProcedureToEdit && selectedProcedureToEdit !== '__NEW__') {
      const procedure = procedures.find(p => p.name === selectedProcedureToEdit);
      if (procedure) {
        loadProcedureForEdit(procedure);
      }
    } else if (selectedProcedureToEdit === '__NEW__') {
      // Reset form for new procedure
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProcedureToEdit]);

  const resetForm = () => {
    setProcedureName('');
    setProcedureType('General');
    setItems([]);
    setInstruments([]);
    setIsEditMode(false);
    setOriginalProcedureName('');
  };

  const formatItemForSheet = (item: ItemWithSizes): string => {
    if (item.isFixed) {
      return item.name; // Fixed items go to fixedItems column
    }
    // Selectable items with sizes: "ItemName {size1:qty1, size2:qty2}"
    if (item.sizes.length > 0 && item.sizes[0].size) {
      const sizeQtyPairs = item.sizes
        .filter(sq => sq.size.trim())
        .map(sq => `${sq.size}:${sq.qty || '1'}`)
        .join(', ');
      return sizeQtyPairs ? `${item.name} {${sizeQtyPairs}}` : item.name;
    }
    return item.name;
  };

  const handleSave = async () => {
    if (!procedureName.trim()) {
      toast({
        title: 'Error',
        description: 'Procedure name is required',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      // Separate fixed and selectable items
      const fixedItems = items.filter(item => item.isFixed);
      const selectableItems = items.filter(item => !item.isFixed);

      // Format locations as pipe-separated: Room1|Rack2|Box3|Room4|Rack5|Box6
      // Each location is 3 parts: Room, Rack, Box, all joined with |
      const formatLocations = (items: Array<{ location?: { room: string; rack: string; box: string } }>): string => {
        const locationParts: string[] = [];
        items.forEach(item => {
          if (item.location) {
            locationParts.push(item.location.room || '');
            locationParts.push(item.location.rack || '');
            locationParts.push(item.location.box || '');
          }
        });
        return locationParts.join('|');
      };
      
      // Format data for Google Sheets
      const procedureData: ProcedureRowData = {
        name: procedureName.trim(),
        items: selectableItems.map(formatItemForSheet).join('|'),
        fixedItems: fixedItems.map(item => item.name).join('|'),
        fixedQty: fixedItems.map(item => item.fixedQty || '1').join('|'),
        instruments: instruments.map(inst => inst.name).join('|'),
        type: procedureType,
        instrumentImages: instruments.map(inst => inst.imageUrl || '').join('|'),
        fixedItemImages: fixedItems.map(item => item.imageUrl || '').join('|'),
        itemImages: selectableItems.map(item => item.imageUrl || '').join('|'),
        itemLocations: formatLocations(selectableItems),
        fixedItemLocations: formatLocations(fixedItems),
        instrumentLocations: formatLocations(instruments),
      };

      // Try to save to Google Sheets
      let saved = false;
      try {
        await saveProcedureToSheets(procedureData);
        saved = true;
        toast({
          title: 'Success',
          description: `Procedure "${procedureName}" ${isEditMode ? 'updated' : 'saved'} to Google Sheets successfully`,
        });
        // Reset form on successful save
        resetForm();
        setSelectedProcedureToEdit('__NEW__');
      } catch (error: any) {
        // If API is not configured, offer manual copy option
        const tabData = copyProcedureDataToClipboard(procedureData);
        
        // Copy to clipboard
        try {
          await navigator.clipboard.writeText(tabData);
          toast({
            title: 'Data Copied to Clipboard',
            description: 'Google Sheets API not configured. Data copied to clipboard. Paste it into your Google Sheet (Ctrl+V or Cmd+V).',
            duration: 8000,
          });
        } catch (clipboardError) {
          // Fallback: show data in console
          console.log('Copy this data to your Google Sheet:', tabData);
          toast({
            title: 'Copy Data Manually',
            description: 'Check browser console for data to copy. Or use the "Copy Data" button.',
            duration: 8000,
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save procedure. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{isEditMode ? 'Edit Procedure' : 'Add New Procedure'}</CardTitle>
            <CardDescription>
              {isEditMode 
                ? 'Edit the selected procedure. Changes will be saved to Google Sheets.'
                : 'Add a complete procedure with items and instruments. All data will be saved to Google Sheets in one row.'}
            </CardDescription>
          </div>
          {isEditMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetForm();
                setSelectedProcedureToEdit('__NEW__');
              }}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              New Procedure
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Procedure Selector for Editing */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
          <h3 className="font-semibold text-sm">Select Procedure to Edit</h3>
          <div className="flex items-center gap-2">
            <Select 
              value={selectedProcedureToEdit} 
              onValueChange={(value) => {
                setSelectedProcedureToEdit(value);
              }}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={proceduresLoading ? "Loading procedures..." : "Select a procedure to edit"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__NEW__">-- Create New Procedure --</SelectItem>
                {procedures.map((proc) => (
                  <SelectItem key={proc.name} value={proc.name}>
                    {proc.name} ({proc.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProcedureToEdit !== '__NEW__' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  resetForm();
                  setSelectedProcedureToEdit('__NEW__');
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Procedure Basic Info */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
          <h3 className="font-semibold text-sm">Procedure Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="procedure-name">Procedure Name *</Label>
              <Input
                id="procedure-name"
                placeholder="e.g., Total Hip Replacement"
                value={procedureName}
                onChange={(e) => setProcedureName(e.target.value)}
                disabled={isEditMode}
              />
              {isEditMode && (
                <p className="text-xs text-muted-foreground">
                  Procedure name cannot be changed. Create a new procedure to use a different name.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="procedure-type">Procedure Type</Label>
              <Select value={procedureType} onValueChange={setProcedureType}>
                <SelectTrigger id="procedure-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Surgery">Surgery</SelectItem>
                  <SelectItem value="Trauma">Trauma</SelectItem>
                  <SelectItem value="Spine">Spine</SelectItem>
                  <SelectItem value="Orthopedic">Orthopedic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Items (Implants)</h3>
            <Button onClick={addItem} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>

          {items.map((item, itemIndex) => (
            <Card key={itemIndex} className="p-4">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 space-y-2">
                        <Label>Item Name *</Label>
                        <Input
                          placeholder="e.g., Titanium Plate"
                          value={item.name}
                          onChange={(e) => updateItem(itemIndex, 'name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Item Type</Label>
                        <Select
                          value={item.isFixed ? 'fixed' : 'selectable'}
                          onValueChange={(value) => updateItem(itemIndex, 'isFixed', value === 'fixed')}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="selectable">Selectable</SelectItem>
                            <SelectItem value="fixed">Fixed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {item.isFixed ? (
                      <div className="space-y-2">
                        <Label>Fixed Quantity *</Label>
                        <Input
                          type="number"
                          min="1"
                          placeholder="1"
                          value={item.fixedQty || '1'}
                          onChange={(e) => updateItem(itemIndex, 'fixedQty', e.target.value)}
                          className="w-32"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Sizes & Quantities</Label>
                          <Button
                            type="button"
                            onClick={() => addItemSize(itemIndex)}
                            size="sm"
                            variant="ghost"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add Size
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {item.sizes.map((sizeQty, sizeIndex) => (
                            <div key={sizeIndex} className="flex items-center gap-2">
                              <Input
                                placeholder="Size (e.g., 6mm)"
                                value={sizeQty.size}
                                onChange={(e) => updateItemSize(itemIndex, sizeIndex, 'size', e.target.value)}
                                className="flex-1"
                              />
                              <Input
                                type="number"
                                min="1"
                                placeholder="Qty"
                                value={sizeQty.qty}
                                onChange={(e) => updateItemSize(itemIndex, sizeIndex, 'qty', e.target.value)}
                                className="w-24"
                              />
                              {item.sizes.length > 1 && (
                                <Button
                                  type="button"
                                  onClick={() => removeItemSize(itemIndex, sizeIndex)}
                                  size="icon"
                                  variant="ghost"
                                  className="h-9 w-9"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Image URL (Optional)</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Google Drive URL"
                          value={item.imageUrl}
                          onChange={(e) => updateItem(itemIndex, 'imageUrl', e.target.value)}
                        />
                        <Button variant="outline" size="icon" title="Upload image">
                          <Upload className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Location (Optional)</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Room</Label>
                          <Input
                            placeholder="Room No"
                            value={item.location?.room || ''}
                            onChange={(e) => updateItem(itemIndex, 'location', { ...(item.location || { room: '', rack: '', box: '' }), room: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Rack</Label>
                          <Input
                            placeholder="Rack No"
                            value={item.location?.rack || ''}
                            onChange={(e) => updateItem(itemIndex, 'location', { ...(item.location || { room: '', rack: '', box: '' }), rack: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Box</Label>
                          <Input
                            placeholder="Box No"
                            value={item.location?.box || ''}
                            onChange={(e) => updateItem(itemIndex, 'location', { ...(item.location || { room: '', rack: '', box: '' }), box: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => removeItem(itemIndex)}
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Instruments Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Instruments</h3>
            <Button onClick={addInstrument} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Instrument
            </Button>
          </div>

          {instruments.map((instrument, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <Label>Instrument Name *</Label>
                    <Input
                      placeholder="e.g., Bone Drill"
                      value={instrument.name}
                      onChange={(e) => updateInstrument(index, 'name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Image URL (Optional)</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Google Drive URL"
                        value={instrument.imageUrl}
                        onChange={(e) => updateInstrument(index, 'imageUrl', e.target.value)}
                      />
                      <Button variant="outline" size="icon" title="Upload image">
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Location (Optional)</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Room</Label>
                        <Input
                          placeholder="Room No"
                          value={instrument.location?.room || ''}
                          onChange={(e) => updateInstrument(index, 'location', { ...(instrument.location || { room: '', rack: '', box: '' }), room: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Rack</Label>
                        <Input
                          placeholder="Rack No"
                          value={instrument.location?.rack || ''}
                          onChange={(e) => updateInstrument(index, 'location', { ...(instrument.location || { room: '', rack: '', box: '' }), rack: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Box</Label>
                        <Input
                          placeholder="Box No"
                          value={instrument.location?.box || ''}
                          onChange={(e) => updateInstrument(index, 'location', { ...(instrument.location || { room: '', rack: '', box: '' }), box: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => removeInstrument(index)}
                  size="icon"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button 
            onClick={async () => {
              if (!procedureName.trim()) {
                toast({
                  title: 'Error',
                  description: 'Please fill in procedure name first',
                  variant: 'destructive',
                });
                return;
              }
              
              const fixedItems = items.filter(item => item.isFixed);
              const selectableItems = items.filter(item => !item.isFixed);
              
              // Format locations as pipe-separated: Room1|Rack2|Box3|Room4|Rack5|Box6
              // Each location is 3 parts: Room, Rack, Box, all joined with |
              const formatLocations = (items: Array<{ location?: { room: string; rack: string; box: string } }>): string => {
                const locationParts: string[] = [];
                items.forEach(item => {
                  if (item.location) {
                    locationParts.push(item.location.room || '');
                    locationParts.push(item.location.rack || '');
                    locationParts.push(item.location.box || '');
                  }
                });
                return locationParts.join('|');
              };
              
              const procedureData: ProcedureRowData = {
                name: procedureName.trim(),
                items: selectableItems.map(formatItemForSheet).join('|'),
                fixedItems: fixedItems.map(item => item.name).join('|'),
                fixedQty: fixedItems.map(item => item.fixedQty || '1').join('|'),
                instruments: instruments.map(inst => inst.name).join('|'),
                type: procedureType,
                instrumentImages: instruments.map(inst => inst.imageUrl || '').join('|'),
                fixedItemImages: fixedItems.map(item => item.imageUrl || '').join('|'),
                itemImages: selectableItems.map(item => item.imageUrl || '').join('|'),
                itemLocations: formatLocations(selectableItems),
                fixedItemLocations: formatLocations(fixedItems),
                instrumentLocations: formatLocations(instruments),
              };
              
              const tabData = copyProcedureDataToClipboard(procedureData);
              await navigator.clipboard.writeText(tabData);
              
              toast({
                title: 'Copied to Clipboard',
                description: 'Data copied! Paste it into your Google Sheet (Ctrl+V or Cmd+V)',
              });
            }}
            variant="outline"
            size="lg"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Data
          </Button>
          <Button onClick={handleSave} disabled={isSaving} size="lg">
            {isEditMode ? (
              <>
                <Edit className="w-4 h-4 mr-2" />
                {isSaving ? 'Updating...' : 'Update Procedure'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save to Google Sheets'}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

