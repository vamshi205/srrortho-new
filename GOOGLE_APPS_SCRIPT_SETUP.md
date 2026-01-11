# Google Apps Script Setup Guide

This guide will help you set up Google Apps Script to enable direct saving of procedure data to your Google Sheet from the admin panel.

## Overview

Google Apps Script allows you to create a web app that can append rows to your Google Sheet without requiring API keys or OAuth setup. This is the simplest way to enable direct saving functionality.

## Step-by-Step Setup

### Step 1: Open Google Apps Script

1. Open your Google Sheet
2. Go to **Extensions** → **Apps Script**
3. A new tab will open with the Apps Script editor

### Step 2: Create or Update the Script

1. If you already have a script, you can use your existing one (it's already compatible!)
2. If creating new, copy and paste the following code:

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'appendRow') {
      sheet.appendRow(data.data);
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Invalid action' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput('Google Sheets API is running')
    .setMimeType(ContentService.MimeType.TEXT);
}
```

**Note**: This script includes:
- `doPost` function that handles the appendRow action (matches what the app sends)
- `doGet` function for testing (you can visit the URL in a browser to verify it's working)
- Proper error handling and JSON responses

### Step 3: Save the Script

1. Click **File** → **Save** (or press `Ctrl+S` / `Cmd+S`)
2. Give your project a name (e.g., "Procedure Data Handler")
3. Click **Save**

### Step 4: Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon (⚙️) next to "Select type" and choose **Web app**
3. Configure the deployment:
   - **Description**: "Procedure Data Handler v1" (or any description)
   - **Execute as**: **Me** (your Google account)
   - **Who has access**: **Anyone** (this allows your app to call it)
4. Click **Deploy**
5. You may be prompted to authorize the script:
   - Click **Authorize access**
   - Choose your Google account
   - Click **Advanced** → **Go to [Project Name] (unsafe)**
   - Click **Allow**
6. Copy the **Web app URL** that appears
   - It will look like: `https://script.google.com/macros/s/.../exec`

### Step 5: Add URL to Environment Variables

1. **For Local Development**: Add to your `.env.local` file:
   ```
   VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   ```

2. **For Vercel Deployment**: 
   - Go to your Vercel project dashboard
   - Navigate to **Settings** → **Environment Variables**
   - Add a new variable:
     - **Name**: `VITE_GOOGLE_APPS_SCRIPT_URL`
     - **Value**: `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec`
     - **Environment**: Select all (Production, Preview, Development)
   - Click **Save**
   - Redeploy your application

### Step 6: Test the Setup

1. Go to your admin panel
2. Fill in a test procedure
3. Click **Save to Google Sheets**
4. Check your Google Sheet - a new row should appear!

## Troubleshooting

### Error: "Google Apps Script URL not configured"
- Make sure you've added `VITE_GOOGLE_APPS_SCRIPT_URL` to your environment variables
- Restart your development server after adding the variable
- For Vercel, make sure you've redeployed after adding the variable

### Error: "Failed to save: [status]"
- Check that the script is deployed and accessible
- Verify the Web app URL is correct
- Make sure "Who has access" is set to "Anyone"
- Check the Apps Script execution logs: **Executions** tab in Apps Script editor

### Data not appearing in sheet
- Check the Apps Script execution logs for errors
- Verify the sheet name matches (default is "Sheet1")
- Make sure you're looking at the correct sheet tab
- Check that the script has permission to edit the sheet

### Permission errors
- Make sure you authorized the script when deploying
- Re-authorize if needed: **Deploy** → **Manage deployments** → **Edit** → Re-authorize

## Security Notes

⚠️ **Important**: 
- The Web app URL allows anyone with the URL to append data to your sheet
- This is acceptable for a personal project but consider additional security for production
- The URL is stored in environment variables, so it's not easily discoverable
- You can add additional validation in the Apps Script if needed

## Advanced: Add Validation (Optional)

If you want to add validation or security checks, modify the `doPost` function:

```javascript
function doPost(e) {
  try {
    // Optional: Add API key validation
    const apiKey = e.parameter.apiKey;
    const validApiKey = 'YOUR_SECRET_KEY'; // Set this in environment variables
    
    if (apiKey !== validApiKey) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    
    if (!data.data || !Array.isArray(data.data)) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Invalid data format'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Optional: Validate data before appending
    if (!data.data[0] || data.data[0].trim() === '') {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Procedure name is required'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    sheet.appendRow(data.data);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Row added successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

## Data Format

The script expects data in this format:
```json
{
  "action": "appendRow",
  "data": [
    "Procedure Name",
    "Item1|Item2|Item3",
    "FixedItem1|FixedItem2",
    "1|2|3",
    "Instrument1|Instrument2",
    "Procedure Type",
    "ImageURL1|ImageURL2",
    "FixedImageURL1|FixedImageURL2",
    "ItemImageURL1|ItemImageURL2",
    "Room1|Rack1|Box1|Room2|Rack2|Box2",
    "FixedRoom1|FixedRack1|FixedBox1",
    "InstRoom1|InstRack1|InstBox1"
  ]
}
```

The script will append this as a single row to your Google Sheet.

## Need Help?

If you encounter issues:
1. Check the Apps Script execution logs
2. Verify all environment variables are set correctly
3. Test the script URL directly using a tool like Postman or curl
4. Make sure your Google Sheet is accessible and editable

