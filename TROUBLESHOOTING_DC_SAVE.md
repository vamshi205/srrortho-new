# 🔍 Troubleshooting: DC Not Saving

## Quick Debugging Steps

Follow these steps in order:

### Step 1: Open Browser Console
1. Press **F12** (or right-click > Inspect)
2. Click on the **Console** tab
3. Try to save a DC
4. Look for any RED error messages

**Common Errors & Fixes:**

#### Error: "Google Apps Script URL not configured"
**Fix**: Make sure `dcSheetsService.ts` line 11 has your URL

#### Error: "Failed to fetch" or "Network error"
**Fix**: Check internet connection, verify Apps Script URL is correct

#### Error: "CORS error"
**Fix**: Make sure you're using the `/exec` URL, not `/edit` URL

---

### Step 2: Check Network Request
1. Open DevTools (F12)
2. Click **Network** tab
3. Try to save a DC
4. Look for a request to `script.google.com`
5. Click on it to see:
   - **Status**: Should be 200 (green)
   - **Response**: Should have `{"success": true}`

---

### Step 3: Verify Configuration

Check these files have the correct URL:

**File 1**: `src/services/dcSheetsService.ts` line 11:
```typescript
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyN_KzlP_8LXP3-MwRNZ-byziqK4Qd5VIKTkZL-3fyD0PDOLjojzQ3RFKWce9QYqoYH/exec';
```

**File 2**: `src/services/googleSheetsService.ts` line 9:
```typescript
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyN_KzlP_8LXP3-MwRNZ-byziqK4Qd5VIKTkZL-3fyD0PDOLjojzQ3RFKWce9QYqoYH/exec';
```

---

### Step 4: Test Apps Script Directly

Open this URL in your browser:
```
https://script.google.com/macros/s/AKfycbyN_KzlP_8LXP3-MwRNZ-byziqK4Qd5VIKTkZL-3fyD0PDOLjojzQ3RFKWce9QYqoYH/exec
```

**Expected Response:**
```json
{"success":true,"message":"Success","data":[]}
```

**If you see an error**, that's the problem - fix it first.

---

### Step 5: Check Google Sheets

1. Open your Google Spreadsheet
2. Find the "DCs" sheet tab at the bottom
3. Verify row 1 has all 19 column headers:
   ```
   id | hospitalName | dcNo | materialType | savedAt | receivedBy | remarks | status | items | instruments | boxNumbers | returnedBy | returnedAt | returnedRemarks | invoiceRef | invoiceRemarks | cashAt | cashAmount | cashRemarks | history
   ```

---

### Step 6: Rebuild the App

After making configuration changes, you MUST rebuild:

```bash
# Stop the dev server (Ctrl+C)

# Rebuild
npm run build
# or
bun run build

# Restart dev server
npm run dev
# or
bun run dev
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Confirmation Dialog Doesn't Appear
**Symptoms**: Click "Save DC" but nothing happens
**Check**:
- Console for errors
- Are Hospital Name, DC No, and Received By filled in?

---

### Issue 2: "Saving..." Never Completes
**Symptoms**: Button shows "Saving..." forever
**Causes**:
1. Apps Script URL is wrong
2. Network timeout
3. Apps Script error

**Debug**:
- Check Network tab for failed request
- Check Apps Script execution logs (Apps Script > View > Executions)

---

### Issue 3: Success Toast But No Data in Sheets
**Symptoms**: See "DC saved" message but sheet is empty
**Causes**:
1. Wrong sheet name in Apps Script
2. Apps Script permission issues

**Fix**:
1. Check Apps Script `DC_SHEET_NAME` (should be 'DCs')
2. Open Apps Script > View > Executions to see errors
3. Re-authorize Apps Script if needed

---

### Issue 4: "Authorization Required" Error
**Symptoms**: Apps Script returns authorization error
**Fix**:
1. Open Apps Script editor
2. Run the `testScript()` function
3. Click "Review permissions"
4. Choose your account
5. Click "Advanced" > "Go to [Project] (unsafe)"
6. Click "Allow"

---

## 🧪 Test Save Function Step by Step

### Test 1: Minimal DC
Try saving the simplest possible DC:

1. Select ONE procedure (or use Manual DC with 1 item)
2. Fill in:
   - Hospital Name: "Test Hospital"
   - DC No: "TEST001"
   - Received By: "Test User"
3. Click "Save DC"
4. Check confirmation dialog appears
5. Click "Confirm & Save"
6. Watch for "DC saved" toast
7. Check Google Sheets

### Test 2: Check Saved Data
If row appears in Google Sheets:
- ✅ Saving works!
- Check if all columns are populated correctly
- If some columns are empty, that's normal (like returnedBy, etc.)

---

## 📝 Enable Detailed Logging

Add this to help debug:

Open browser console and run:
```javascript
localStorage.setItem('debug', 'true');
```

Then refresh the page. You'll see more detailed console logs.

---

## 🆘 If Still Not Working

Please check and share:

1. **Console Errors**: Any red errors in browser console?
2. **Network Response**: What does the network request show?
3. **Apps Script URL Test**: What response do you get when opening the URL?
4. **Sheet Structure**: Does "DCs" sheet have all 19 columns?
5. **Build Status**: Did you rebuild after configuration changes?

---

## ✅ Quick Checklist

Before asking for help, verify:

- [ ] Apps Script URL is in `dcSheetsService.ts` line 11
- [ ] URL ends with `/exec` not `/edit`
- [ ] "DCs" sheet exists with 19 columns
- [ ] Browser console shows no errors
- [ ] App was rebuilt after configuration changes
- [ ] Network tab shows request to script.google.com
- [ ] Apps Script test URL returns `{"success":true}`

