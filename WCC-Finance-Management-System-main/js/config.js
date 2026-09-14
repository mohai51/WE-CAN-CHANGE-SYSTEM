/**
 * WCC Finance Management & Accounting System
 * Global Configuration & Constants
 */

const CONFIG = {
  // Google Apps Script Web App Deployment URL
  // Replace with your published Apps Script Web App URL after deployment
  API_URL: localStorage.getItem('WCC_GAS_API_URL') || '',
  
  // Storage Keys
  STORAGE_KEYS: {
    API_URL: 'WCC_GAS_API_URL',
    USE_MOCK: 'WCC_USE_MOCK',
    AUTH_USER: 'WCC_AUTH_USER',
    THEME: 'WCC_THEME',
    SIDEBAR_COLLAPSED: 'WCC_SIDEBAR_COLLAPSED',
    CACHED_DATA: 'WCC_CACHED_DATA'
  },

  // Organization Information
  ORG: {
    name: 'We Can Change (WCC)',
    legalName: 'We Can Change Foundation',
    slogan: 'Empowering Communities, Changing Lives',
    currency: '৳',
    currencyCode: 'BDT',
    locale: 'en-BD',
    financialYear: '2025-2026',
    contactEmail: 'finance@wecanchange.org',
    contactPhone: '+880 1700-000000',
    website: 'https://wecanchange.org'
  },

  // Role-Based Access Control Definitions
  ROLES: {
    ADMIN: 'Admin',
    FINANCE_MANAGER: 'Finance Manager',
    FINANCE_OFFICER: 'Finance Officer',
    DATA_ENTRY: 'Data Entry User',
    VIEWER: 'Viewer'
  },

  // Permissions Map
  PERMISSIONS: {
    VIEW_FINANCES: ['Admin', 'Finance Manager', 'Finance Officer', 'Data Entry User', 'Viewer'],
    CREATE_TRANSACTIONS: ['Admin', 'Finance Manager', 'Finance Officer', 'Data Entry User'],
    EDIT_TRANSACTIONS: ['Admin', 'Finance Manager', 'Finance Officer'],
    DELETE_TRANSACTIONS: ['Admin', 'Finance Manager'],
    VERIFY_EXPENSES: ['Admin', 'Finance Manager', 'Finance Officer'],
    APPROVE_REIMBURSEMENTS: ['Admin', 'Finance Manager', 'Finance Officer'],
    APPROVE_ADVANCES: ['Admin', 'Finance Manager', 'Finance Officer'],
    SETTLE_ADVANCES: ['Admin', 'Finance Manager', 'Finance Officer'],
    CLOSE_ACTIVITIES: ['Admin', 'Finance Manager', 'Finance Officer'],
    EDIT_FINANCES: ['Admin', 'Finance Manager', 'Finance Officer'],
    EDIT_EXPENSES: ['Admin', 'Finance Manager', 'Finance Officer'],
    EDIT_INCOME: ['Admin', 'Finance Manager', 'Finance Officer'],
    EDIT_ADVANCES: ['Admin', 'Finance Manager', 'Finance Officer'],
    EDIT_ACTIVITIES: ['Admin', 'Finance Manager', 'Finance Officer'],
    EDIT_REIMBURSEMENTS: ['Admin', 'Finance Manager', 'Finance Officer'],
    EDIT_ACCOUNTS: ['Admin', 'Finance Manager', 'Finance Officer'],
    MANAGE_USERS: ['Admin'],
    MANAGE_SETTINGS: ['Admin', 'Finance Manager'],
    GENERATE_REPORTS: ['Admin', 'Finance Manager', 'Finance Officer', 'Viewer']
  },

  // Transaction Types
  TRANSACTION_TYPES: {
    INCOME: 'Income',
    EXPENSE: 'Expense',
    MEMBER_REIMBURSEMENT: 'Member Reimbursement',
    MEMBER_ADVANCE: 'Member Advance',
    ADVANCE_SETTLEMENT: 'Advance Settlement',
    ADJUSTMENT: 'Adjustment'
  },

  // Activity Types
  ACTIVITY_TYPES: [
    'Event',
    'Program',
    'Project',
    'Meeting',
    'Office Operation',
    'Campaign',
    'Training',
    'Health Camp',
    'Workshop',
    'Other'
  ],

  // Income Types
  INCOME_TYPES: [
    'Donation',
    'Membership Fee',
    'Sponsorship',
    'Project Grant',
    'Event Contribution',
    'Fundraising',
    'Service Income',
    'Other Income'
  ],

  // Pre-configured 24 Expense Categories
  EXPENSE_CATEGORIES: [
    'Food & Refreshment',
    'Transportation',
    'Venue',
    'Decoration',
    'Printing & Stationery',
    'Medical Supplies',
    'Equipment',
    'Marketing & Promotion',
    'Accommodation',
    'Honorarium',
    'Salary/Wages',
    'Communication',
    'Office Rent',
    'Electricity/Utilities',
    'Internet',
    'Software/Subscription',
    'Training',
    'Travel',
    'Logistics',
    'Purchase',
    'Maintenance',
    'Government/Official Fees',
    'Bank/MFS Charges',
    'Emergency Expense',
    'Miscellaneous'
  ],

  // Payment Methods
  PAYMENT_METHODS: [
    'Cash',
    'Bank Transfer',
    'Cheque',
    'bKash',
    'Nagad',
    'Rocket',
    'Other'
  ],

  // Approval Status Lifecycle
  STATUSES: {
    DRAFT: 'Draft',
    SUBMITTED: 'Submitted',
    VERIFIED: 'Verified',
    APPROVED: 'Approved',
    PAID: 'Paid',
    REJECTED: 'Rejected',
    CANCELLED: 'Cancelled',
    ACTIVE: 'Active',
    COMPLETED: 'Completed',
    CLOSED: 'Closed'
  },

  // ID Prefixes
  ID_PREFIXES: {
    TRANSACTION: 'WCC-TXN',
    EXPENSE: 'WCC-EXP',
    INCOME: 'WCC-INC',
    ACTIVITY: 'WCC-ACT',
    PROJECT: 'WCC-PRJ',
    PROGRAM: 'WCC-PRG',
    MEETING: 'WCC-MTG',
    REIMBURSEMENT: 'WCC-REIM',
    ADVANCE: 'WCC-ADV',
    SETTLEMENT: 'WCC-SET',
    MEMBER: 'WCC-MBR',
    VENDOR: 'WCC-VND',
    ACCOUNT: 'WCC-ACC',
    ATTACHMENT: 'WCC-ATT',
    AUDIT: 'WCC-LOG'
  }
};

window.CONFIG = CONFIG;
