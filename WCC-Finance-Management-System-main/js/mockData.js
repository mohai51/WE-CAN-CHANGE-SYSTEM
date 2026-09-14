/**
 * WCC Finance Management & Accounting System
 * Clean Initial System Schema & Master Tables
 * (Zero mock transactions, zero mock expenses, zero mock income)
 */

const INITIAL_MOCK_DATA = {
  settings: {
    orgName: 'We Can Change (WCC)',
    legalName: 'We Can Change Foundation',
    currency: '৳',
    currencyCode: 'BDT',
    financialYear: '2025-2026',
    contactEmail: 'finance@wecanchange.org',
    contactPhone: '+880 1711-000000',
    address: 'House 42, Road 11, Banani, Dhaka-1213, Bangladesh',
    driveRootFolderId: '',
    driveVouchersFolderId: '',
    driveReportsFolderId: '',
    requireSupportingDocsForExpenseAbove: 1000,
    enableEmailApprovalAlerts: true
  },

  users: [
    {
      id: 'USR-001',
      name: 'System Admin',
      email: 'admin@wecanchange.org',
      role: 'Admin',
      phone: '+880 1711-000000',
      status: 'Active',
      avatar: 'AD'
    },
    {
      id: 'USR-002',
      name: 'Finance Manager',
      email: 'finance.manager@wecanchange.org',
      role: 'Finance Manager',
      phone: '+880 1711-000001',
      status: 'Active',
      avatar: 'FM'
    },
    {
      id: 'USR-003',
      name: 'Finance Officer',
      email: 'finance.officer@wecanchange.org',
      role: 'Finance Officer',
      phone: '+880 1711-000002',
      status: 'Active',
      avatar: 'FO'
    },
    {
      id: 'USR-004',
      name: 'Data Entry Operator',
      email: 'entry@wecanchange.org',
      role: 'Data Entry User',
      phone: '+880 1711-000003',
      status: 'Active',
      avatar: 'DE'
    },
    {
      id: 'USR-005',
      name: 'Auditor / Viewer',
      email: 'auditor@wecanchange.org',
      role: 'Viewer',
      phone: '+880 1711-000004',
      status: 'Active',
      avatar: 'AU'
    }
  ],

  members: [
    {
      id: 'WCC-MBR-000001',
      name: 'Dr. Farhana Rahman',
      designation: 'Medical Director / Trustee',
      email: 'farhana.rahman@wecanchange.org',
      phone: '+880 1711-100001',
      bankName: 'City Bank PLC',
      bankAccountNo: '1501234567890',
      mfsType: 'bKash',
      mfsNumber: '01711-100001',
      totalPersonalExpenses: 0,
      totalReimbursed: 0,
      currentOutstanding: 0,
      activeAdvances: 0
    },
    {
      id: 'WCC-MBR-000002',
      name: 'Md. Tanvir Ahmed',
      designation: 'Field Operations Lead',
      email: 'tanvir.ahmed@wecanchange.org',
      phone: '+880 1711-100002',
      bankName: 'BRAC Bank PLC',
      bankAccountNo: '2050123456789',
      mfsType: 'bKash',
      mfsNumber: '01711-100002',
      totalPersonalExpenses: 0,
      totalReimbursed: 0,
      currentOutstanding: 0,
      activeAdvances: 0
    },
    {
      id: 'WCC-MBR-000003',
      name: 'Nusrat Jahan',
      designation: 'Program Coordinator',
      email: 'nusrat.jahan@wecanchange.org',
      phone: '+880 1711-100003',
      bankName: 'Eastern Bank PLC',
      bankAccountNo: '1040123456789',
      mfsType: 'Nagad',
      mfsNumber: '01811-100003',
      totalPersonalExpenses: 0,
      totalReimbursed: 0,
      currentOutstanding: 0,
      activeAdvances: 0
    },
    {
      id: 'WCC-MBR-000004',
      name: 'Ahsan Habib',
      designation: 'Logistics Executive',
      email: 'ahsan.habib@wecanchange.org',
      phone: '+880 1711-100004',
      bankName: 'Dutch-Bangla Bank',
      bankAccountNo: '1150123456789',
      mfsType: 'bKash',
      mfsNumber: '01911-100004',
      totalPersonalExpenses: 0,
      totalReimbursed: 0,
      currentOutstanding: 0,
      activeAdvances: 0
    }
  ],

  vendors: [],

  accounts: [
    {
      id: 'WCC-ACC-000001',
      name: 'Cash in Hand (Main Vault)',
      accountType: 'Cash',
      accountNumber: 'CASH-VAULT-01',
      bankName: 'Internal Petty Cash Vault',
      openingBalance: 0,
      currentBalance: 0,
      status: 'Active'
    },
    {
      id: 'WCC-ACC-000002',
      name: 'Main Bank Account',
      accountType: 'Bank Account',
      accountNumber: '1501200000000001',
      bankName: 'Corporate Bank PLC',
      openingBalance: 0,
      currentBalance: 0,
      status: 'Active'
    },
    {
      id: 'WCC-ACC-000003',
      name: 'bKash Merchant Account',
      accountType: 'bKash',
      accountNumber: '01700-000000',
      bankName: 'bKash Ltd',
      openingBalance: 0,
      currentBalance: 0,
      status: 'Active'
    },
    {
      id: 'WCC-ACC-000004',
      name: 'Nagad Corporate Wallet',
      accountType: 'Nagad',
      accountNumber: '01800-000000',
      bankName: 'Nagad Ltd',
      openingBalance: 0,
      currentBalance: 0,
      status: 'Active'
    }
  ],

  categories: [
    { id: 'CAT-01', name: 'Food & Refreshment', type: 'Expense', status: 'Active' },
    { id: 'CAT-02', name: 'Transportation', type: 'Expense', status: 'Active' },
    { id: 'CAT-03', name: 'Venue', type: 'Expense', status: 'Active' },
    { id: 'CAT-04', name: 'Decoration', type: 'Expense', status: 'Active' },
    { id: 'CAT-05', name: 'Printing & Stationery', type: 'Expense', status: 'Active' },
    { id: 'CAT-06', name: 'Medical Supplies', type: 'Expense', status: 'Active' },
    { id: 'CAT-07', name: 'Equipment', type: 'Expense', status: 'Active' },
    { id: 'CAT-08', name: 'Marketing & Promotion', type: 'Expense', status: 'Active' },
    { id: 'CAT-09', name: 'Accommodation', type: 'Expense', status: 'Active' },
    { id: 'CAT-10', name: 'Honorarium', type: 'Expense', status: 'Active' },
    { id: 'CAT-11', name: 'Salary/Wages', type: 'Expense', status: 'Active' },
    { id: 'CAT-12', name: 'Communication', type: 'Expense', status: 'Active' },
    { id: 'CAT-13', name: 'Office Rent', type: 'Expense', status: 'Active' },
    { id: 'CAT-14', name: 'Electricity/Utilities', type: 'Expense', status: 'Active' },
    { id: 'CAT-15', name: 'Internet', type: 'Expense', status: 'Active' },
    { id: 'CAT-16', name: 'Software/Subscription', type: 'Expense', status: 'Active' },
    { id: 'CAT-17', name: 'Training', type: 'Expense', status: 'Active' },
    { id: 'CAT-18', name: 'Travel', type: 'Expense', status: 'Active' },
    { id: 'CAT-19', name: 'Logistics', type: 'Expense', status: 'Active' },
    { id: 'CAT-20', name: 'Purchase', type: 'Expense', status: 'Active' },
    { id: 'CAT-21', name: 'Maintenance', type: 'Expense', status: 'Active' },
    { id: 'CAT-22', name: 'Government/Official Fees', type: 'Expense', status: 'Active' },
    { id: 'CAT-23', name: 'Bank/MFS Charges', type: 'Expense', status: 'Active' },
    { id: 'CAT-24', name: 'Emergency Expense', type: 'Expense', status: 'Active' },
    { id: 'CAT-25', name: 'Miscellaneous', type: 'Expense', status: 'Active' },
    { id: 'CAT-INC-01', name: 'Donation', type: 'Income', status: 'Active' },
    { id: 'CAT-INC-02', name: 'Membership Fee', type: 'Income', status: 'Active' },
    { id: 'CAT-INC-03', name: 'Sponsorship', type: 'Income', status: 'Active' },
    { id: 'CAT-INC-04', name: 'Project Grant', type: 'Income', status: 'Active' },
    { id: 'CAT-INC-05', name: 'Event Contribution', type: 'Income', status: 'Active' }
  ],

  activities: [],
  projects: [],
  budgets: [],
  expenses: [],
  income: [],
  reimbursements: [],
  advances: [],
  advanceSettlements: [],
  transactions: [],
  auditLogs: []
};

window.INITIAL_MOCK_DATA = INITIAL_MOCK_DATA;
