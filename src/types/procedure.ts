export interface SizeQty {
  size: string;
  qty: string;
}

export interface FixedItem {
  name: string;
  qty: string;
}

export interface Procedure {
  name: string;
  items: string[];
  fixedItems: FixedItem[];
  instruments: string[];
  type: string;
  instrumentImageMapping?: Record<string, string | null>;
}

export interface SelectedItem {
  itemName: string;
  sizeQty: SizeQty[];
}

export interface ActiveProcedure extends Procedure {
  selectedItems: Map<string, SelectedItem>;
  selectedFixedItems: Map<string, boolean>;
  fixedQtyEdits: Map<string, string>;
  instruments: string[];
  instrumentImageMapping?: Record<string, string | null>;
}
