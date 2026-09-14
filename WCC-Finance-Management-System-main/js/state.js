/**
 * WCC Finance Management & Accounting System
 * Central Reactive State Store
 */

class StateStore {
  constructor() {
    this.listeners = [];
    this.loadState();
  }

  loadState() {
    const DATA_VERSION = 'WCC_CLEAN_V2';
    const currentVersion = localStorage.getItem('WCC_DATA_VERSION');

    if (currentVersion !== DATA_VERSION) {
      localStorage.removeItem(CONFIG.STORAGE_KEYS.CACHED_DATA);
      localStorage.setItem('WCC_DATA_VERSION', DATA_VERSION);
    }

    const cached = localStorage.getItem(CONFIG.STORAGE_KEYS.CACHED_DATA);
    if (cached) {
      try {
        this.data = JSON.parse(cached);
      } catch (e) {
        this.data = JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
      }
    } else {
      this.data = JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
      this.saveState();
    }

    // Ensure all required collections exist
    const requiredKeys = ['transactions', 'expenses', 'income', 'activities', 'projects', 'reimbursements', 'advances', 'advanceSettlements', 'accounts', 'vendors', 'members', 'categories', 'auditLogs', 'users'];
    requiredKeys.forEach(k => {
      if (!Array.isArray(this.data[k])) {
        this.data[k] = INITIAL_MOCK_DATA[k] ? JSON.parse(JSON.stringify(INITIAL_MOCK_DATA[k])) : [];
      }
    });

    // Active session
    const savedUser = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_USER);
    this.currentUser = savedUser ? JSON.parse(savedUser) : this.data.users[0];


    // Current View & Filter State
    this.activeView = 'dashboard';
    this.activeActivityId = null;
    this.dateRangeFilter = 'thisYear';
    this.searchQuery = '';
    const storedUrl = localStorage.getItem(CONFIG.STORAGE_KEYS.API_URL) || CONFIG.API_URL || '';
    const storedMock = localStorage.getItem(CONFIG.STORAGE_KEYS.USE_MOCK);
    this.isLiveMode = Boolean(storedUrl) && (storedMock !== 'true');
  }

  saveState() {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.CACHED_DATA, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to persist state:', e);
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify(event, payload) {
    this.saveState();
    this.listeners.forEach(fn => {
      try {
        fn(event, payload, this.data);
      } catch (err) {
        console.error('State listener error:', err);
      }
    });
  }

  resetToDemo() {
    this.data = JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
    this.saveState();
    this.notify('DATA_RESET', null);
  }

  // --- Financial Aggregators & Accounting Computations ---

  getFinancialKPIs() {
    // Total Inflows
    const totalIncome = this.data.income.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    // Total Paid Outflows (Directly paid by WCC or already reimbursed)
    const totalPaidExpenses = this.data.expenses
      .filter(exp => exp.status === 'Paid')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    // Outstanding Reimbursement Claims (Personal expenses incurred by members that WCC has not yet reimbursed)
    const pendingReimbursements = this.data.reimbursements
      .filter(r => r.approvalStatus === 'Approved' || r.approvalStatus === 'Submitted')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    // Total Incurred Expenses (Regardless of whether cash is paid yet or pending reimbursement)
    const totalIncurredExpenses = this.data.expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    // Current Total Cash & Bank Liquidity (Sum of all active account current balances)
    const currentBalance = this.data.accounts.reduce((sum, acc) => sum + Number(acc.currentBalance || 0), 0);

    // Active Projects Count
    const activeProjectsCount = this.data.projects.filter(p => p.status === 'Active').length;

    // Pending Approvals Count
    const pendingApprovalsCount = this.data.reimbursements.filter(r => r.approvalStatus === 'Submitted').length;

    return {
      totalIncome,
      totalPaidExpenses,
      totalIncurredExpenses,
      currentBalance,
      pendingReimbursements,
      activeProjectsCount,
      pendingApprovalsCount
    };
  }

  getActivityFinancialSummary(activityId) {
    const activity = this.data.activities.find(a => a.id === activityId) || 
                     this.data.projects.find(p => p.id === activityId);
    
    if (!activity) return null;

    const expenses = this.data.expenses.filter(e => e.activityId === activityId);
    const income = this.data.income.filter(i => i.activityId === activityId);
    const reimbursements = this.data.reimbursements.filter(r => r.activityId === activityId);
    const advances = this.data.advances.filter(a => a.activityId === activityId);
    const categoryBudgets = this.data.budgets.filter(b => b.activityId === activityId);

    const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const totalIncome = income.reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const budget = Number(activity.budget || 0);
    const remaining = budget - totalExpense;
    const utilization = budget > 0 ? ((totalExpense / budget) * 100).toFixed(1) : 0;

    // Grouping by Category
    const categoryBreakdown = {};
    expenses.forEach(e => {
      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + Number(e.amount || 0);
    });

    // Grouping by Payment Method
    const paymentMethodBreakdown = {};
    expenses.forEach(e => {
      const method = e.paymentMethod || 'Other';
      paymentMethodBreakdown[method] = (paymentMethodBreakdown[method] || 0) + Number(e.amount || 0);
    });

    // Pending checks for Activity Closing
    const pendingReims = reimbursements.filter(r => r.approvalStatus !== 'Paid' && r.approvalStatus !== 'Rejected');
    const unsettledAdvances = advances.filter(a => a.status !== 'Settled' && a.status !== 'Closed');

    return {
      activity,
      budget,
      totalExpense,
      totalIncome,
      remaining,
      utilization,
      transactionsCount: expenses.length + income.length,
      categoryBreakdown,
      paymentMethodBreakdown,
      expenses,
      income,
      reimbursements,
      advances,
      categoryBudgets,
      pendingReimbursementsCount: pendingReims.length,
      unsettledAdvancesCount: unsettledAdvances.length,
      canClose: pendingReims.length === 0 && unsettledAdvances.length === 0
    };
  }

  // --- Unique Auto-ID Generation ---
  generateId(prefix) {
    const year = new Date().getFullYear();
    const randomSeq = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}-${year}-${randomSeq}`;
  }

  // --- Audit Logger ---
  logAction(action, module, recordId, details) {
    const newLog = {
      id: `WCC-LOG-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: this.currentUser ? this.currentUser.name : 'System User',
      role: this.currentUser ? this.currentUser.role : 'Admin',
      action,
      module,
      recordId,
      details
    };
    this.data.auditLogs.unshift(newLog);
    this.saveState();
  }
}

window.store = new StateStore();
