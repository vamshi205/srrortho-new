// Google Sheets Service for writing data
// This service handles writing procedure data to Google Sheets

const SHEET_ID = '2PACX-1vQu2GZRYcJnEjFaDryWHowegMFVkf8xzewGsEKqNLw7onpe1if24LnJrIZAl4CB5QdgVFjE1PqFYmUa';
const SHEET_NAME = 'Sheet1'; // Change if your sheet has a different name

// Option 1: Using Google Apps Script (Recommended - No API key needed)
// You need to create a Google Apps Script web app first
// Set VITE_GOOGLE_APPS_SCRIPT_URL in your environment variables
const APPS_SCRIPT_URL = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || '';

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
  itemLocations: string; // Pipe-separated locations for selectable items (format: Room1|Rack2|Box3|Room4|Rack5|Box6)
  fixedItemLocations: string; // Pipe-separated locations for fixed items
  instrumentLocations: string; // Pipe-separated locations for instruments
}

/**
 * Save procedure data to Google Sheets using Google Apps Script
 */
export async function saveProcedureToSheets(data: ProcedureRowData): Promise<boolean> {
  const appsScriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || '';
  if (!appsScriptUrl) {
    throw new Error('Google Apps Script URL not configured. Please set VITE_GOOGLE_APPS_SCRIPT_URL in your environment variables.');
  }

  try {
    console.log('Saving to Google Sheets via:', appsScriptUrl);
    console.log('Data being sent:', {
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
        data.itemLocations,
        data.fixedItemLocations,
        data.instrumentLocations,
      ],
    });

    const response = await fetch(appsScriptUrl, {
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
          data.itemLocations,
          data.fixedItemLocations,
          data.instrumentLocations,
        ],
      }),
    });

    console.log('Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response error:', errorText);
      throw new Error(`Failed to save: ${response.status} ${response.statusText}. ${errorText}`);
    }

    const result = await response.json();
    console.log('Response result:', result);
    
    if (result.success !== true) {
      throw new Error(result.error || 'Save operation failed');
    }
    
    return true;
  } catch (error: any) {
    console.error('Error saving to Google Sheets:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Could not connect to Google Apps Script. Check your internet connection and Apps Script URL.');
    }
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
    data.itemLocations,
    data.fixedItemLocations,
    data.instrumentLocations,
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
    escapeCSV(data.itemLocations),
    escapeCSV(data.fixedItemLocations),
    escapeCSV(data.instrumentLocations),
  ].join(',');
}

