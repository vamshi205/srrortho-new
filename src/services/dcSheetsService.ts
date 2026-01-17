/**
 * DC Google Sheets Service
 * Handles reading and writing DCs to Google Sheets via Apps Script Web App
 * 
 * SETUP:
 * 1. Deploy the GoogleAppsScript-DCs.js file as a web app (see instructions in that file)
 * 2. Copy the web app URL and paste it below in APPS_SCRIPT_URL
 */

// Google Apps Script Web App URL for DC Management (Separate Spreadsheet)
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxmNjXKcZpAE9_xN7G8DyqfobW1T6v7BaxrQkkp0U-7MJaM-blnVuN2SsemX7XQa8Ws/exec';
const SHEET_NAME = 'DCs';

import type { SavedDc, SavedDcItem, SavedDcHistoryEvent } from '@/lib/savedDcStorage';

export interface SavedDcRowData {
  id: string;
  hospitalName: string;
  dcNo: string;
  materialType: string;
  savedAt: string;
  receivedBy: string;
  remarks: string;
  status: string;
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
}

interface AppsScriptResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Check if Apps Script URL is configured
 */
function checkConfiguration(): void {
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.trim() === '') {
    throw new Error(
      'Google Apps Script URL not configured. Please deploy the script and add the URL to src/services/dcSheetsService.ts'
    );
  }
}

/**
 * Fetch all DCs from Google Sheets
 */
export async function fetchDcsFromSheets(): Promise<SavedDc[]> {
  checkConfiguration();

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch DCs: ${response.status} ${response.statusText}`);
    }

    const result: AppsScriptResponse = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch DCs from Google Sheets');
    }

    const dcs: SavedDc[] = result.data || [];
    
    // Sort by savedAt descending (most recent first)
    return dcs.sort((a, b) => {
      const dateA = new Date(a.savedAt).getTime();
      const dateB = new Date(b.savedAt).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error fetching DCs from Google Sheets:', error);
    throw error;
  }
}

/**
 * Save a new DC to Google Sheets
 */
export async function saveDcToSheets(dc: SavedDc): Promise<boolean> {
  checkConfiguration();

  try {
    const payload: SavedDcRowData = {
      id: dc.id,
      hospitalName: dc.hospitalName,
      dcNo: dc.dcNo,
      materialType: dc.materialType,
      savedAt: dc.savedAt,
      receivedBy: dc.receivedBy,
      remarks: dc.remarks,
      status: dc.status,
      items: dc.items,
      instruments: dc.instruments,
      boxNumbers: dc.boxNumbers,
      returnedBy: dc.returnedBy,
      returnedAt: dc.returnedAt,
      returnedRemarks: dc.returnedRemarks,
      invoiceRef: dc.invoiceRef,
      invoiceRemarks: dc.invoiceRemarks,
      cashAt: dc.cashAt,
      cashAmount: dc.cashAmount,
      cashRemarks: dc.cashRemarks,
      history: dc.history,
    };

    // Use URLSearchParams to avoid CORS preflight
    const formData = new URLSearchParams();
    formData.append('payload', JSON.stringify({
      action: 'appendDC',
      data: payload,
    }));

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to save DC: ${response.status} ${response.statusText}`);
    }

    const result: AppsScriptResponse = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to save DC to Google Sheets');
    }

    return true;
  } catch (error) {
    console.error('Error saving DC to Google Sheets:', error);
    throw error;
  }
}

/**
 * Update an existing DC in Google Sheets
 */
export async function updateDcInSheets(dc: SavedDc): Promise<boolean> {
  checkConfiguration();

  try {
    const payload: SavedDcRowData = {
      id: dc.id,
      hospitalName: dc.hospitalName,
      dcNo: dc.dcNo,
      materialType: dc.materialType,
      savedAt: dc.savedAt,
      receivedBy: dc.receivedBy,
      remarks: dc.remarks,
      status: dc.status,
      items: dc.items,
      instruments: dc.instruments,
      boxNumbers: dc.boxNumbers,
      returnedBy: dc.returnedBy,
      returnedAt: dc.returnedAt,
      returnedRemarks: dc.returnedRemarks,
      invoiceRef: dc.invoiceRef,
      invoiceRemarks: dc.invoiceRemarks,
      cashAt: dc.cashAt,
      cashAmount: dc.cashAmount,
      cashRemarks: dc.cashRemarks,
      history: dc.history,
    };

    // Use URLSearchParams to avoid CORS preflight
    const formData = new URLSearchParams();
    formData.append('payload', JSON.stringify({
      action: 'updateDC',
      data: payload,
    }));

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to update DC: ${response.status} ${response.statusText}`);
    }

    const result: AppsScriptResponse = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to update DC in Google Sheets');
    }

    return true;
  } catch (error) {
    console.error('Error updating DC in Google Sheets:', error);
    throw error;
  }
}

/**
 * Delete a DC from Google Sheets
 */
export async function deleteDcFromSheets(id: string): Promise<boolean> {
  checkConfiguration();

  try {
    // Use URLSearchParams to avoid CORS preflight
    const formData = new URLSearchParams();
    formData.append('payload', JSON.stringify({
      action: 'deleteDC',
      data: { id },
    }));

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to delete DC: ${response.status} ${response.statusText}`);
    }

    const result: AppsScriptResponse = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to delete DC from Google Sheets');
    }

    return true;
  } catch (error) {
    console.error('Error deleting DC from Google Sheets:', error);
    throw error;
  }
}

/**
 * Check if the service is properly configured
 */
export function isConfigured(): boolean {
  return APPS_SCRIPT_URL !== '' && APPS_SCRIPT_URL.trim() !== '';
}

/**
 * Get configuration status
 */
export function getConfigurationStatus(): { configured: boolean; url: string } {
  return {
    configured: isConfigured(),
    url: APPS_SCRIPT_URL || 'Not configured',
  };
}

