/**
 * Google Apps Script for DC Management
 * Deploy this as a Web App to enable CRUD operations on DCs
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Spreadsheet
 * 2. Create a new sheet named "DCs" with these column headers in row 1:
 *    id | hospitalName | dcNo | materialType | savedAt | receivedBy | remarks | status | items | instruments | boxNumbers | returnedBy | returnedAt | returnedRemarks | invoiceRef | invoiceRemarks | cashAt | cashAmount | cashRemarks | history
 * 3. Go to Extensions > Apps Script
 * 4. Delete any existing code and paste this entire file
 * 5. Save the project (name it "DC Manager")
 * 6. Click Deploy > New deployment
 * 7. Select type: Web app
 * 8. Execute as: Me
 * 9. Who has access: Anyone (or "Anyone with Google account" for more security)
 * 10. Click Deploy
 * 11. Copy the Web App URL and paste it in src/services/dcSheetsService.ts
 */

const SHEET_NAME = 'DCs';

// Column indices (0-based)
const COLS = {
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

/**
 * Handle POST requests (Create, Update, Delete)
 */
function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    const data = requestData.data;
    
    Logger.log('Action: ' + action);
    Logger.log('Data: ' + JSON.stringify(data));
    
    let result;
    switch(action) {
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
 * Handle GET requests (Read all DCs)
 */
function doGet(e) {
  try {
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

/**
 * Get the DCs sheet
 */
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    throw new Error('Sheet "' + SHEET_NAME + '" not found. Please create it first.');
  }
  
  return sheet;
}

/**
 * Append a new DC
 */
function appendDC(data) {
  const sheet = getSheet();
  
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
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) {
    // Only header row exists
    return [];
  }
  
  // Get all data (skip header row)
  const range = sheet.getRange(2, 1, lastRow - 1, Object.keys(COLS).length);
  const values = range.getValues();
  
  // Convert to DC objects
  const dcs = values.map(row => {
    // Parse JSON fields
    let items = [];
    let instruments = [];
    let boxNumbers = [];
    let history = [];
    
    try {
      items = row[COLS.ITEMS] ? JSON.parse(row[COLS.ITEMS]) : [];
    } catch (e) {
      Logger.log('Error parsing items: ' + e.toString());
    }
    
    try {
      instruments = row[COLS.INSTRUMENTS] ? JSON.parse(row[COLS.INSTRUMENTS]) : [];
    } catch (e) {
      Logger.log('Error parsing instruments: ' + e.toString());
    }
    
    try {
      boxNumbers = row[COLS.BOX_NUMBERS] ? JSON.parse(row[COLS.BOX_NUMBERS]) : [];
    } catch (e) {
      Logger.log('Error parsing boxNumbers: ' + e.toString());
    }
    
    try {
      history = row[COLS.HISTORY] ? JSON.parse(row[COLS.HISTORY]) : [];
    } catch (e) {
      Logger.log('Error parsing history: ' + e.toString());
    }
    
    return {
      id: row[COLS.ID],
      hospitalName: row[COLS.HOSPITAL_NAME],
      dcNo: row[COLS.DC_NO],
      materialType: row[COLS.MATERIAL_TYPE],
      savedAt: row[COLS.SAVED_AT],
      receivedBy: row[COLS.RECEIVED_BY],
      remarks: row[COLS.REMARKS],
      status: row[COLS.STATUS],
      items: items,
      instruments: instruments,
      boxNumbers: boxNumbers,
      returnedBy: row[COLS.RETURNED_BY] || undefined,
      returnedAt: row[COLS.RETURNED_AT] || undefined,
      returnedRemarks: row[COLS.RETURNED_REMARKS] || undefined,
      invoiceRef: row[COLS.INVOICE_REF] || undefined,
      invoiceRemarks: row[COLS.INVOICE_REMARKS] || undefined,
      cashAt: row[COLS.CASH_AT] || undefined,
      cashAmount: row[COLS.CASH_AMOUNT] || undefined,
      cashRemarks: row[COLS.CASH_REMARKS] || undefined,
      history: history
    };
  }).filter(dc => dc.id); // Filter out rows without ID
  
  return dcs;
}

/**
 * Update an existing DC by ID
 */
function updateDC(data) {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) {
    throw new Error('No DCs found');
  }
  
  // Find the row with matching ID
  const idColumn = sheet.getRange(2, COLS.ID + 1, lastRow - 1, 1).getValues();
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
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) {
    throw new Error('No DCs found');
  }
  
  // Find the row with matching ID
  const idColumn = sheet.getRange(2, COLS.ID + 1, lastRow - 1, 1).getValues();
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

