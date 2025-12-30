// Google Sheets Service for writing data
// This service handles writing procedure data to Google Sheets

const SHEET_ID = '2PACX-1vQu2GZRYcJnEjFaDryWHowegMFVkf8xzewGsEKqNLw7onpe1if24LnJrIZAl4CB5QdgVFjE1PqFYmUa';
const SHEET_NAME = 'Sheet1'; // Change if your sheet has a different name

// Option 1: Using Google Apps Script (Recommended - No API key needed)
// You need to create a Google Apps Script web app first
const APPS_SCRIPT_URL = ''; // Add your Google Apps Script web app URL here

// Option 2: Using Google Sheets API (Requires API key and OAuth)
const API_KEY = ''; // Add your Google Sheets API key here

export interface ProcedureRowData {
  name: string;
  items: string; // Pipe-separated selectable items
  fixedItems: string; // Pipe-separated fixed items
  fixedQty: string; // Pipe-separated fixed quantities
  instruments: string; // Pipe-separated instruments
  type: string;
  instrumentImages: string; // Pipe-separated image URLs
  fixedItemImages: string; // Pipe-separated image URLs
  itemImages: string; // Pipe-separated image URLs
}

/**
 * Save procedure data to Google Sheets using Google Apps Script
 */
export async function saveProcedureToSheets(data: ProcedureRowData): Promise<boolean> {
  if (!APPS_SCRIPT_URL) {
    throw new Error('Google Apps Script URL not configured. Please set up the web app first.');
  }

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'appendRow',
        data: [
          data.name,
          data.items,
          data.fixedItems,
          data.fixedQty,
          data.instruments,
          data.type,
          data.instrumentImages,
          data.fixedItemImages,
          data.itemImages,
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save: ${response.statusText}`);
    }

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('Error saving to Google Sheets:', error);
    throw error;
  }
}

/**
 * Alternative: Copy data to clipboard for manual paste
 */
export function copyProcedureDataToClipboard(data: ProcedureRowData): string {
  const rowData = [
    data.name,
    data.items,
    data.fixedItems,
    data.fixedQty,
    data.instruments,
    data.type,
    data.instrumentImages,
    data.fixedItemImages,
    data.itemImages,
  ].join('\t'); // Tab-separated for easy paste into Google Sheets

  return rowData;
}

/**
 * Format data as CSV row
 */
export function formatProcedureAsCSV(data: ProcedureRowData): string {
  const escapeCSV = (value: string) => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  return [
    escapeCSV(data.name),
    escapeCSV(data.items),
    escapeCSV(data.fixedItems),
    escapeCSV(data.fixedQty),
    escapeCSV(data.instruments),
    escapeCSV(data.type),
    escapeCSV(data.instrumentImages),
    escapeCSV(data.fixedItemImages),
    escapeCSV(data.itemImages),
  ].join(',');
}

