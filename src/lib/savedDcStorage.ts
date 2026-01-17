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

const writeSavedDcs = (items: SavedDc[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  return items;
};

export const loadSavedDcs = (): SavedDc[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as SavedDc[];
  } catch {
    return [];
  }
};

export const saveSavedDc = (
  data: Omit<SavedDc, "id" | "savedAt" | "status"> & { status?: SavedDcStatus },
): SavedDc[] => {
  const existing = loadSavedDcs();
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
  return writeSavedDcs([saved, ...existing]);
};

export const deleteSavedDc = (id: string): SavedDc[] => {
  const existing = loadSavedDcs();
  const updated = existing.filter((dc) => dc.id !== id);
  return writeSavedDcs(updated);
};

export const clearSavedDcs = (): SavedDc[] => writeSavedDcs([]);

export const updateSavedDc = (id: string, updates: Partial<SavedDc>): SavedDc[] => {
  const existing = loadSavedDcs();
  const updated = existing.map((dc) => (dc.id === id ? { ...dc, ...updates } : dc));
  return writeSavedDcs(updated);
};

export const transitionSavedDc = (
  id: string,
  args: {
    toStatus: SavedDcStatus;
    action: SavedDcHistoryEvent["action"];
    updates?: Partial<SavedDc>;
    clear?: Array<keyof SavedDc>;
    meta?: Record<string, unknown>;
  },
): SavedDc[] => {
  const existing = loadSavedDcs();
  const now = new Date().toISOString();
  const updated = existing.map((dc) => {
    if (dc.id !== id) return dc;

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

    return {
      ...dc,
      ...cleared,
      ...(args.updates ?? {}),
      status: args.toStatus,
      history: nextHistory,
    };
  });

  return writeSavedDcs(updated);
};

