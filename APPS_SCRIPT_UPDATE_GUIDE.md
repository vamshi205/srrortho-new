# 📝 How to Update Your Google Apps Script

## 🎯 Quick Answer

**REPLACE your existing script with the COMBINED script** - This gives you both Procedures AND DCs in one deployment.

---

## ✅ **Option 1: COMBINED Script (RECOMMENDED)**

### Why This Is Best:
- ✅ One deployment URL for everything
- ✅ Both Procedures and DCs in same script
- ✅ Easier to manage
- ✅ Fewer moving parts

### Steps:

1. **Open Your Apps Script**
   - Go to your Google Spreadsheet
   - Click **Extensions > Apps Script**

2. **Replace All Code**
   - Select ALL existing code in the editor (Ctrl+A or Cmd+A)
   - Delete it
   - Copy ALL code from `GoogleAppsScript-COMBINED.js`
   - Paste into the Apps Script editor

3. **Configure Sheet Names** (if needed)
   - Line 25: `const PROCEDURE_SHEET_NAME = 'Sheet1';`
     - Change `'Sheet1'` to your actual procedure sheet name
   - Line 26: `const DC_SHEET_NAME = 'DCs';`
     - Keep as `'DCs'` (or change if you named it differently)

4. **Save**
   - Click the disk icon or press Ctrl+S / Cmd+S

5. **Redeploy**
   - Click **Deploy > Manage deployments**
   - Click the pencil/edit icon next to your existing deployment
   - Under "Version", select **New version**
   - Click **Deploy**
   - **IMPORTANT**: The URL stays the same! You don't need to update anything in your code

6. **You're Done!**
   - Same deployment URL works for both Procedures and DCs
   - No configuration changes needed in your frontend code

---

## 🔧 **Option 2: Separate Scripts (Not Recommended)**

If you really want separate scripts (NOT recommended):

### For Procedures:
- Keep your existing Apps Script as is
- Use existing deployment URL in `googleSheetsService.ts`

### For DCs:
- Create a NEW Apps Script project
- Copy code from `GoogleAppsScript-DCs.js`
- Deploy as separate Web App
- Get new URL and paste in `dcSheetsService.ts`

**Why This Is More Work:**
- ❌ Two deployment URLs to manage
- ❌ Two scripts to update
- ❌ More complexity
- ❌ No real benefit

---

## 📊 How the Combined Script Works

```
Frontend Request
    ↓
    {action: 'appendRow', data: [...]} → Procedure function
    {action: 'appendDC', data: {...}}  → DC function
    {action: 'updateDC', data: {...}}  → DC function
    {action: 'deleteDC', data: {...}}  → DC function
    ↓
Same Apps Script (routes by action)
    ↓
Same Spreadsheet, Different Sheets:
    - Sheet1 (or your procedure sheet) → Procedures
    - DCs sheet → DCs
```

---

## 🧪 Testing the Combined Script

### Test in Apps Script Editor:

1. In Apps Script editor, find the `testScript()` function
2. Click the play button ▶️ next to the function dropdown
3. Check the logs (View > Logs or Ctrl+Enter)
4. Should see:
   ```
   Script is working!
   Procedure sheet: Sheet1
   DC sheet: DCs
   Procedure sheet exists: true
   DC sheet exists: true
   ```

---

## 📋 Checklist

Before updating:
- [ ] Backup your existing script (copy to a text file)
- [ ] Know your procedure sheet name
- [ ] Have "DCs" sheet created with columns

After updating:
- [ ] Script saved successfully
- [ ] Redeployed with new version
- [ ] Test function runs without errors
- [ ] Both sheets exist (run testScript)

---

## 🆘 Troubleshooting

### "Sheet not found" error
**Fix**: Check sheet names on lines 25-26 match your actual sheet names

### "Authorization required"
**Fix**: When you run testScript or redeploy, click "Authorize access" and approve

### "Syntax error"
**Fix**: Make sure you copied the ENTIRE script, including all closing braces

### Deployment doesn't update
**Fix**: Make sure you selected "New version" when redeploying, not the same version

---

## ✨ What Changes in Your Frontend Code?

### Answer: NOTHING! 🎉

Both services already use the same deployment URL:

**Procedures** (`googleSheetsService.ts` line 9):
```typescript
const APPS_SCRIPT_URL = 'YOUR_URL_HERE';
```

**DCs** (`dcSheetsService.ts` line 11):
```typescript
const APPS_SCRIPT_URL = 'YOUR_URL_HERE';
```

Just make sure BOTH have the same URL (your deployment URL).

---

## 📝 Summary

1. **REPLACE** your existing Apps Script with `GoogleAppsScript-COMBINED.js`
2. **Check** sheet names are correct (lines 25-26)
3. **Save** the script
4. **Redeploy** as new version
5. **Test** by running `testScript()` function
6. **Use** the same deployment URL for both services

**Time Required**: 5 minutes  
**Difficulty**: Easy (copy-paste)  
**Risk**: Low (can always restore from backup)

---

## 🎯 Final Note

The combined script is **production-ready** and handles:
- ✅ All procedure operations (existing functionality)
- ✅ All DC operations (new functionality)
- ✅ Error handling
- ✅ JSON serialization
- ✅ Proper routing

**Status**: Ready to deploy immediately!

