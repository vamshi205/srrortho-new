import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ActiveProcedure, SizeQty } from '@/types/procedure';
import { InstrumentImageModal } from './InstrumentImageModal';

interface ProcedureCardProps {
  procedure: ActiveProcedure;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onRemove: () => void;
  onRefresh: () => void;
  onMaterialTypeChange: (materialType: string) => void;
  onItemToggle: (itemName: string, checked: boolean) => void;
  onSizeQtyChange: (itemName: string, sizeQty: SizeQty[]) => void;
  onFixedItemToggle: (itemName: string, checked: boolean) => void;
  onFixedQtyChange: (itemName: string, qty: string) => void;
  onAddInstrument: (instrument: string) => void;
  onRemoveInstrument: (instrument: string) => void;
  onAddItem: (itemName: string) => void;
  onSearchItems: (query: string) => string[];
  instrumentSuggestions: string[];
  onSearchInstruments: (query: string) => Array<{ instrument: string; procedureName: string }>;
  onRemoveFixedItemPart: (itemName: string, partToRemove: string) => void;
  onRemoveSelectableItemPart: (itemName: string, partToRemove: string) => void;
  onAddBox: (boxNumber: string) => void;
  onRemoveBox: (index: number) => void;
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

function splitItemNameByComma(itemName: string): { parts: string[]; hasCommas: boolean } {
  console.log('splitItemNameByComma called with:', itemName);
  if (!itemName || !itemName.includes(',')) {
    console.log('No commas found in:', itemName);
    return { parts: [itemName], hasCommas: false };
  }
  const parts = itemName.split(',').map(part => part.trim()).filter(Boolean);
  console.log('Commas found! Parts:', parts);
  return { parts, hasCommas: parts.length > 1 };
}

export function ProcedureCard({
  procedure,
  isCollapsed,
  onToggleCollapse,
  onRemove,
  onRefresh,
  onMaterialTypeChange,
  onItemToggle,
  onSizeQtyChange,
  onFixedItemToggle,
  onFixedQtyChange,
  onAddInstrument,
  onRemoveInstrument,
  onAddItem,
  onSearchItems,
  onSearchInstruments,
  onRemoveFixedItemPart,
  onRemoveSelectableItemPart,
  onAddBox,
  onRemoveBox,
}: ProcedureCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newInstrument, setNewInstrument] = useState('');
  const [newBoxNumber, setNewBoxNumber] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ instrument: string; procedureName: string }>>([]);
  const [instrumentSuggestionActiveIndex, setInstrumentSuggestionActiveIndex] = useState(-1);
  const [showDetails, setShowDetails] = useState<Set<string>>(new Set());
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{
    name: string;
    url: string | null;
    fallbackUrls?: {
      thumbnail: string;
      preview: string;
      uc: string;
      original: string;
    } | null;
  } | null>(null);
  const [allImages, setAllImages] = useState<Array<{
    name: string;
    url: string;
    fallbackUrls?: {
      thumbnail: string;
      preview: string;
      uc: string;
      original: string;
    } | null;
  }>>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [newItem, setNewItem] = useState('');
  const [itemSuggestions, setItemSuggestions] = useState<string[]>([]);
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);
  const [itemSuggestionActiveIndex, setItemSuggestionActiveIndex] = useState(-1);
  const instrumentInputRef = useRef<HTMLDivElement>(null);
  const itemInputRef = useRef<HTMLDivElement>(null);
  const [instrumentDropdownPos, setInstrumentDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const [itemDropdownPos, setItemDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
  
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

  // Update dropdown positions on scroll/resize
  useEffect(() => {
    const updatePositions = () => {
      if (suggestions.length > 0 && instrumentInputRef.current) {
        try {
          const rect = instrumentInputRef.current.getBoundingClientRect();
          setInstrumentDropdownPos({
            top: rect.bottom + window.scrollY + 4,
            left: rect.left + window.scrollX,
            width: rect.width,
          });
        } catch (e) {
          // Silently fail if ref is not ready
        }
      }
      if (showItemSuggestions && itemSuggestions.length > 0 && itemInputRef.current) {
        try {
          const rect = itemInputRef.current.getBoundingClientRect();
          setItemDropdownPos({
            top: rect.bottom + window.scrollY + 4,
            left: rect.left + window.scrollX,
            width: rect.width,
          });
        } catch (e) {
          // Silently fail if ref is not ready
        }
      }
    };

    if (suggestions.length > 0 || showItemSuggestions) {
      // Use setTimeout to ensure refs are ready
      const timeoutId = setTimeout(() => {
        updatePositions();
      }, 0);
      
      window.addEventListener('scroll', updatePositions, true);
      window.addEventListener('resize', updatePositions);
      
      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('scroll', updatePositions, true);
        window.removeEventListener('resize', updatePositions);
      };
    }
  }, [suggestions.length, showItemSuggestions, itemSuggestions.length]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const handleClickOutside = (event: MouseEvent) => {
      try {
        const target = event.target as Node;
        if (suggestions.length > 0 && instrumentInputRef.current && !instrumentInputRef.current.contains(target)) {
          // Check if click is on portal dropdown
          const portalDropdown = document.querySelector('[data-instrument-dropdown]');
          if (!portalDropdown?.contains(target)) {
            setSuggestions([]);
            setInstrumentDropdownPos(null);
          }
        }
        if (showItemSuggestions && itemInputRef.current && !itemInputRef.current.contains(target)) {
          // Check if click is on portal dropdown
          const portalDropdown = document.querySelector('[data-item-dropdown]');
          if (!portalDropdown?.contains(target)) {
            setShowItemSuggestions(false);
            setItemDropdownPos(null);
          }
        }
      } catch (e) {
        // Silently fail if there's an error
      }
    };

    if (suggestions.length > 0 || showItemSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [suggestions.length, showItemSuggestions]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  const handleInstrumentInput = (value: string) => {
    setNewInstrument(value);
    if (value.length >= 2) {
      const results = onSearchInstruments(value);
      const available = results.filter((r) => !procedure.instruments.includes(r.instrument));
      const sliced = available.slice(0, 5);
      setSuggestions(sliced);
      setInstrumentSuggestionActiveIndex(sliced.length > 0 ? 0 : -1);
      // Calculate position for portal
      if (instrumentInputRef.current) {
        const rect = instrumentInputRef.current.getBoundingClientRect();
        setInstrumentDropdownPos({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    } else {
      setSuggestions([]);
      setInstrumentSuggestionActiveIndex(-1);
      setInstrumentDropdownPos(null);
    }
  };

  const handleAddInstrument = (instrument: string) => {
    if (instrument.trim() && !procedure.instruments.includes(instrument.trim())) {
      onAddInstrument(instrument.trim());
    }
    setNewInstrument('');
    setSuggestions([]);
    setInstrumentSuggestionActiveIndex(-1);
    setInstrumentDropdownPos(null);
  };

  const handleItemInput = (value: string) => {
    setNewItem(value);
    if (value.length >= 2) {
      const results = onSearchItems(value);
      const available = results.filter((r) => !procedure.items.includes(r));
      const sliced = available.slice(0, 5);
      setItemSuggestions(sliced);
      setShowItemSuggestions(sliced.length > 0);
      setItemSuggestionActiveIndex(sliced.length > 0 ? 0 : -1);
      // Calculate position for portal
      if (itemInputRef.current) {
        const rect = itemInputRef.current.getBoundingClientRect();
        setItemDropdownPos({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    } else {
      setItemSuggestions([]);
      setShowItemSuggestions(false);
      setItemSuggestionActiveIndex(-1);
      setItemDropdownPos(null);
    }
  };

  const handleAddItem = (itemName?: string) => {
    const itemToAdd = itemName || newItem.trim();
    if (itemToAdd && !procedure.items.includes(itemToAdd)) {
      onAddItem(itemToAdd);
      setNewItem('');
      setItemSuggestions([]);
      setShowItemSuggestions(false);
      setItemSuggestionActiveIndex(-1);
      setItemDropdownPos(null);
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
    
    // Format 2: https://drive.google.com/file/d/FILE_ID/view or /preview
    const fileMatch = url.match(/\/file\/d\/([^\/\?]+)/);
    if (fileMatch) {
      fileId = fileMatch[1];
    }
    
    // Format 3: https://drive.google.com/open?id=FILE_ID
    const openMatch = url.match(/open[?&]id=([^&]+)/);
    if (openMatch) {
      fileId = openMatch[1];
    }
    
    // Format 4: Direct thumbnail URL - extract ID
    const thumbnailMatch = url.match(/thumbnail[?&]id=([^&]+)/);
    if (thumbnailMatch) {
      fileId = thumbnailMatch[1];
    }
    
    // Format 5: Already a direct image URL (ends with image extension)
    if (url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i)) {
      // It's already a direct image URL, return it as all formats
      return {
        thumbnail: url,
        preview: url,
        uc: url,
        original: url
      };
    }
    
    if (!fileId) {
      // If we can't extract file ID, return the original URL as all formats
      return {
        thumbnail: url,
        preview: url,
        uc: url,
        original: url
      };
    }
    
    // Return multiple working formats
    return {
      thumbnail: `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`,
      preview: `https://drive.google.com/file/d/${fileId}/preview`,
      uc: `https://drive.google.com/uc?export=view&id=${fileId}`,
      original: url
    };
  };

  const handleShowImage = (
    itemName: string,
    imageMapping: Record<string, string | null> | undefined,
    allItems: string[]
  ) => {
    // Get all items with images
    const itemsWithImages = allItems
      .filter((item) => imageMapping?.[item])
      .map((item) => {
        const imageUrl = imageMapping?.[item] || null;
        const urlOptions = convertGoogleDriveUrl(imageUrl);
        const workingUrl = urlOptions ? urlOptions.thumbnail : imageUrl;
        return {
          name: item,
          url: workingUrl,
          fallbackUrls: urlOptions
        };
      });

    if (itemsWithImages.length > 0) {
      setAllImages(itemsWithImages);
      const index = itemsWithImages.findIndex((img) => img.name === itemName);
      setCurrentImageIndex(index >= 0 ? index : 0);
      
      const selected = itemsWithImages[index >= 0 ? index : 0];
      setSelectedImage({
        name: selected.name,
        url: selected.url,
        fallbackUrls: selected.fallbackUrls
      });
      setShowImageModal(true);
    }
  };

  const handleShowInstrumentImage = (instrumentName: string) => {
    handleShowImage(instrumentName, procedure.instrumentImageMapping, procedure.instruments);
  };

  const handleShowFixedItemImage = (itemName: string) => {
    const fixedItemNames = procedure.fixedItems.map(item => item.name);
    handleShowImage(itemName, procedure.fixedItemImageMapping, fixedItemNames);
  };

  const handleShowSelectableItemImage = (itemName: string) => {
    // Extract item names from items (remove size/qty patterns)
    const itemNames = procedure.items.map(item => {
      const parsed = parseSizeQtyFromItem(item);
      return parsed.name;
    });
    handleShowImage(itemName, procedure.itemImageMapping, itemNames);
  };

  const handleNavigateImage = (newIndex: number) => {
    if (allImages.length > 0 && newIndex >= 0 && newIndex < allImages.length) {
      setCurrentImageIndex(newIndex);
      const selected = allImages[newIndex];
      setSelectedImage({
        name: selected.name,
        url: selected.url,
        fallbackUrls: selected.fallbackUrls
      });
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
          <Select value={procedure.materialType} onValueChange={onMaterialTypeChange}>
            <SelectTrigger className="h-8 w-[120px] text-xs bg-background border-2 border-slate-400 shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SS">SS</SelectItem>
              <SelectItem value="Titanium">Titanium</SelectItem>
              <SelectItem value="None">No Prefix</SelectItem>
            </SelectContent>
          </Select>
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
        <div className="p-4 space-y-6 overflow-visible">
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
                {procedure.fixedItems.map((fixedItem, fixedIndex) => {
                  console.log('Rendering fixed item:', fixedItem.name);
                  const isSelected = procedure.selectedFixedItems.get(fixedItem.name) ?? true;
                  const editedQty = procedure.fixedQtyEdits.get(fixedItem.name) ?? fixedItem.qty;
                  return (
                    <div 
                      key={`${procedure.name}-fixed-${fixedIndex}-${fixedItem.name}`} 
                      className={`item-row flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-all duration-200 ${
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
                      <div className="flex-1 flex items-center gap-1.5 min-w-0 flex-wrap">
                        {(() => {
                          const { parts, hasCommas } = splitItemNameByComma(fixedItem.name);
                          // Debug: log when we detect commas
                          if (hasCommas) {
                            console.log('Fixed item with commas detected:', fixedItem.name, 'Parts:', parts);
                          }
                          if (hasCommas) {
                            return (
                              <div className="flex flex-wrap items-center gap-1.5">
                                {parts.map((part, idx) => (
                                  <span key={`${procedure.name}-${fixedItem.name}-${idx}-${part}`} className="inline-flex items-baseline gap-0.5">
                                    <span className={`text-sm ${isSelected ? 'font-semibold' : 'font-medium'}`}>
                                      {part}
                                    </span>
                                    <sup className="inline-block">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          onRemoveFixedItemPart(fixedItem.name, part);
                                        }}
                                        className="hover:bg-destructive/30 rounded-full p-0.5 transition-colors text-destructive flex-shrink-0 ml-0.5"
                                        title={`Remove ${part}`}
                                        type="button"
                                      >
                                        <X className="w-2 h-2" />
                                      </button>
                                    </sup>
                                    {idx < parts.length - 1 && (
                                      <span className="text-muted-foreground">,</span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            );
                          }
                          return (
                            <span className={`text-sm ${isSelected ? 'font-semibold' : 'font-medium'} min-w-0 break-words sm:break-normal`}>
                              {fixedItem.name}
                            </span>
                          );
                        })()}
                        {procedure.fixedItemImageMapping?.[fixedItem.name] && (
                          <button
                            onClick={() => handleShowFixedItemImage(fixedItem.name)}
                            className="hover:bg-primary/20 rounded-full p-0.5 transition-colors text-primary flex-shrink-0"
                            title={`View image of ${fixedItem.name}`}
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {procedure.fixedItemLocationMapping?.[fixedItem.name] && (
                          <span 
                            className="text-[10px] text-muted-foreground ml-1.5 px-1.5 py-0.5 bg-muted/50 rounded"
                            title={`Room: ${procedure.fixedItemLocationMapping[fixedItem.name]?.room || '-'}, Rack: ${procedure.fixedItemLocationMapping[fixedItem.name]?.rack || '-'}, Box: ${procedure.fixedItemLocationMapping[fixedItem.name]?.box || '-'}`}
                          >
                            <MapPin className="w-2.5 h-2.5 inline mr-0.5" />
                            {procedure.fixedItemLocationMapping[fixedItem.name]?.room || '-'}/{procedure.fixedItemLocationMapping[fixedItem.name]?.rack || '-'}/{procedure.fixedItemLocationMapping[fixedItem.name]?.box || '-'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 w-full sm:w-auto justify-end sm:justify-start">
                        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap hidden sm:inline">Qty:</span>
                        <Input
                          type="number"
                          min="1"
                          value={editedQty}
                          onChange={(e) => onFixedQtyChange(fixedItem.name, e.target.value)}
                          className={`w-16 sm:w-24 h-8 sm:h-9 text-center font-semibold border transition-all text-xs sm:text-sm ${
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
                {procedure.items.map((item, itemIndex) => {
                  const parsed = parseSizeQtyFromItem(item);
                  console.log('Rendering selectable item:', parsed.name);
                  const selectedItem = procedure.selectedItems.get(parsed.name);
                  const isSelected = !!selectedItem;
                  const sizeQty = selectedItem?.sizeQty || parsed.sizeQty;
                  const showItemDetails = isSelected ? (showDetails.has(parsed.name) || sizeQty.length > 0) : false;

                  return (
                    <div key={`${procedure.name}-item-${itemIndex}-${item}`} className="space-y-2">
                      <div className={`item-row flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-all duration-200 ${
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
                        <div className="flex-1 flex items-center gap-1.5 min-w-0 flex-wrap">
                          {(() => {
                            const { parts, hasCommas } = splitItemNameByComma(parsed.name);
                            // Debug: log when we detect commas
                            if (hasCommas) {
                              console.log('Selectable item with commas detected:', parsed.name, 'Parts:', parts);
                            }
                            if (hasCommas) {
                              return (
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {parts.map((part, idx) => (
                                    <span key={`${procedure.name}-${parsed.name}-${idx}-${part}`} className="inline-flex items-baseline gap-0.5">
                                      <span className={`text-sm ${isSelected ? 'font-semibold' : 'font-medium'}`}>
                                        {part}
                                      </span>
                                      <sup className="inline-block">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            onRemoveSelectableItemPart(parsed.name, part);
                                          }}
                                          className="hover:bg-destructive/30 rounded-full p-0.5 transition-colors text-destructive flex-shrink-0 ml-0.5"
                                          title={`Remove ${part}`}
                                          type="button"
                                        >
                                          <X className="w-2 h-2" />
                                        </button>
                                      </sup>
                                      {idx < parts.length - 1 && (
                                        <span className="text-muted-foreground">,</span>
                                      )}
                                    </span>
                                  ))}
                                </div>
                              );
                            }
                            return (
                              <span className={`text-sm ${isSelected ? 'font-semibold' : 'font-medium'} min-w-0 break-words sm:break-normal`}>
                                {parsed.name}
                              </span>
                            );
                          })()}
                          {procedure.itemImageMapping?.[parsed.name] && (
                            <button
                              onClick={() => handleShowSelectableItemImage(parsed.name)}
                              className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors text-primary flex-shrink-0"
                              title={`View image of ${parsed.name}`}
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {procedure.itemLocationMapping?.[parsed.name] && (
                            <span 
                              className="text-[10px] text-muted-foreground ml-1.5 px-1.5 py-0.5 bg-muted/50 rounded"
                              title={`Room: ${procedure.itemLocationMapping[parsed.name]?.room || '-'}, Rack: ${procedure.itemLocationMapping[parsed.name]?.rack || '-'}, Box: ${procedure.itemLocationMapping[parsed.name]?.box || '-'}`}
                            >
                              <MapPin className="w-2.5 h-2.5 inline mr-0.5" />
                              {procedure.itemLocationMapping[parsed.name]?.room || '-'}/{procedure.itemLocationMapping[parsed.name]?.rack || '-'}/{procedure.itemLocationMapping[parsed.name]?.box || '-'}
                            </span>
                          )}
                        </div>
                        {isSelected && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleItemDetails(parsed.name)}
                            className="h-6 sm:h-7 text-[10px] sm:text-xs text-muted-foreground hover:text-foreground flex-shrink-0 px-1.5 sm:px-2"
                          >
                            <span className="hidden sm:inline">{showItemDetails ? 'Hide Sizes' : 'Show Sizes'}</span>
                            <span className="sm:hidden">{showItemDetails ? 'Hide' : 'Sizes'}</span>
                          </Button>
                        )}
                      </div>

                      {/* Size/Qty Editor */}
                      {isSelected && showItemDetails && (
                        <div className="ml-6 sm:ml-8 space-y-2 pt-2">
                          {sizeQty.map((sq, index) => (
                            <div key={index} className="flex items-center gap-1.5 sm:gap-2">
                              <Input
                                placeholder="Size (e.g., 6mm)"
                                value={sq.size}
                                onChange={(e) => {
                                  const updated = [...sizeQty];
                                  updated[index] = { ...sq, size: e.target.value };
                                  onSizeQtyChange(parsed.name, updated);
                                }}
                                className="flex-1 h-8 sm:h-9 text-xs sm:text-sm border border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background"
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
                                className="w-16 sm:w-24 h-8 sm:h-9 text-xs sm:text-sm text-center font-semibold border border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background"
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
            <div className="relative pl-6 border-l-4 border-blue-600/60 pt-3 pb-2 border-2 border-blue-600/40 rounded-lg bg-blue-50/30 p-4 overflow-visible">
              <label className="text-xs font-semibold text-blue-900 mb-2 block">Add New Item</label>
              <div ref={itemInputRef} className="flex gap-2 relative">
                <Input
                  placeholder="Type item name..."
                  value={newItem}
                  onChange={(e) => handleItemInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (showItemSuggestions && itemSuggestions.length > 0) {
                        const idx = itemSuggestionActiveIndex >= 0 ? itemSuggestionActiveIndex : 0;
                        handleAddItem(itemSuggestions[idx]);
                      } else {
                        handleAddItem();
                      }
                    } else if (e.key === 'ArrowDown') {
                      if (showItemSuggestions && itemSuggestions.length > 0) {
                        e.preventDefault();
                        setItemSuggestionActiveIndex((idx) => {
                          const next = idx < 0 ? 0 : Math.min(idx + 1, itemSuggestions.length - 1);
                          return next;
                        });
                      }
                    } else if (e.key === 'ArrowUp') {
                      if (showItemSuggestions && itemSuggestions.length > 0) {
                        e.preventDefault();
                        setItemSuggestionActiveIndex((idx) => {
                          const next = idx < 0 ? itemSuggestions.length - 1 : Math.max(idx - 1, 0);
                          return next;
                        });
                      }
                    } else if (e.key === 'Escape') {
                      setShowItemSuggestions(false);
                      setItemSuggestionActiveIndex(-1);
                      setItemDropdownPos(null);
                    }
                  }}
                  className="flex-1 h-9 border-2 border-blue-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-300"
                  onBlur={() => setTimeout(() => {
                    setShowItemSuggestions(false);
                    setItemSuggestionActiveIndex(-1);
                    setItemDropdownPos(null);
                  }, 100)}
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
                  {procedure.instruments.map((instrument, instIndex) => {
                    const hasImage = procedure.instrumentImageMapping?.[instrument] || null;
                    return (
                      <div key={`${procedure.name}-instrument-${instIndex}-${instrument}`} className="flex flex-col gap-1">
                        <Badge
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
                        {procedure.instrumentLocationMapping?.[instrument] && (
                          <span 
                            className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-muted/50 rounded inline-block mt-0.5"
                            title={`Room: ${procedure.instrumentLocationMapping[instrument]?.room || '-'}, Rack: ${procedure.instrumentLocationMapping[instrument]?.rack || '-'}, Box: ${procedure.instrumentLocationMapping[instrument]?.box || '-'}`}
                          >
                            <MapPin className="w-2.5 h-2.5 inline mr-0.5" />
                            {procedure.instrumentLocationMapping[instrument]?.room || '-'}/{procedure.instrumentLocationMapping[instrument]?.rack || '-'}/{procedure.instrumentLocationMapping[instrument]?.box || '-'}
                          </span>
                        )}
                      </div>
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
            <div className="relative pl-6 border-l-4 border-orange-600/60 pt-3 pb-2 border-2 border-orange-600/40 rounded-lg bg-orange-50/30 p-4 overflow-visible">
              <label className="text-xs font-semibold text-orange-900 mb-2 block">Add New Instrument</label>
              <div ref={instrumentInputRef} className="flex gap-2 relative">
                <Input
                  placeholder="Type instrument name..."
                  value={newInstrument}
                  onChange={(e) => handleInstrumentInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (suggestions.length > 0) {
                        const idx = instrumentSuggestionActiveIndex >= 0 ? instrumentSuggestionActiveIndex : 0;
                        const v = suggestions[idx]?.instrument;
                        if (v) {
                          e.preventDefault();
                          handleAddInstrument(v);
                          return;
                        }
                      }
                      handleAddInstrument(newInstrument);
                    } else if (e.key === 'ArrowDown') {
                      if (suggestions.length > 0) {
                        e.preventDefault();
                        setInstrumentSuggestionActiveIndex((idx) => {
                          const next = idx < 0 ? 0 : Math.min(idx + 1, suggestions.length - 1);
                          return next;
                        });
                      }
                    } else if (e.key === 'ArrowUp') {
                      if (suggestions.length > 0) {
                        e.preventDefault();
                        setInstrumentSuggestionActiveIndex((idx) => {
                          const next = idx < 0 ? suggestions.length - 1 : Math.max(idx - 1, 0);
                          return next;
                        });
                      }
                    } else if (e.key === 'Escape') {
                      setSuggestions([]);
                      setInstrumentSuggestionActiveIndex(-1);
                      setInstrumentDropdownPos(null);
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
            </div>
          </div>

          {/* Box Details */}
          <div className="space-y-3 pt-2 border-t-2 border-border/60">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                <div>
                  <h4 className="text-sm font-semibold">Box Details</h4>
                  <p className="text-xs text-muted-foreground">Box numbers for this procedure</p>
                </div>
              </div>
            </div>
            {procedure.boxNumbers && procedure.boxNumbers.length > 0 ? (
              <div className="pl-6 border-l-4 border-blue-600/60">
                <div className="flex flex-wrap gap-2">
                  {procedure.boxNumbers.map((boxNumber, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="pl-3 pr-1.5 py-1.5 flex items-center gap-1.5 hover:bg-secondary/80 transition-colors"
                    >
                      <span className="text-sm">{boxNumber}</span>
                      <button
                        onClick={() => onRemoveBox(index)}
                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                        title="Remove box number"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="pl-6 border-l-4 border-blue-600/60 py-4 text-center text-sm text-muted-foreground">
                No box numbers added. Add box numbers below.
              </div>
            )}

            {/* Add Box Number */}
            <div className="relative pl-6 border-l-4 border-blue-600/60 pt-3 pb-2 border-2 border-blue-600/40 rounded-lg bg-blue-50/30 p-4 overflow-visible">
              <label className="text-xs font-semibold text-blue-900 mb-2 block">Add Box Number</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter box number..."
                  value={newBoxNumber}
                  onChange={(e) => setNewBoxNumber(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (newBoxNumber.trim()) {
                        onAddBox(newBoxNumber.trim());
                        setNewBoxNumber('');
                      }
                    }
                  }}
                  className="flex-1 h-9 border-2 border-blue-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-300"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (newBoxNumber.trim()) {
                      onAddBox(newBoxNumber.trim());
                      setNewBoxNumber('');
                    }
                  }}
                  disabled={!newBoxNumber.trim()}
                  className="h-9 border-2 border-blue-500 hover:border-blue-600"
                  title="Add box number"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal (for instruments, fixed items, and selectable items) */}
      {selectedImage && (
        <InstrumentImageModal
          isOpen={showImageModal}
          onClose={() => {
            setShowImageModal(false);
            setSelectedImage(null);
            setAllImages([]);
            setCurrentImageIndex(0);
          }}
          instrumentName={selectedImage.name}
          imageUrl={selectedImage.url}
          fallbackUrls={selectedImage.fallbackUrls || null}
          allInstruments={allImages}
          currentIndex={currentImageIndex}
          onNavigate={handleNavigateImage}
        />
      )}

      {/* Instrument Suggestions Portal */}
      {suggestions.length > 0 && instrumentDropdownPos && typeof document !== 'undefined' && document.body && createPortal(
        <div
          data-instrument-dropdown
          style={{
            position: 'absolute',
            top: `${instrumentDropdownPos.top}px`,
            left: `${instrumentDropdownPos.left}px`,
            width: `${instrumentDropdownPos.width}px`,
            zIndex: 9999,
          }}
          className="mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.instrument}-${index}`}
              aria-selected={index === instrumentSuggestionActiveIndex}
              className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                index === instrumentSuggestionActiveIndex ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'
              }`}
              onClick={() => handleAddInstrument(suggestion.instrument)}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setInstrumentSuggestionActiveIndex(index)}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`h-1.5 w-1.5 rounded-full ${index === instrumentSuggestionActiveIndex ? 'bg-white' : 'bg-blue-300'}`} />
                  <span className="font-medium truncate">{suggestion.instrument}</span>
                </div>
                <span className={`text-xs shrink-0 ${index === instrumentSuggestionActiveIndex ? 'text-white/90' : 'text-primary/70'}`}>
                  ({suggestion.procedureName})
                </span>
              </div>
            </button>
          ))}
        </div>,
        document.body
      )}

      {/* Item Suggestions Portal */}
      {showItemSuggestions && itemSuggestions.length > 0 && itemDropdownPos && typeof document !== 'undefined' && document.body && createPortal(
        <div
          data-item-dropdown
          style={{
            position: 'absolute',
            top: `${itemDropdownPos.top}px`,
            left: `${itemDropdownPos.left}px`,
            width: `${itemDropdownPos.width}px`,
            zIndex: 9999,
          }}
          className="mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
        >
          {itemSuggestions.map((suggestion, idx) => (
            <button
              key={suggestion}
              aria-selected={idx === itemSuggestionActiveIndex}
              className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                idx === itemSuggestionActiveIndex ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'
              }`}
              onClick={() => handleAddItem(suggestion)}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setItemSuggestionActiveIndex(idx)}
            >
              <div className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${idx === itemSuggestionActiveIndex ? 'bg-white' : 'bg-blue-300'}`} />
                <span className="truncate">{suggestion}</span>
              </div>
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
