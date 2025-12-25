import { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Trash2,
  Package,
  Wrench,
  X,
  Plus,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ActiveProcedure, SizeQty } from '@/types/procedure';
import { InstrumentImageModal } from './InstrumentImageModal';

interface ProcedureCardProps {
  procedure: ActiveProcedure;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onRemove: () => void;
  onRefresh: () => void;
  onItemToggle: (itemName: string, checked: boolean) => void;
  onSizeQtyChange: (itemName: string, sizeQty: SizeQty[]) => void;
  onFixedItemToggle: (itemName: string, checked: boolean) => void;
  onFixedQtyChange: (itemName: string, qty: string) => void;
  onAddInstrument: (instrument: string) => void;
  onRemoveInstrument: (instrument: string) => void;
  onAddItem: (itemName: string) => void;
  onSearchItems: (query: string) => string[];
  instrumentSuggestions: string[];
  onSearchInstruments: (query: string) => string[];
}

function parseSizeQtyFromItem(item: string): { name: string; sizeQty: SizeQty[] } {
  const match = item.match(/^(.+?)\s*\{(.+)\}$/);
  if (!match) {
    return { name: item.trim(), sizeQty: [] };
  }

  const name = match[1].trim();
  const pairs = match[2].split(',').map((pair) => {
    const [size, qty] = pair.split(':').map((s) => s.trim());
    return { size: size || '', qty: qty || '1' };
  });

  return { name, sizeQty: pairs };
}

export function ProcedureCard({
  procedure,
  isCollapsed,
  onToggleCollapse,
  onRemove,
  onRefresh,
  onItemToggle,
  onSizeQtyChange,
  onFixedItemToggle,
  onFixedQtyChange,
  onAddInstrument,
  onRemoveInstrument,
  onAddItem,
  onSearchItems,
  onSearchInstruments,
}: ProcedureCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newInstrument, setNewInstrument] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState<Set<string>>(new Set());
  
  // Auto-show details when item is selected
  useEffect(() => {
    const selectedItemNames = Array.from(procedure.selectedItems.keys());
    setShowDetails((prev) => {
      const next = new Set(prev);
      selectedItemNames.forEach((name) => {
        next.add(name);
      });
      return next;
    });
  }, [procedure.selectedItems]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedInstrumentImage, setSelectedInstrumentImage] = useState<{
    name: string;
    url: string | null;
    fallbackUrls?: {
      thumbnail: string;
      preview: string;
      uc: string;
      original: string;
    } | null;
  } | null>(null);
  const [newItem, setNewItem] = useState('');
  const [itemSuggestions, setItemSuggestions] = useState<string[]>([]);
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  const handleInstrumentInput = (value: string) => {
    setNewInstrument(value);
    if (value.length >= 2) {
      setSuggestions(onSearchInstruments(value).slice(0, 5));
    } else {
      setSuggestions([]);
    }
  };

  const handleAddInstrument = (instrument: string) => {
    if (instrument.trim() && !procedure.instruments.includes(instrument.trim())) {
      onAddInstrument(instrument.trim());
    }
    setNewInstrument('');
    setSuggestions([]);
  };

  const handleItemInput = (value: string) => {
    setNewItem(value);
    if (value.length >= 2) {
      const results = onSearchItems(value);
      setItemSuggestions(results.slice(0, 5));
      setShowItemSuggestions(results.length > 0);
    } else {
      setItemSuggestions([]);
      setShowItemSuggestions(false);
    }
  };

  const handleAddItem = (itemName?: string) => {
    const itemToAdd = itemName || newItem.trim();
    if (itemToAdd && !procedure.items.includes(itemToAdd)) {
      onAddItem(itemToAdd);
      setNewItem('');
      setItemSuggestions([]);
      setShowItemSuggestions(false);
    }
  };

  const toggleItemDetails = (itemName: string) => {
    setShowDetails((prev) => {
      const next = new Set(prev);
      if (next.has(itemName)) {
        next.delete(itemName);
      } else {
        next.add(itemName);
      }
      return next;
    });
  };

  // Convert Google Drive URL to working format
  const convertGoogleDriveUrl = (url: string | null): {
    thumbnail: string;
    preview: string;
    uc: string;
    original: string;
  } | null => {
    if (!url) return null;
    
    // Extract file ID from various Google Drive URL formats
    let fileId: string | null = null;
    
    // Format 1: https://drive.google.com/uc?export=view&id=FILE_ID
    const ucMatch = url.match(/[?&]id=([^&]+)/);
    if (ucMatch) {
      fileId = ucMatch[1];
    }
    
    // Format 2: https://drive.google.com/file/d/FILE_ID/view
    const fileMatch = url.match(/\/file\/d\/([^\/]+)/);
    if (fileMatch) {
      fileId = fileMatch[1];
    }
    
    if (!fileId) return null;
    
    // Return multiple working formats
    return {
      thumbnail: `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`,
      preview: `https://drive.google.com/file/d/${fileId}/preview`,
      uc: `https://drive.google.com/uc?export=view&id=${fileId}`,
      original: url
    };
  };

  const handleShowInstrumentImage = (instrumentName: string) => {
    const imageUrl = procedure.instrumentImageMapping?.[instrumentName] || null;
    
    if (imageUrl) {
      // Convert to working URL format
      const urlOptions = convertGoogleDriveUrl(imageUrl);
      // Use thumbnail format first (most reliable for Google Drive)
      const workingUrl = urlOptions ? urlOptions.thumbnail : imageUrl;
      
      setSelectedInstrumentImage({
        name: instrumentName,
        url: workingUrl,
        fallbackUrls: urlOptions
      });
      setShowImageModal(true);
    }
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden animate-fade-in border-2 border-border/60 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-muted/50 border-b-2 border-border/60">
        <button
          onClick={onToggleCollapse}
          className="flex items-center gap-2 flex-1 text-left"
        >
          {isCollapsed ? (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          )}
          <h3 className="font-display font-semibold text-lg">{procedure.name}</h3>
          <Badge variant="outline" className="ml-2">
            {procedure.type}
          </Badge>
        </button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 w-8"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-4 space-y-6">
          {/* Fixed Items */}
          {procedure.fixedItems.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b-2 border-border/60">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  <div>
                    <h4 className="text-sm font-semibold">Fixed Items</h4>
                    <p className="text-xs text-muted-foreground">Pre-defined items with quantities</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3 pl-6 border-l-4 border-primary/60">
                {procedure.fixedItems.map((fixedItem) => {
                  const isSelected = procedure.selectedFixedItems.get(fixedItem.name) ?? true;
                  const editedQty = procedure.fixedQtyEdits.get(fixedItem.name) ?? fixedItem.qty;
                  return (
                    <div 
                      key={fixedItem.name} 
                      className={`item-row flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                        isSelected 
                          ? 'bg-primary/5 border-2 border-primary/40 shadow-sm' 
                          : 'bg-muted/30 border-2 border-transparent hover:bg-muted/50 hover:border-border/40'
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          onFixedItemToggle(fixedItem.name, checked as boolean)
                        }
                        className="flex-shrink-0"
                      />
                      <span className={`flex-1 text-sm ${isSelected ? 'font-semibold' : 'font-medium'}`}>
                        {fixedItem.name}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Qty:</span>
                        <Input
                          type="number"
                          min="1"
                          value={editedQty}
                          onChange={(e) => onFixedQtyChange(fixedItem.name, e.target.value)}
                          className={`w-24 h-9 text-center font-semibold border transition-all ${
                            isSelected 
                              ? 'border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background' 
                              : 'border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-muted/50'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Editable Items */}
          <div className="space-y-3 pt-2 border-t-2 border-border/60">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                <div>
                  <h4 className="text-sm font-semibold">Selectable Items</h4>
                  <p className="text-xs text-muted-foreground">Choose items and specify sizes/quantities</p>
                </div>
              </div>
            </div>
            {procedure.items.length > 0 ? (
              <div className="space-y-3 pl-6 border-l-4 border-primary/60">
                {procedure.items.map((item) => {
                  const parsed = parseSizeQtyFromItem(item);
                  const selectedItem = procedure.selectedItems.get(parsed.name);
                  const isSelected = !!selectedItem;
                  const sizeQty = selectedItem?.sizeQty || parsed.sizeQty;
                  const showItemDetails = isSelected ? (showDetails.has(parsed.name) || sizeQty.length > 0) : false;

                  return (
                    <div key={item} className="space-y-2">
                      <div className={`item-row flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                        isSelected 
                          ? 'bg-primary/5 border-2 border-primary/40 shadow-sm' 
                          : 'bg-muted/30 border-2 border-transparent hover:bg-muted/50 hover:border-border/40'
                      }`}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            onItemToggle(parsed.name, checked as boolean);
                            if (checked) {
                              // Auto-show details when selected
                              setShowDetails((prev) => {
                                const next = new Set(prev);
                                next.add(parsed.name);
                                return next;
                              });
                              if (parsed.sizeQty.length > 0) {
                                onSizeQtyChange(parsed.name, parsed.sizeQty);
                              } else {
                                // Initialize with one empty size/qty if none exist
                                onSizeQtyChange(parsed.name, [{ size: '', qty: '1' }]);
                              }
                            }
                          }}
                          className="flex-shrink-0"
                        />
                        <span className={`flex-1 text-sm ${isSelected ? 'font-semibold' : 'font-medium'}`}>
                          {parsed.name}
                        </span>
                        {isSelected && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleItemDetails(parsed.name)}
                            className="h-7 text-xs text-muted-foreground hover:text-foreground"
                          >
                            {showItemDetails ? 'Hide Sizes' : 'Show Sizes'}
                          </Button>
                        )}
                      </div>

                      {/* Size/Qty Editor */}
                      {isSelected && showItemDetails && (
                        <div className="ml-8 space-y-2 pt-2">
                          {sizeQty.map((sq, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Input
                                placeholder="Size (e.g., 6mm)"
                                value={sq.size}
                                onChange={(e) => {
                                  const updated = [...sizeQty];
                                  updated[index] = { ...sq, size: e.target.value };
                                  onSizeQtyChange(parsed.name, updated);
                                }}
                                className="flex-1 h-9 text-sm border border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background"
                              />
                              <Input
                                type="number"
                                placeholder="Qty"
                                min="1"
                                value={sq.qty}
                                onChange={(e) => {
                                  const updated = [...sizeQty];
                                  updated[index] = { ...sq, qty: e.target.value };
                                  onSizeQtyChange(parsed.name, updated);
                                }}
                                className="w-24 h-9 text-sm text-center font-semibold border border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background"
                              />
                              {sizeQty.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 text-muted-foreground hover:text-destructive"
                                  onClick={() => {
                                    const updated = sizeQty.filter((_, i) => i !== index);
                                    onSizeQtyChange(parsed.name, updated);
                                  }}
                                  title="Remove"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              )}
                              {index === sizeQty.length - 1 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    onSizeQtyChange(parsed.name, [
                                      ...sizeQty,
                                      { size: '', qty: '1' },
                                    ]);
                                  }}
                                  className="h-9 w-9 text-muted-foreground hover:text-foreground"
                                  title="Add Size"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="pl-6 border-l-4 border-blue-600/60 border-2 border-blue-600/40 rounded-lg bg-blue-50/30 py-4 text-center text-sm text-muted-foreground">
                No items available. Add items below.
              </div>
            )}

            {/* Add new item input */}
            <div className="relative pl-6 border-l-4 border-blue-600/60 pt-3 pb-2 border-2 border-blue-600/40 rounded-lg bg-blue-50/30 p-4">
              <label className="text-xs font-semibold text-blue-900 mb-2 block">Add New Item</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Type item name..."
                  value={newItem}
                  onChange={(e) => handleItemInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (showItemSuggestions && itemSuggestions.length > 0) {
                        handleAddItem(itemSuggestions[0]);
                      } else {
                        handleAddItem();
                      }
                    }
                  }}
                  className="flex-1 h-9 border-2 border-blue-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-300"
                  onBlur={() => setTimeout(() => setShowItemSuggestions(false), 100)}
                />
                <Button
                  size="sm"
                  onClick={() => handleAddItem()}
                  disabled={!newItem.trim()}
                  className="h-9 border-2 border-blue-500 hover:border-blue-600"
                  title="Add item to list"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Item Suggestions */}
              {showItemSuggestions && itemSuggestions.length > 0 && (
                <div className="absolute top-full left-6 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-10 overflow-hidden">
                  {itemSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                      onClick={() => handleAddItem(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Instruments */}
          <div className="space-y-3 pt-2 border-t-2 border-border/60">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-orange-600" />
                <div>
                  <h4 className="text-sm font-semibold">Instruments</h4>
                  <p className="text-xs text-muted-foreground">Tools and equipment needed</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-8 text-xs"
                title="Refresh instruments from Google Sheet"
              >
                <RefreshCw
                  className={`w-3 h-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>
            </div>
            {procedure.instruments.length > 0 ? (
              <div className="pl-6 border-l-4 border-orange-600/60">
                <div className="flex flex-wrap gap-2">
                  {procedure.instruments.map((instrument) => {
                    const hasImage = procedure.instrumentImageMapping?.[instrument] || null;
                    return (
                      <Badge
                        key={instrument}
                        variant="secondary"
                        className="pl-3 pr-1.5 py-1.5 flex items-center gap-1.5 hover:bg-secondary/80 transition-colors"
                      >
                        <span className="text-sm">{instrument}</span>
                        {hasImage && (
                          <button
                            onClick={() => handleShowInstrumentImage(instrument)}
                            className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors text-primary"
                            title={`View image of ${instrument}`}
                          >
                            <Info className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => onRemoveInstrument(instrument)}
                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                          title="Remove instrument"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="pl-6 border-l-4 border-orange-600/60 py-4 text-center text-sm text-muted-foreground">
                No instruments. Add instruments below.
              </div>
            )}

            {/* Add Instrument */}
            <div className="relative pl-6 border-l-4 border-orange-600/60 pt-3 pb-2 border-2 border-orange-600/40 rounded-lg bg-orange-50/30 p-4">
              <label className="text-xs font-semibold text-orange-900 mb-2 block">Add New Instrument</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Type instrument name..."
                  value={newInstrument}
                  onChange={(e) => handleInstrumentInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddInstrument(newInstrument);
                    }
                  }}
                  className="flex-1 h-9 border-2 border-orange-400 focus:border-orange-600 focus:ring-2 focus:ring-orange-300"
                />
                <Button
                  size="sm"
                  onClick={() => handleAddInstrument(newInstrument)}
                  disabled={!newInstrument.trim()}
                  className="h-9 border-2 border-orange-500 hover:border-orange-600"
                  title="Add instrument to list"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="absolute top-full left-6 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-10 overflow-hidden">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                      onClick={() => handleAddInstrument(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instrument Image Modal */}
      {selectedInstrumentImage && (
        <InstrumentImageModal
          isOpen={showImageModal}
          onClose={() => {
            setShowImageModal(false);
            setSelectedInstrumentImage(null);
          }}
          instrumentName={selectedInstrumentImage.name}
          imageUrl={selectedInstrumentImage.url}
          fallbackUrls={selectedInstrumentImage.fallbackUrls || null}
        />
      )}
    </div>
  );
}
