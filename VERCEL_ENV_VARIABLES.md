# Vercel Environment Variables Setup

## Complete List of Environment Variables

Add these environment variables in your Vercel project:

### Required Variables

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `VITE_VALID_EMAIL` | `srrorthoplus999@gmail.com` | Login email for authentication |
| `VITE_VALID_PASSWORD` | `srrOrthOSat` | Login password for authentication |
| `VITE_GOOGLE_SHEET_ID` | `2PACX-1vQu2GZRYcJnEjFaDryWHowegMFVkf8xzewGsEKqNLw7onpe1if24LnJrIZAl4CB5QdgVFjE1PqFYmUa` | Google Sheet ID |
| `VITE_GOOGLE_SHEETS_URL` | `https://docs.google.com/spreadsheets/d/e/2PACX-1vQu2GZRYcJnEjFaDryWHowegMFVkf8xzewGsEKqNLw7onpe1if24LnJrIZAl4CB5QdgVFjE1PqFYmUa/pub?output=csv` | Google Sheets CSV export URL |
| `VITE_GOOGLE_APPS_SCRIPT_URL` | `https://script.google.com/macros/s/AKfycbwuWq5p80MEulDBhcxIyFQk5PoUg7_ut8EygcWOsWrK-UA3l5WureRRC_6xi0RmcNE9/exec` | Google Apps Script web app URL for saving data |

### Optional Variables (if needed later)

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `VITE_GOOGLE_SHEETS_API_KEY` | (leave empty) | Google Sheets API key (if using API instead of Apps Script) |

## How to Add in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Click **Add New**
4. For each variable:
   - Enter the **Name** (exactly as shown above)
   - Enter the **Value** (copy from the table above)
   - Select **Environments**: Check all (Production, Preview, Development)
   - Click **Save**
5. After adding all variables, **redeploy** your application

## Quick Copy-Paste Format

```
VITE_VALID_EMAIL=srrorthoplus999@gmail.com
VITE_VALID_PASSWORD=srrOrthOSat
VITE_GOOGLE_SHEET_ID=2PACX-1vQu2GZRYcJnEjFaDryWHowegMFVkf8xzewGsEKqNLw7onpe1if24LnJrIZAl4CB5QdgVFjE1PqFYmUa
VITE_GOOGLE_SHEETS_URL=https://docs.google.com/spreadsheets/d/e/2PACX-1vQu2GZRYcJnEjFaDryWHowegMFVkf8xzewGsEKqNLw7onpe1if24LnJrIZAl4CB5QdgVFjE1PqFYmUa/pub?output=csv
VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbwuWq5p80MEulDBhcxIyFQk5PoUg7_ut8EygcWOsWrK-UA3l5WureRRC_6xi0RmcNE9/exec
```

## For Local Development (.env.local)

Create a `.env.local` file in your project root with:

```env
VITE_VALID_EMAIL=srrorthoplus999@gmail.com
VITE_VALID_PASSWORD=srrOrthOSat
VITE_GOOGLE_SHEET_ID=2PACX-1vQu2GZRYcJnEjFaDryWHowegMFVkf8xzewGsEKqNLw7onpe1if24LnJrIZAl4CB5QdgVFjE1PqFYmUa
VITE_GOOGLE_SHEETS_URL=https://docs.google.com/spreadsheets/d/e/2PACX-1vQu2GZRYcJnEjFaDryWHowegMFVkf8xzewGsEKqNLw7onpe1if24LnJrIZAl4CB5QdgVFjE1PqFYmUa/pub?output=csv
VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbwuWq5p80MEulDBhcxIyFQk5PoUg7_ut8EygcWOsWrK-UA3l5WureRRC_6xi0RmcNE9/exec
```

**Important**: Restart your dev server after adding/updating `.env.local` file.

