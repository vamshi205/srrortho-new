# Testing Google Sheets Save Functionality

## Method 1: Test via Admin Panel (Recommended)

1. **Start your dev server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Open the app** in your browser:
   - Go to `http://localhost:8114`
   - Login with your credentials

3. **Navigate to Admin Panel**:
   - Click the wrench icon in the header, or
   - Go directly to `http://localhost:8114/admin`

4. **Fill in a test procedure**:
   - Procedure Name: `Test Procedure`
   - Procedure Type: `General` (or any type)
   - Add at least one item (fixed or selectable)
   - Optionally add instruments

5. **Click "Save to Google Sheets"**:
   - You should see a success toast notification
   - Check your Google Sheet - a new row should appear!

6. **Verify in Google Sheet**:
   - Open your Google Sheet
   - Check the last row - it should contain your test data
   - The data format should match: Name | Items | Fixed Items | Fixed Qty | Instruments | Type | Images | Locations

## Method 2: Test Apps Script URL Directly

You can test if your Apps Script is working by visiting the URL in a browser:

1. **Test doGet function**:
   - Open: `https://script.google.com/macros/s/AKfycbwuWq5p80MEulDBhcxIyFQk5PoUg7_ut8EygcWOsWrK-UA3l5WureRRC_6xi0RmcNE9/exec`
   - You should see: "Google Sheets API is running"
   - If you see a login page, the script needs to be redeployed with "Anyone" access

2. **Test doPost function** (using browser console or Postman):
   - Open browser console (F12)
   - Run this test:
   ```javascript
   fetch('https://script.google.com/macros/s/AKfycbwuWq5p80MEulDBhcxIyFQk5PoUg7_ut8EygcWOsWrK-UA3l5WureRRC_6xi0RmcNE9/exec', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({
       action: 'appendRow',
       data: ['Test Procedure', 'Test Item', 'Test Fixed', '1', 'Test Instrument', 'General', '', '', '', '', '', '']
     })
   })
   .then(response => response.json())
   .then(data => console.log('Success:', data))
   .catch(error => console.error('Error:', error));
   ```
   - Check your Google Sheet - a test row should appear

## Method 3: Test via Browser DevTools

1. Open your app in browser
2. Open DevTools (F12) → Console tab
3. Navigate to Admin panel
4. Fill in a procedure
5. Before clicking Save, open Network tab in DevTools
6. Click "Save to Google Sheets"
7. Look for a request to your Apps Script URL
8. Check the response - should show `{success: true}`

## Troubleshooting

### Error: "Google Apps Script URL not configured"
- Make sure `VITE_GOOGLE_APPS_SCRIPT_URL` is set in `.env.local` (for local) or Vercel (for deployment)
- Restart dev server after adding env variables
- Check that the variable name is exactly `VITE_GOOGLE_APPS_SCRIPT_URL`

### Error: "Failed to save: [status code]"
- Check Apps Script execution logs:
  - Go to Apps Script editor
  - Click "Executions" tab
  - Look for errors
- Verify the script is deployed as web app
- Check "Who has access" is set to "Anyone"

### Data not appearing in sheet
- Check Apps Script execution logs for errors
- Verify you're looking at the correct sheet tab
- Make sure the script has permission to edit the sheet
- Check that the sheet isn't protected/read-only

### CORS Errors
- Google Apps Script web apps handle CORS automatically
- If you see CORS errors, the script might not be deployed correctly
- Try redeploying the script

## Expected Behavior

**On Success:**
- Toast notification: "Procedure '[name]' saved to Google Sheets successfully"
- Form resets
- New row appears in Google Sheet

**On Failure:**
- Toast notification with error message
- Data is copied to clipboard as fallback
- Check browser console for detailed error

## Test Data Format

When you save, the data is sent in this format:
```json
{
  "action": "appendRow",
  "data": [
    "Procedure Name",
    "Item1|Item2",           // Selectable items (pipe-separated)
    "FixedItem1|FixedItem2", // Fixed items (pipe-separated)
    "1|2",                    // Fixed quantities (pipe-separated)
    "Instrument1|Inst2",     // Instruments (pipe-separated)
    "General",                // Procedure type
    "Img1|Img2",              // Instrument images (pipe-separated)
    "FixedImg1|FixedImg2",    // Fixed item images (pipe-separated)
    "ItemImg1|ItemImg2",      // Item images (pipe-separated)
    "Room1|Rack1|Box1|...",   // Item locations (pipe-separated)
    "Room1|Rack1|Box1|...",   // Fixed item locations (pipe-separated)
    "Room1|Rack1|Box1|..."    // Instrument locations (pipe-separated)
  ]
}
```

This will appear as a single row in your Google Sheet.

