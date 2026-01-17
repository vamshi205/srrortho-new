export type ImageDbPackedState = {
  packed: boolean;
  packedAt: string; // ISO
};

type ImageDbPackedMap = Record<string, Record<string, ImageDbPackedState>>; // procedureName -> itemKey -> state

const STORAGE_KEY = "srrortho:imageDb:packed:v1";

const safeJsonParse = (value: string | null): unknown => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export function loadImageDbPacked(): ImageDbPackedMap {
  const raw = safeJsonParse(localStorage.getItem(STORAGE_KEY));
  if (!raw || typeof raw !== "object") return {};
  return raw as ImageDbPackedMap;
}

export function saveImageDbPacked(next: ImageDbPackedMap): ImageDbPackedMap {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function setPackedForItem(procedureName: string, itemKey: string, packed: boolean): ImageDbPackedMap {
  const current = loadImageDbPacked();
  const proc = current[procedureName] ?? {};
  const nextProc = {
    ...proc,
    [itemKey]: {
      packed,
      packedAt: new Date().toISOString(),
    },
  };
  return saveImageDbPacked({
    ...current,
    [procedureName]: nextProc,
  });
}

export function clearPackedForProcedure(procedureName: string): ImageDbPackedMap {
  const current = loadImageDbPacked();
  const { [procedureName]: _removed, ...rest } = current;
  return saveImageDbPacked(rest);
}


