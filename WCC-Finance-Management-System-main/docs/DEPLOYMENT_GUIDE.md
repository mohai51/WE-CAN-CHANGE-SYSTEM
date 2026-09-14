# Complete Deployment & Setup Guide

Follow these instructions to deploy the **WCC Finance Management & Accounting System** on your Google Workspace environment.

---

## Step 1: Create the Google Spreadsheet Database

1. Open [Google Sheets](https://sheets.new) in your browser.
2. Name your spreadsheet: **`WCC Finance Management Database`**.
3. Note the **Spreadsheet ID** from the URL bar:
   `https://docs.google.com/spreadsheets/d/`**`YOUR_SPREADSHEET_ID_HERE`**`/edit`

---

## Step 2: Set up Google Apps Script Backend

1. In your new Google Sheet, click **Extensions** &rarr; **Apps Script**.
2. Delete any default code in `Code.gs`.
3. Create the following script files in the Apps Script editor (copy content from the `/gas` folder in this codebase):
   - `Config.gs` (Set `SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'`)
   - `Database.gs`
   - `Code.gs`
   - `Accounts.gs`
   - `Expenses.gs`
   - `Income.gs`
   - `Activities.gs`
   - `Reimbursements.gs`
   - `Advances.gs`
   - `Users.gs`
   - `Files.gs`
   - `Audit.gs`

---

## Step 3: Run Automated Database Initializer

1. In the Apps Script editor top dropdown, select the function **`initDatabase`**.
2. Click **Run**.
3. Authorize the required Google Permissions (Spreadsheet & Drive access).
4. Check your Google Sheet: All **21 sheets** (`Dashboard_Data`, `Transactions`, `Expenses`, `Income`, `Activities`, etc.) with Crimson header styling will be created automatically!

---

## Step 4: Deploy as Web App

1. In the Apps Script editor, click the blue **Deploy** button (top-right) &rarr; **New deployment**.
2. Select type: **Web app** (gear icon &rarr; Web app).
3. Fill in the deployment form:
   - **Description**: `WCC Finance API v1.0`
   - **Execute as**: `Me (your Google account)`
   - **Who has access**: `Anyone` (Allows the frontend web app to communicate with the Apps Script API securely).
4. Click **Deploy**.
5. Copy the generated **Web App URL**:
   `https://script.google.com/macros/s/AKfycb.../exec`

---

## Step 5: Connect the Frontend Application

1. Open `index.html` in any web browser (or host it on GitHub Pages, Netlify, Vercel, or internal intranet).
2. Navigate to **Settings & GAS API** from the sidebar.
3. Paste your published Web App URL into the **Apps Script Web App URL** input field.
4. Click **Save & Connect**.
5. The top status pill will turn green: **`LIVE GAS API`**!

---

## Testing Verification Checklist

- [x] Record a new Expense with an attached bill &rarr; Check `Expenses` and `Transactions` sheets in Google Sheet.
- [x] Record a Member Personal Expense &rarr; Verify `Reimbursements` sheet has a matching claim and member balance updates.
- [x] Disburse Reimbursement &rarr; Verify status updates to `Paid` in both `Reimbursements` and `Expenses`.
- [x] Issue Advance and Settle &rarr; Check `Advances` and `Advance_Settlements` sheets.
- [x] Generate Activity Financial Statement &rarr; Download official PDF and verify calculations.
