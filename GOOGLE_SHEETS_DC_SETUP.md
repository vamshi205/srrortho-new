# Google Sheets DC Storage - Setup & Testing Guide

This guide will help you set up Google Sheets integration for storing and managing DCs (Delivery Challans).

## ✅ What's Been Implemented

All the code for saving DCs to Google Sheets has been implemented:

1. ✅ Google Apps Script for CRUD operations (`GoogleAppsScript-DCs.js`)
2. ✅ Frontend service to communicate with Google Sheets (`src/services/dcSheetsService.ts`)
3. ✅ Updated storage module to use Google Sheets (`src/lib/savedDcStorage.ts`)
4. ✅ Updated OrthoApp with async save operations
5. ✅ Updated SavedDcs page with async fetch/update/delete operations
6. ✅ Migration utility to move localStorage DCs to Sheets (in Admin panel)

## 📋 Setup Instructions

### Step 1: Prepare Your Google Spreadsheet

1. Open your existing Google Spreadsheet (the one with procedures data)
2. Create a new sheet (tab) named **"DCs"**
3. In the first row, add these column headers exactly as shown:
   ```
   id | hospitalName | dcNo | materialType | savedAt | receivedBy | remarks | status | items | instruments | boxNumbers | returnedBy | returnedAt | returnedRemarks | invoiceRef | invoiceRemarks | cashAt | cashAmount | cashRemarks | history
   ```

### Step 2: Deploy Google Apps Script

1. In your Google Spreadsheet, go to **Extensions > Apps Script**
2. Delete any existing code in the editor
3. Copy the entire contents of `GoogleAppsScript-DCs.js` from your project root
4. Paste it into the Apps Script editor
5. **Save** the project (File > Save or Ctrl+S)
6. Name it "DC Manager" (or any name you prefer)
7. Click **Deploy > New deployment**
8. Click the gear icon ⚙️ next to "Select type"
9. Choose **Web app**
10. Configure the deployment:
    - **Description**: "DC CRUD Operations" (optional)
    - **Execute as**: **Me** (your Google account)
    - **Who has access**: Choose one:
      - **Anyone** - No Google login required (recommended for internal tools)
      - **Anyone with Google account** - Requires users to have a Google account
11. Click **Deploy**
12. **Important**: You'll need to authorize the script:
    - Click **Authorize access**
    - Choose your Google account
    - Click **Advanced** (if you see a warning)
    - Click **Go to DC Manager (unsafe)** - This is safe, it's your own script
    - Click **Allow**
13. **Copy the Web App URL** - it will look like:
    ```
    https://script.google.com/macros/s/AKfycby.../exec
    ```

### Step 3: Configure Frontend

1. Open `src/services/dcSheetsService.ts`
2. Find line 11:
   ```typescript
   const APPS_SCRIPT_URL = ''; // TODO: Paste your deployed web app URL here
   ```
3. Paste your Web App URL inside the quotes:
   ```typescript
   const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby.../exec';
   ```
4. Save the file

### Step 4: Build and Deploy

```bash
npm run build
# or
bun run build
```

Deploy the updated `dist/` folder to your hosting (Vercel, etc.)

## 🧪 Testing Checklist

After setup, test these features in order:

### 1. Test DC Save (Create)
- [ ] Open the DC Generator
- [ ] Select a procedure and fill in items
- [ ] Enter Hospital Name, DC No, and Received By
- [ ] Click "Save DC"
- [ ] Check that you see "DC saved" toast notification
- [ ] Verify in Google Sheets "DCs" tab that a new row appeared
- [ ] Check that all fields are populated correctly in the sheet

### 2. Test DC Fetch (Read)
- [ ] Navigate to "Saved DC List"
- [ ] Verify that DCs load from Google Sheets
- [ ] Check that the DC you just saved appears in the list
- [ ] Click on a DC to view details
- [ ] Verify all information is displayed correctly

### 3. Test DC Update
- [ ] In "Saved DC List", select a pending DC
- [ ] Click "Mark as Returned"
- [ ] Enter "Returned By" name
- [ ] Submit
- [ ] Verify the DC moves to "Returned" tab
- [ ] Check Google Sheets - verify the status updated to "returned"
- [ ] Verify returnedBy and returnedAt fields are populated

### 4. Test DC Status Transitions
- [ ] Mark a returned DC with an Invoice number
- [ ] Verify it moves to "Completed" tab
- [ ] Check Google Sheets for status update
- [ ] Try moving a returned DC to "Cash"
- [ ] Enter cash amount and remarks
- [ ] Verify it appears in "Cash" tab
- [ ] Check Google Sheets for the cash data

### 5. Test DC Delete
- [ ] Create a test DC
- [ ] Delete it from the list
- [ ] Verify it's removed from Google Sheets
- [ ] Try deleting a "returned" or "completed" DC (should require password: "srrortho")

### 6. Test Migration (if you have old DCs in localStorage)
- [ ] Go to Admin panel
- [ ] Check "DC Data Migration" section
- [ ] Click "Migrate DCs to Google Sheets"
- [ ] Verify migration success message
- [ ] Check Google Sheets to confirm old DCs appeared
- [ ] Verify old DCs now appear in "Saved DC List"

## 🐛 Troubleshooting

### Error: "Google Apps Script URL not configured"
- **Solution**: Make sure you pasted the Web App URL in `src/services/dcSheetsService.ts` line 11
- Rebuild and redeploy after making changes

### Error: "Failed to fetch/save DC"
- **Possible causes**:
  1. Web App URL is incorrect - check it matches exactly from deployment
  2. Apps Script deployment failed - try redeploying
  3. Sheet name "DCs" doesn't exist - create it exactly as "DCs"
  4. Column headers don't match - verify all 19 columns are present

### DCs not appearing after save
- **Check**:
  1. Open browser console (F12) for error messages
  2. Verify the "DCs" sheet exists in your spreadsheet
  3. Check if the DC was added to Google Sheets manually
  4. Try the migration tool to resync

### Authorization errors
- **Solution**: Re-deploy the Apps Script:
  1. Go to Apps Script editor
  2. Click Deploy > Manage deployments
  3. Click the 3 dots next to your deployment
  4. Click "Manage deployment"
  5. Click "Test deployments" or create new version
  6. Re-authorize if prompted

### CORS errors
- **This shouldn't happen** with Apps Script web apps, but if it does:
  1. Make sure you're accessing via the deployment URL (ends with `/exec`)
  2. Not the editor URL (ends with `/edit`)

## 📊 Data Structure in Google Sheets

### How data is stored:

- **Simple fields**: Stored directly (id, hospitalName, dcNo, etc.)
- **Complex fields**: JSON stringified
  - `items`: Array of item objects with name, sizes, procedure, isSelectable
  - `instruments`: Array of instrument names
  - `boxNumbers`: Array of box number strings
  - `history`: Array of history events tracking status changes

### Example row in Google Sheets:

| id | hospitalName | dcNo | status | items | instruments |
|----|-------------|------|--------|-------|-------------|
| dc_123... | City Hospital | DC001 | pending | [{"name":"SS Plate","sizes":[...],...}] | ["Drill","Hammer"] |

## 🔒 Security Notes

1. **Web App Access**: Choose "Anyone" only if your spreadsheet is for internal use. For public tools, use "Anyone with Google account"
2. **Password Protection**: Non-pending DC deletions require password "srrortho" (can be changed in SavedDcs.tsx line 270)
3. **Data Privacy**: All DC data is stored in YOUR Google Spreadsheet - you have full control

## 🎯 Benefits of Google Sheets Storage

1. ✅ **Multi-device**: Access DCs from any device
2. ✅ **Multi-user**: Multiple users can save/view DCs simultaneously
3. ✅ **Backup**: Automatic Google Drive backup
4. ✅ **History**: Full audit trail of status changes
5. ✅ **Reporting**: Use Google Sheets features for analytics
6. ✅ **Scalable**: Handles thousands of DCs

## 🚀 Next Steps

After successful testing:

1. Delete the test DCs from Google Sheets if needed
2. Train your team on the new workflow
3. Run migration if you have existing DCs in localStorage
4. Monitor the first few real DCs to ensure everything works
5. Set up regular backups of your Google Spreadsheet

## 📝 Notes

- The old localStorage functionality is still available as a fallback
- If Google Sheets is unavailable, you'll see error messages
- All operations are async - loading states show during network requests
- DCs are sorted by `savedAt` descending (most recent first)

## 🤝 Support

If you encounter issues:
1. Check browser console for detailed error messages
2. Verify all setup steps were completed
3. Test with a simple DC first
4. Check Google Apps Script execution logs (View > Executions in Apps Script editor)

