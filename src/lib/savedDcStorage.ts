import {
  fetchDcsFromSheets,
  saveDcToSheets,
  updateDcInSheets,
  deleteDcFromSheets,
} from '@/services/dcSheetsService';

export type SavedDcItemSize = {
  size: string;
  qty: number;
};

export type SavedDcItem = {
  name: string;
  sizes: SavedDcItemSize[];
  procedure: string;
  isSelectable: boolean;
};

export type SavedDcStatus = "pending" | "returned" | "completed" | "cash";

export type SavedDcHistoryEvent = {
  at: string; // ISO timestamp
  action:
    | "CREATED"
    | "MARK_RETURNED"
    | "LINK_INVOICE"
    | "MOVE_TO_CASH"
    | "MOVE_BACK_TO_PENDING"
    | "MOVE_BACK_TO_RETURNED"
    | "MOVE_CASH_TO_COMPLETED";
  fromStatus?: SavedDcStatus;
  toStatus: SavedDcStatus;
  meta?: Record<string, unknown>;
};

export type SavedDc = {
  id: string;
  hospitalName: string;
  dcNo: string;
  materialType: string;
  savedAt: string;
  receivedBy: string;
  remarks: string;
  status: SavedDcStatus;
  items: SavedDcItem[];
  instruments: string[];
  boxNumbers: string[];
  returnedBy?: string;
  returnedAt?: string;
  returnedRemarks?: string;
  invoiceRef?: string;
  invoiceRemarks?: string;
  cashAt?: string;
  cashAmount?: number;
  cashRemarks?: string;
  history?: SavedDcHistoryEvent[];
};

const STORAGE_KEY = "srrortho:saved-dcs";

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `dc_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

/**
 * Load DCs from Google Sheets
 */
export const loadSavedDcs = async (): Promise<SavedDc[]> => {
  try {
    const dcs = await fetchDcsFromSheets();
    return dcs;
  } catch (error) {
    console.error('Error loading DCs from Google Sheets:', error);
    // Fallback to localStorage if Google Sheets fails
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed as SavedDc[];
    } catch {
      return [];
    }
  }
};

/**
 * Save a new DC to Google Sheets
 */
export const saveSavedDc = async (
  data: Omit<SavedDc, "id" | "savedAt" | "status"> & { status?: SavedDcStatus },
): Promise<SavedDc> => {
  const now = new Date().toISOString();
  const saved: SavedDc = {
    ...data,
    id: createId(),
    savedAt: now,
    status: data.status ?? "pending",
    history: [
      {
        at: now,
        action: "CREATED",
        toStatus: (data.status ?? "pending") as SavedDcStatus,
      },
    ],
  };

  try {
    await saveDcToSheets(saved);
    return saved;
  } catch (error) {
    console.error('Error saving DC to Google Sheets:', error);
    throw error;
  }
};

/**
 * Delete a DC from Google Sheets
 */
export const deleteSavedDc = async (id: string): Promise<void> => {
  try {
    await deleteDcFromSheets(id);
  } catch (error) {
    console.error('Error deleting DC from Google Sheets:', error);
    throw error;
  }
};

/**
 * Update a DC in Google Sheets
 */
export const updateSavedDc = async (id: string, updates: Partial<SavedDc>): Promise<SavedDc> => {
  try {
    // First, fetch all DCs to get the current DC
    const dcs = await loadSavedDcs();
    const dc = dcs.find((d) => d.id === id);
    
    if (!dc) {
      throw new Error(`DC not found with id: ${id}`);
    }
    
    // Merge updates with existing DC
    const updatedDc: SavedDc = { ...dc, ...updates };
    
    // Update in Google Sheets
    await updateDcInSheets(updatedDc);
    
    return updatedDc;
  } catch (error) {
    console.error('Error updating DC in Google Sheets:', error);
    throw error;
  }
};

/**
 * Transition a DC to a new status with history tracking
 */
export const transitionSavedDc = async (
  id: string,
  args: {
    toStatus: SavedDcStatus;
    action: SavedDcHistoryEvent["action"];
    updates?: Partial<SavedDc>;
    clear?: Array<keyof SavedDc>;
    meta?: Record<string, unknown>;
  },
): Promise<SavedDc> => {
  try {
    // Fetch all DCs to get the current DC
    const dcs = await loadSavedDcs();
    const dc = dcs.find((d) => d.id === id);
    
    if (!dc) {
      throw new Error(`DC not found with id: ${id}`);
    }

    const now = new Date().toISOString();
    const fromStatus = (dc.status ?? "pending") as SavedDcStatus;

    const clearedSnapshot: Record<string, unknown> = {};
    const cleared: Partial<SavedDc> = {};
    for (const key of args.clear ?? []) {
      clearedSnapshot[key as string] = (dc as any)[key];
      (cleared as any)[key] = undefined;
    }

    const nextHistory: SavedDcHistoryEvent[] = [
      ...(dc.history ?? []),
      {
        at: now,
        action: args.action,
        fromStatus,
        toStatus: args.toStatus,
        meta: {
          ...(args.meta ?? {}),
          ...(args.clear?.length ? { cleared: clearedSnapshot } : {}),
        },
      },
    ];

    const updatedDc: SavedDc = {
      ...dc,
      ...cleared,
      ...(args.updates ?? {}),
      status: args.toStatus,
      history: nextHistory,
    };

    // Update in Google Sheets
    await updateDcInSheets(updatedDc);
    
    return updatedDc;
  } catch (error) {
    console.error('Error transitioning DC in Google Sheets:', error);
    throw error;
  }
};

/**
 * Clear all DCs from Google Sheets (use with caution!)
 */
export const clearSavedDcs = async (): Promise<void> => {
  try {
    const dcs = await loadSavedDcs();
    for (const dc of dcs) {
      await deleteDcFromSheets(dc.id);
    }
  } catch (error) {
    console.error('Error clearing DCs from Google Sheets:', error);
    throw error;
  }
};

/**
 * Migrate DCs from localStorage to Google Sheets
 * This is a one-time migration utility
 */
export const migrateLocalStorageToSheets = async (): Promise<{ success: number; failed: number }> => {
  let success = 0;
  let failed = 0;

  try {
    // Read from localStorage
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { success: 0, failed: 0 };
    }

    const localDcs = JSON.parse(raw) as SavedDc[];
    if (!Array.isArray(localDcs) || localDcs.length === 0) {
      return { success: 0, failed: 0 };
    }

    // Save each DC to Google Sheets
    for (const dc of localDcs) {
      try {
        await saveDcToSheets(dc);
        success++;
      } catch (error) {
        console.error(`Failed to migrate DC ${dc.id}:`, error);
        failed++;
      }
    }

    // Clear localStorage after successful migration
    if (success > 0 && failed === 0) {
      localStorage.removeItem(STORAGE_KEY);
    }

    return { success, failed };
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
};

