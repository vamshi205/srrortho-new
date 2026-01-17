/**
 * COMBINED Google Apps Script for Procedures AND DCs
 * This script handles both:
 * 1. Procedure data (Sheet1 or your procedure sheet)
 * 2. DC data (DCs sheet)
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open your EXISTING Google Apps Script (Extensions > Apps Script)
 * 2. REPLACE all existing code with this combined script
 * 3. Make sure you have TWO sheets in your spreadsheet:
 *    - Your existing procedure sheet (Sheet1 or whatever name you use)
 *    - A new "DCs" sheet with the DC columns
 * 4. Save and redeploy (Deploy > Manage deployments > Edit > Version: New version)
 * 5. Use the SAME deployment URL for both services
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const PROCEDURE_SHEET_NAME = 'Sheet1'; // Change to your procedure sheet name if different
const DC_SHEET_NAME = 'DCs';

// DC Column indices (0-based)
const DC_COLS = {
  ID: 0,
  HOSPITAL_NAME: 1,
  DC_NO: 2,
  MATERIAL_TYPE: 3,
  SAVED_AT: 4,
  RECEIVED_BY: 5,
  REMARKS: 6,
  STATUS: 7,
  ITEMS: 8,
  INSTRUMENTS: 9,
  BOX_NUMBERS: 10,
  RETURNED_BY: 11,
  RETURNED_AT: 12,
  RETURNED_REMARKS: 13,
  INVOICE_REF: 14,
  INVOICE_REMARKS: 15,
  CASH_AT: 16,
  CASH_AMOUNT: 17,
  CASH_REMARKS: 18,
  HISTORY: 19
};

// ============================================================================
// MAIN HANDLERS - Routes requests to appropriate functions
// ============================================================================

/**
 * Handle POST requests (Create, Update, Delete)
 */
function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    const data = requestData.data;
    
    Logger.log('Action: ' + action);
    
    let result;
    
    // Route to appropriate handler based on action
    switch(action) {
      // PROCEDURE ACTIONS
      case 'appendRow':
        result = appendProcedureRow(data);
        break;
      
      // DC ACTIONS
      case 'appendDC':
        result = appendDC(data);
        break;
      case 'updateDC':
        result = updateDC(data);
        break;
      case 'deleteDC':
        result = deleteDC(data);
        break;
      
      default:
        return createResponse(false, 'Unknown action: ' + action);
    }
    
    return createResponse(true, 'Success', result);
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return createResponse(false, 'Error: ' + error.toString());
  }
}

/**
 * Handle GET requests (Read data)
 */
function doGet(e) {
  try {
    // For now, GET is only used for fetching DCs
    // If you need to fetch procedures, add a parameter to distinguish
    const dcs = getDCs();
    return createResponse(true, 'Success', dcs);
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return createResponse(false, 'Error: ' + error.toString());
  }
}

/**
 * Create a standardized JSON response
 */
function createResponse(success, message, data = null) {
  const response = {
    success: success,
    message: message,
    data: data
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// PROCEDURE FUNCTIONS - For managing procedure data
// ============================================================================

/**
 * Append a procedure row to the procedure sheet
 */
function appendProcedureRow(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(PROCEDURE_SHEET_NAME);
  
  if (!sheet) {
    throw new Error('Procedure sheet "' + PROCEDURE_SHEET_NAME + '" not found');
  }
  
  // data is an array of values matching your procedure columns
  sheet.appendRow(data);
  
  Logger.log('Procedure row appended');
  return { success: true };
}

// ============================================================================
// DC FUNCTIONS - For managing DC data
// ============================================================================

/**
 * Get the DCs sheet
 */
function getDCSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(DC_SHEET_NAME);
  
  if (!sheet) {
    throw new Error('Sheet "' + DC_SHEET_NAME + '" not found. Please create it first.');
  }
  
  return sheet;
}

/**
 * Append a new DC
 */
function appendDC(data) {
  const sheet = getDCSheet();
  
  // Serialize complex fields to JSON
  const itemsJson = JSON.stringify(data.items || []);
  const instrumentsJson = JSON.stringify(data.instruments || []);
  const boxNumbersJson = JSON.stringify(data.boxNumbers || []);
  const historyJson = JSON.stringify(data.history || []);
  
  // Create row data matching column order
  const rowData = [
    data.id || '',
    data.hospitalName || '',
    data.dcNo || '',
    data.materialType || '',
    data.savedAt || '',
    data.receivedBy || '',
    data.remarks || '',
    data.status || 'pending',
    itemsJson,
    instrumentsJson,
    boxNumbersJson,
    data.returnedBy || '',
    data.returnedAt || '',
    data.returnedRemarks || '',
    data.invoiceRef || '',
    data.invoiceRemarks || '',
    data.cashAt || '',
    data.cashAmount || '',
    data.cashRemarks || '',
    historyJson
  ];
  
  // Append the row
  sheet.appendRow(rowData);
  
  Logger.log('DC appended: ' + data.id);
  return { id: data.id };
}

/**
 * Get all DCs
 */
function getDCs() {
  const sheet = getDCSheet();
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) {
    // Only header row exists
    return [];
  }
  
  // Get all data (skip header row)
  const range = sheet.getRange(2, 1, lastRow - 1, Object.keys(DC_COLS).length);
  const values = range.getValues();
  
  // Convert to DC objects
  const dcs = values.map(row => {
    // Parse JSON fields
    let items = [];
    let instruments = [];
    let boxNumbers = [];
    let history = [];
    
    try {
      items = row[DC_COLS.ITEMS] ? JSON.parse(row[DC_COLS.ITEMS]) : [];
    } catch (e) {
      Logger.log('Error parsing items: ' + e.toString());
    }
    
    try {
      instruments = row[DC_COLS.INSTRUMENTS] ? JSON.parse(row[DC_COLS.INSTRUMENTS]) : [];
    } catch (e) {
      Logger.log('Error parsing instruments: ' + e.toString());
    }
    
    try {
      boxNumbers = row[DC_COLS.BOX_NUMBERS] ? JSON.parse(row[DC_COLS.BOX_NUMBERS]) : [];
    } catch (e) {
      Logger.log('Error parsing boxNumbers: ' + e.toString());
    }
    
    try {
      history = row[DC_COLS.HISTORY] ? JSON.parse(row[DC_COLS.HISTORY]) : [];
    } catch (e) {
      Logger.log('Error parsing history: ' + e.toString());
    }
    
    return {
      id: row[DC_COLS.ID],
      hospitalName: row[DC_COLS.HOSPITAL_NAME],
      dcNo: row[DC_COLS.DC_NO],
      materialType: row[DC_COLS.MATERIAL_TYPE],
      savedAt: row[DC_COLS.SAVED_AT],
      receivedBy: row[DC_COLS.RECEIVED_BY],
      remarks: row[DC_COLS.REMARKS],
      status: row[DC_COLS.STATUS],
      items: items,
      instruments: instruments,
      boxNumbers: boxNumbers,
      returnedBy: row[DC_COLS.RETURNED_BY] || undefined,
      returnedAt: row[DC_COLS.RETURNED_AT] || undefined,
      returnedRemarks: row[DC_COLS.RETURNED_REMARKS] || undefined,
      invoiceRef: row[DC_COLS.INVOICE_REF] || undefined,
      invoiceRemarks: row[DC_COLS.INVOICE_REMARKS] || undefined,
      cashAt: row[DC_COLS.CASH_AT] || undefined,
      cashAmount: row[DC_COLS.CASH_AMOUNT] || undefined,
      cashRemarks: row[DC_COLS.CASH_REMARKS] || undefined,
      history: history
    };
  }).filter(dc => dc.id); // Filter out rows without ID
  
  return dcs;
}

/**
 * Update an existing DC by ID
 */
function updateDC(data) {
  const sheet = getDCSheet();
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) {
    throw new Error('No DCs found');
  }
  
  // Find the row with matching ID
  const idColumn = sheet.getRange(2, DC_COLS.ID + 1, lastRow - 1, 1).getValues();
  let rowIndex = -1;
  
  for (let i = 0; i < idColumn.length; i++) {
    if (idColumn[i][0] === data.id) {
      rowIndex = i + 2; // +2 because array is 0-based and we skipped header
      break;
    }
  }
  
  if (rowIndex === -1) {
    throw new Error('DC not found with id: ' + data.id);
  }
  
  // Serialize complex fields to JSON
  const itemsJson = JSON.stringify(data.items || []);
  const instrumentsJson = JSON.stringify(data.instruments || []);
  const boxNumbersJson = JSON.stringify(data.boxNumbers || []);
  const historyJson = JSON.stringify(data.history || []);
  
  // Update row data
  const rowData = [
    data.id,
    data.hospitalName || '',
    data.dcNo || '',
    data.materialType || '',
    data.savedAt || '',
    data.receivedBy || '',
    data.remarks || '',
    data.status || 'pending',
    itemsJson,
    instrumentsJson,
    boxNumbersJson,
    data.returnedBy || '',
    data.returnedAt || '',
    data.returnedRemarks || '',
    data.invoiceRef || '',
    data.invoiceRemarks || '',
    data.cashAt || '',
    data.cashAmount || '',
    data.cashRemarks || '',
    historyJson
  ];
  
  // Update the entire row
  const range = sheet.getRange(rowIndex, 1, 1, rowData.length);
  range.setValues([rowData]);
  
  Logger.log('DC updated: ' + data.id);
  return { id: data.id };
}

/**
 * Delete a DC by ID
 */
function deleteDC(data) {
  const sheet = getDCSheet();
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) {
    throw new Error('No DCs found');
  }
  
  // Find the row with matching ID
  const idColumn = sheet.getRange(2, DC_COLS.ID + 1, lastRow - 1, 1).getValues();
  let rowIndex = -1;
  
  for (let i = 0; i < idColumn.length; i++) {
    if (idColumn[i][0] === data.id) {
      rowIndex = i + 2; // +2 because array is 0-based and we skipped header
      break;
    }
  }
  
  if (rowIndex === -1) {
    throw new Error('DC not found with id: ' + data.id);
  }
  
  // Delete the row
  sheet.deleteRow(rowIndex);
  
  Logger.log('DC deleted: ' + data.id);
  return { id: data.id };
}

// ============================================================================
// UTILITY FUNCTIONS (Optional - for testing)
// ============================================================================

/**
 * Test function to verify script is working
 * Run this from Apps Script editor: Run > testScript
 */
function testScript() {
  Logger.log('Script is working!');
  Logger.log('Procedure sheet: ' + PROCEDURE_SHEET_NAME);
  Logger.log('DC sheet: ' + DC_SHEET_NAME);
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const procedureSheet = ss.getSheetByName(PROCEDURE_SHEET_NAME);
  const dcSheet = ss.getSheetByName(DC_SHEET_NAME);
  
  Logger.log('Procedure sheet exists: ' + (procedureSheet !== null));
  Logger.log('DC sheet exists: ' + (dcSheet !== null));
}

