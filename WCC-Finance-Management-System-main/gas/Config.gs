/**
 * WCC Finance Management & Accounting System
 * Google Apps Script - System Configuration
 */

var GAS_CONFIG = {
  // Replace with your Google Spreadsheet ID (or leave blank to use SpreadsheetApp.getActiveSpreadsheet())
  SPREADSHEET_ID: '',

  // Google Drive Folders
  DRIVE_ROOT_FOLDER_NAME: 'WCC_Finance_Documents',
  DRIVE_VOUCHERS_FOLDER_NAME: 'Vouchers_and_Bills',
  DRIVE_REPORTS_FOLDER_NAME: 'Financial_Reports',

  // 21 Database Sheet Names
  SHEETS: {
    DASHBOARD_DATA: 'Dashboard_Data',
    TRANSACTIONS: 'Transactions',
    INCOME: 'Income',
    EXPENSES: 'Expenses',
    ACTIVITIES: 'Activities',
    PROJECTS: 'Projects',
    PROGRAMS: 'Programs',
    MEETINGS: 'Meetings',
    CATEGORIES: 'Categories',
    VENDORS: 'Vendors',
    MEMBERS: 'Members',
    ACCOUNTS: 'Accounts',
    BUDGETS: 'Budgets',
    REIMBURSEMENTS: 'Reimbursements',
    ADVANCES: 'Advances',
    ADVANCE_SETTLEMENTS: 'Advance_Settlements',
    ATTACHMENTS: 'Attachments',
    USERS: 'Users',
    APPROVALS: 'Approvals',
    AUDIT_LOG: 'Audit_Log',
    SETTINGS: 'Settings'
  }
};
