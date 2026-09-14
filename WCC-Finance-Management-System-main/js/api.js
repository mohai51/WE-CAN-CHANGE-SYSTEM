/**
 * WCC Finance Management & Accounting System
 * Google Apps Script API Client & Mock/Live Fallback Engine
 */

class ApiClient {
  constructor() {
    const storedUrl = localStorage.getItem(CONFIG.STORAGE_KEYS.API_URL) || CONFIG.API_URL || '';
    const storedMock = localStorage.getItem(CONFIG.STORAGE_KEYS.USE_MOCK);
    
    if (storedUrl && storedMock !== 'true') {
      this.isLive = true;
      localStorage.setItem(CONFIG.STORAGE_KEYS.USE_MOCK, 'false');
      localStorage.setItem(CONFIG.STORAGE_KEYS.API_URL, storedUrl);
    } else {
      this.isLive = storedMock === 'false' && Boolean(storedUrl);
    }

    this.apiUrl = storedUrl;
    this.activeRequests = new Map();
    this.isSyncing = false;
  }

  setLiveMode(enabled, customUrl = null) {
    this.isLive = enabled && Boolean(customUrl || this.apiUrl);
    localStorage.setItem(CONFIG.STORAGE_KEYS.USE_MOCK, (!this.isLive).toString());
    if (customUrl !== null) {
      this.apiUrl = customUrl;
      localStorage.setItem(CONFIG.STORAGE_KEYS.API_URL, customUrl);
    }
    if (window.store) {
      window.store.isLiveMode = this.isLive;
      window.store.notify('MODE_CHANGED', { isLive: this.isLive });
    }
    if (window.app && window.app.updateHeaderStatus) {
      window.app.updateHeaderStatus();
    }
  }

  /**
   * Universal Request Dispatcher with In-flight Deduplication
   */
  async request(action, payload = {}) {
    // Generate request fingerprint for in-flight deduplication
    const reqKey = `${action}:${JSON.stringify(payload)}`;
    if (this.activeRequests.has(reqKey)) {
      console.warn(`[API] Duplicate request '${action}' debounced. Reusing in-flight promise.`);
      return this.activeRequests.get(reqKey);
    }

    const requestPromise = (async () => {
      if (!this.isLive || !this.apiUrl) {
        return this.handleMockRequest(action, payload);
      }

      try {
          const currentUser = window.store.currentUser;
          const userPayload = currentUser ? {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            role: currentUser.role,
            token: window.auth?.sessionToken || ''
          } : null;

          const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'text/plain;charset=utf-8' // CORS-safe header for Apps Script Web Apps
            },
            body: JSON.stringify({
              action,
              payload,
              user: userPayload
            })
          });

        if (!response.ok) {
          throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Unknown server error from Apps Script');
        }

        // Apply mutation to local reactive state so frontend updates immediately
        const mutatedData = this.applyLocalMutation(action, payload, result.data);
        window.store.saveState();
        window.store.notify(action, mutatedData || result.data);

        return mutatedData || result.data;
      } catch (error) {
        console.warn(`GAS API call '${action}' failed, falling back to local simulation:`, error);
        window.UI.showToast(`Cloud API notice: ${error.message}. Saved to local session.`, 'warning');
        return this.handleMockRequest(action, payload);
      }
    })();

    this.activeRequests.set(reqKey, requestPromise);
    try {
      return await requestPromise;
    } finally {
      // Clear from in-flight cache after short delay
      setTimeout(() => {
        this.activeRequests.delete(reqKey);
      }, 500);
    }
  }

  /**
   * Cloud Data Synchronizer: Pull all sheet tables and populate local store
   */
  async syncFromCloud(silent = false) {
    if (!this.isLive || !this.apiUrl) {
      if (!silent) {
        window.UI.showToast('Currently in Demo Mode. Connect your Google Apps Script URL in Settings to sync with Google Sheets.', 'info');
      }
      return false;
    }

    if (this.isSyncing) return false;
    this.isSyncing = true;

    // Visual loading state on sync buttons
    const syncButtons = document.querySelectorAll('.btn-sync-cloud');
    syncButtons.forEach(btn => {
      btn.classList.add('pulse-sync');
      btn.disabled = true;
    });

    if (!silent) {
      window.UI.showToast('Syncing data from Google Sheets...', 'info');
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({
          action: 'getInitialData',
          payload: {},
          user: window.store.currentUser || { name: 'Admin', role: 'Admin' }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const res = await response.json();
      if (!res.success) {
        throw new Error(res.error || 'Failed to fetch data from Apps Script');
      }

      const cloudData = res.data;
      const storeData = window.store.data;

      // Update store collections with normalized cloud data
      if (Array.isArray(cloudData.transactions)) storeData.transactions = cloudData.transactions;
      if (Array.isArray(cloudData.expenses)) storeData.expenses = cloudData.expenses;
      if (Array.isArray(cloudData.income)) storeData.income = cloudData.income;
      if (Array.isArray(cloudData.activities)) storeData.activities = cloudData.activities;
      if (Array.isArray(cloudData.projects)) storeData.projects = cloudData.projects;
      if (Array.isArray(cloudData.reimbursements)) storeData.reimbursements = cloudData.reimbursements;
      if (Array.isArray(cloudData.advances)) storeData.advances = cloudData.advances;
      if (Array.isArray(cloudData.advanceSettlements)) storeData.advanceSettlements = cloudData.advanceSettlements;
      if (Array.isArray(cloudData.accounts) && cloudData.accounts.length > 0) storeData.accounts = cloudData.accounts;
      if (Array.isArray(cloudData.vendors)) storeData.vendors = cloudData.vendors;
      if (Array.isArray(cloudData.members) && cloudData.members.length > 0) storeData.members = cloudData.members;
      if (Array.isArray(cloudData.categories) && cloudData.categories.length > 0) storeData.categories = cloudData.categories;
      if (Array.isArray(cloudData.auditLogs)) storeData.auditLogs = cloudData.auditLogs;
      if (Array.isArray(cloudData.users) && cloudData.users.length > 0) storeData.users = cloudData.users;

      window.store.saveState();
      window.store.notify('DATA_SYNCED', storeData);

      // Refresh current view
      if (window.UI) {
        window.UI.navigateTo(window.store.activeView || 'dashboard');
      }
      if (window.app && window.app.populateSelectDropdowns) {
        window.app.populateSelectDropdowns();
      }

      if (!silent) {
        window.UI.showToast('Successfully synchronized with Google Sheets!', 'success');
      }
      return true;
    } catch (err) {
      console.error('Cloud synchronization failed:', err);
      if (!silent) {
        window.UI.showToast(`Sync failed: ${err.message}`, 'error');
      }
      return false;
    } finally {
      this.isSyncing = false;
      syncButtons.forEach(btn => {
        btn.classList.remove('pulse-sync');
        btn.disabled = false;
      });
    }
  }

  /**
   * Unified Reactive State Mutator: Updates local memory and persistent storage
   */
  applyLocalMutation(action, payload, serverResult = null) {
    const data = window.store.data;
    const currentUserName = window.store.currentUser ? window.store.currentUser.name : 'System User';

    switch (action) {
      case 'createVendor': {
        const id = (serverResult && serverResult.id) ? serverResult.id : (payload.id || window.store.generateId(CONFIG.ID_PREFIXES.VENDOR));
        const newVendor = {
          id: id,
          name: payload.name,
          serviceType: payload.serviceType || 'General Supplier',
          contactPerson: payload.contactPerson || '',
          phone: payload.phone || '',
          email: payload.email || '',
          address: payload.address || '',
          totalTransactions: Number(payload.totalTransactions || 0),
          totalPaid: Number(payload.totalPaid || 0),
          outstanding: Number(payload.outstanding || 0),
          notes: payload.notes || ''
        };
        if (!data.vendors) data.vendors = [];
        // Replace existing if ID already exists, else unshift
        const vIdx = data.vendors.findIndex(v => v.id === newVendor.id);
        if (vIdx !== -1) {
          data.vendors[vIdx] = newVendor;
        } else {
          data.vendors.unshift(newVendor);
        }
        window.store.logAction('Create Vendor', 'Vendors', newVendor.id, `Added vendor ${newVendor.name} (${newVendor.serviceType})`);
        return newVendor;
      }

      case 'createExpense': {
        const expId = (serverResult && (serverResult.id || serverResult.expenseId)) ? (serverResult.id || serverResult.expenseId) : (payload.id || window.store.generateId(CONFIG.ID_PREFIXES.EXPENSE));
        const isPersonal = !!payload.isMemberPersonalExpense;
        const newExp = {
          id: expId,
          date: payload.date,
          activityId: payload.activityId,
          activityName: payload.activityName,
          category: payload.category,
          description: payload.description,
          amount: Number(payload.amount),
          paymentMethod: payload.paymentMethod,
          accountId: payload.accountId,
          accountName: payload.accountName,
          paidBy: payload.paidBy,
          vendorOrMember: payload.vendorOrMember,
          referenceNumber: payload.referenceNumber || '',
          attachmentUrl: payload.attachmentUrl || '',
          attachmentName: payload.attachmentName || '',
          status: isPersonal ? 'Pending Reimbursement' : 'Paid',
          isMemberPersonalExpense: isPersonal,
          reimbursementId: (serverResult && serverResult.reimbursementId) ? serverResult.reimbursementId : null,
          settledFromAdvanceId: payload.settledFromAdvanceId || '',
          createdBy: currentUserName,
          remarks: payload.remarks || ''
        };

        if (!data.expenses) data.expenses = [];
        const expIdx = data.expenses.findIndex(e => e.id === newExp.id);
        if (expIdx !== -1) {
          data.expenses[expIdx] = newExp;
        } else {
          data.expenses.unshift(newExp);
        }

        // If Personal Expense, create reimbursement entry
        if (isPersonal) {
          const reimId = newExp.reimbursementId || window.store.generateId(CONFIG.ID_PREFIXES.REIMBURSEMENT);
          newExp.reimbursementId = reimId;
          const newReim = {
            id: reimId,
            memberId: payload.memberId || 'WCC-MBR-000001',
            memberName: payload.paidBy,
            expenseId: newExp.id,
            activityId: newExp.activityId,
            activityName: newExp.activityName,
            amount: newExp.amount,
            category: newExp.category,
            description: newExp.description,
            requestDate: newExp.date,
            approvalStatus: 'Submitted',
            paymentDate: null,
            paymentMethod: 'Pending',
            paymentAccountId: null,
            paymentReference: '',
            billUrl: newExp.attachmentUrl,
            notes: 'Auto-created from Personal Expense entry'
          };
          if (!data.reimbursements) data.reimbursements = [];
          data.reimbursements.unshift(newReim);

          if (data.members) {
            const member = data.members.find(m => m.name === payload.paidBy);
            if (member) {
              member.totalPersonalExpenses = (member.totalPersonalExpenses || 0) + newExp.amount;
              member.currentOutstanding = (member.currentOutstanding || 0) + newExp.amount;
            }
          }
        } else if (newExp.accountId && data.accounts) {
          const acc = data.accounts.find(a => a.id === newExp.accountId);
          if (acc) acc.currentBalance -= newExp.amount;
        }

        // Mirror to central transactions ledger
        const txnId = (serverResult && serverResult.transactionId) ? serverResult.transactionId : window.store.generateId(CONFIG.ID_PREFIXES.TRANSACTION);
        if (!data.transactions) data.transactions = [];
        data.transactions.unshift({
          id: txnId,
          date: newExp.date,
          type: 'Expense',
          activityId: newExp.activityId,
          activityName: newExp.activityName,
          category: newExp.category,
          description: newExp.description,
          amount: newExp.amount,
          paymentMethod: newExp.paymentMethod,
          accountId: newExp.accountId,
          accountName: newExp.accountName,
          paidBy: newExp.paidBy,
          receivedFrom: null,
          vendorOrMember: newExp.vendorOrMember,
          referenceNumber: newExp.referenceNumber,
          status: newExp.status,
          createdBy: newExp.createdBy
        });

        window.store.logAction('Create Expense', 'Expenses', newExp.id, `Recorded expense of ৳${newExp.amount} for ${newExp.activityName}`);
        return newExp;
      }

      case 'updateExpense': {
        if (!data.expenses) data.expenses = [];
        const exp = data.expenses.find(e => e.id === payload.expenseId);
        if (!exp) return null;

        const oldAmount = Number(exp.amount || 0);
        const oldAccountId = exp.accountId;
        const oldWasPersonal = !!exp.isMemberPersonalExpense;
        const newAmount = Number(payload.amount);
        const newAccountId = payload.accountId;
        const newIsPersonal = !!payload.isMemberPersonalExpense;

        // Revert old balance impact
        if (!oldWasPersonal && oldAccountId && data.accounts) {
          const oldAcc = data.accounts.find(a => a.id === oldAccountId);
          if (oldAcc) oldAcc.currentBalance += oldAmount;
        } else if (oldWasPersonal && data.members) {
          const member = data.members.find(m => m.name === exp.paidBy);
          if (member) {
            member.totalPersonalExpenses = Math.max(0, (member.totalPersonalExpenses || 0) - oldAmount);
            member.currentOutstanding = Math.max(0, (member.currentOutstanding || 0) - oldAmount);
          }
        }

        // Apply new values
        exp.date = payload.date || exp.date;
        exp.activityId = payload.activityId;
        exp.activityName = payload.activityName;
        exp.category = payload.category;
        exp.description = payload.description;
        exp.amount = newAmount;
        exp.paymentMethod = payload.paymentMethod;
        exp.accountId = newIsPersonal ? null : newAccountId;
        exp.accountName = payload.accountName;
        exp.paidBy = payload.paidBy;
        exp.vendorOrMember = payload.vendorOrMember;
        exp.referenceNumber = payload.referenceNumber || '';
        exp.remarks = payload.remarks || '';
        exp.isMemberPersonalExpense = newIsPersonal;
        if (!newIsPersonal && exp.status === 'Pending Reimbursement') {
          exp.status = 'Paid';
        }

        // Apply new balance impact
        if (!newIsPersonal && newAccountId && data.accounts) {
          const newAcc = data.accounts.find(a => a.id === newAccountId);
          if (newAcc) newAcc.currentBalance -= newAmount;
        } else if (newIsPersonal && data.members) {
          const member = data.members.find(m => m.name === exp.paidBy);
          if (member) {
            member.totalPersonalExpenses = (member.totalPersonalExpenses || 0) + newAmount;
            member.currentOutstanding = (member.currentOutstanding || 0) + newAmount;
          }
        }

        // Sync linked reimbursement if exists
        if (exp.reimbursementId && data.reimbursements) {
          const reim = data.reimbursements.find(r => r.id === exp.reimbursementId);
          if (reim) {
            reim.amount = newAmount;
            reim.category = exp.category;
            reim.description = exp.description;
            reim.activityId = exp.activityId;
            reim.activityName = exp.activityName;
          }
        }

        // Sync matching transaction
        if (data.transactions) {
          const txn = data.transactions.find(t => t.id === exp.id || (t.type === 'Expense' && (t.referenceNumber === exp.referenceNumber || (t.date === exp.date && t.description === exp.description))));
          if (txn) {
            txn.date = exp.date;
            txn.activityId = exp.activityId;
            txn.activityName = exp.activityName;
            txn.category = exp.category;
            txn.description = exp.description;
            txn.amount = exp.amount;
            txn.paymentMethod = exp.paymentMethod;
            txn.accountId = exp.accountId;
            txn.accountName = exp.accountName;
            txn.paidBy = exp.paidBy;
            txn.vendorOrMember = exp.vendorOrMember;
            txn.referenceNumber = exp.referenceNumber;
            txn.status = exp.status;
          }
        }

        window.store.logAction('Update Expense', 'Expenses', exp.id, `Updated expense ${exp.id}: ৳${exp.amount} for ${exp.activityName}`);
        return exp;
      }

      case 'createIncome': {
        const incId = (serverResult && (serverResult.id || serverResult.incomeId)) ? (serverResult.id || serverResult.incomeId) : (payload.id || window.store.generateId(CONFIG.ID_PREFIXES.INCOME));
        const newInc = {
          id: incId,
          date: payload.date,
          incomeType: payload.incomeType,
          sourceOrDonor: payload.sourceOrDonor,
          activityId: payload.activityId || null,
          activityName: payload.activityName || 'General Fund',
          amount: Number(payload.amount),
          paymentMethod: payload.paymentMethod,
          accountId: payload.accountId,
          accountName: payload.accountName,
          referenceNumber: payload.referenceNumber || '',
          supportingDocUrl: payload.supportingDocUrl || '',
          supportingDocName: payload.supportingDocName || '',
          remarks: payload.remarks || '',
          createdBy: currentUserName
        };

        if (!data.income) data.income = [];
        const incIdx = data.income.findIndex(i => i.id === newInc.id);
        if (incIdx !== -1) {
          data.income[incIdx] = newInc;
        } else {
          data.income.unshift(newInc);
        }

        if (newInc.accountId && data.accounts) {
          const acc = data.accounts.find(a => a.id === newInc.accountId);
          if (acc) acc.currentBalance += newInc.amount;
        }

        const txnId = (serverResult && serverResult.transactionId) ? serverResult.transactionId : window.store.generateId(CONFIG.ID_PREFIXES.TRANSACTION);
        if (!data.transactions) data.transactions = [];
        data.transactions.unshift({
          id: txnId,
          date: newInc.date,
          type: 'Income',
          activityId: newInc.activityId,
          activityName: newInc.activityName,
          category: newInc.incomeType,
          description: `Income from ${newInc.sourceOrDonor}`,
          amount: newInc.amount,
          paymentMethod: newInc.paymentMethod,
          accountId: newInc.accountId,
          accountName: newInc.accountName,
          paidBy: null,
          receivedFrom: newInc.sourceOrDonor,
          vendorOrMember: newInc.sourceOrDonor,
          referenceNumber: newInc.referenceNumber,
          status: 'Paid',
          createdBy: newInc.createdBy
        });

        window.store.logAction('Create Income', 'Income', newInc.id, `Received ৳${newInc.amount} from ${newInc.sourceOrDonor}`);
        return newInc;
      }

      case 'updateIncome': {
        if (!data.income) data.income = [];
        const inc = data.income.find(i => i.id === payload.incomeId);
        if (!inc) return null;

        const oldAmount = Number(inc.amount || 0);
        const oldAccountId = inc.accountId;
        const newAmount = Number(payload.amount);
        const newAccountId = payload.accountId;

        // Revert old account balance addition
        if (oldAccountId && data.accounts) {
          const oldAcc = data.accounts.find(a => a.id === oldAccountId);
          if (oldAcc) oldAcc.currentBalance -= oldAmount;
        }

        // Update fields
        inc.date = payload.date || inc.date;
        inc.incomeType = payload.incomeType;
        inc.sourceOrDonor = payload.sourceOrDonor;
        inc.activityId = payload.activityId || null;
        inc.activityName = payload.activityName || 'General Fund';
        inc.amount = newAmount;
        inc.paymentMethod = payload.paymentMethod;
        inc.accountId = newAccountId;
        inc.accountName = payload.accountName;
        inc.referenceNumber = payload.referenceNumber || '';
        inc.remarks = payload.remarks || '';

        // Apply new account balance addition
        if (newAccountId && data.accounts) {
          const newAcc = data.accounts.find(a => a.id === newAccountId);
          if (newAcc) newAcc.currentBalance += newAmount;
        }

        // Sync corresponding transaction
        if (data.transactions) {
          const txn = data.transactions.find(t => t.id === inc.id || (t.type === 'Income' && (t.receivedFrom === inc.sourceOrDonor || t.referenceNumber === inc.referenceNumber)));
          if (txn) {
            txn.date = inc.date;
            txn.activityId = inc.activityId;
            txn.activityName = inc.activityName;
            txn.category = inc.incomeType;
            txn.description = `Income from ${inc.sourceOrDonor}`;
            txn.amount = inc.amount;
            txn.paymentMethod = inc.paymentMethod;
            txn.accountId = inc.accountId;
            txn.accountName = inc.accountName;
            txn.receivedFrom = inc.sourceOrDonor;
            txn.vendorOrMember = inc.sourceOrDonor;
            txn.referenceNumber = inc.referenceNumber;
          }
        }

        window.store.logAction('Update Income', 'Income', inc.id, `Updated income ${inc.id}: ৳${inc.amount} from ${inc.sourceOrDonor}`);
        return inc;
      }

      case 'createActivity': {
        const actId = (serverResult && (serverResult.id || serverResult.activityId)) ? (serverResult.id || serverResult.activityId) : (payload.id || window.store.generateId(CONFIG.ID_PREFIXES.ACTIVITY));
        const newAct = {
          id: actId,
          name: payload.name,
          type: payload.type,
          startDate: payload.startDate,
          endDate: payload.endDate,
          location: payload.location,
          description: payload.description,
          budget: Number(payload.budget || 0),
          actualExpense: 0,
          responsiblePerson: payload.responsiblePerson,
          status: 'Active',
          createdDate: new Date().toISOString().substring(0, 10),
          notes: payload.notes || ''
        };
        if (!data.activities) data.activities = [];
        const actIdx = data.activities.findIndex(a => a.id === newAct.id);
        if (actIdx !== -1) {
          data.activities[actIdx] = newAct;
        } else {
          data.activities.unshift(newAct);
        }
        window.store.logAction('Create Activity', 'Activities', newAct.id, `Created activity "${newAct.name}" with budget ৳${newAct.budget}`);
        return newAct;
      }

      case 'closeActivity': {
        if (!data.activities) data.activities = [];
        const act = data.activities.find(a => a.id === payload.activityId);
        if (act) {
          act.status = 'Completed';
          window.store.logAction('Close Activity', 'Activities', act.id, `Marked activity "${act.name}" as Completed`);
        }
        return act;
      }

      case 'updateActivity': {
        if (!data.activities) data.activities = [];
        const act = data.activities.find(a => a.id === payload.activityId);
        if (!act) return null;

        act.name = payload.name;
        act.type = payload.type;
        act.startDate = payload.startDate;
        act.endDate = payload.endDate;
        act.location = payload.location;
        act.description = payload.description;
        act.budget = Number(payload.budget || 0);
        act.responsiblePerson = payload.responsiblePerson;
        act.notes = payload.notes || '';

        window.store.logAction('Update Activity', 'Activities', act.id, `Updated activity "${act.name}" (Budget: ৳${act.budget})`);
        return act;
      }

      case 'createAdvance': {
        const advId = (serverResult && (serverResult.id || serverResult.advanceId)) ? (serverResult.id || serverResult.advanceId) : (payload.id || window.store.generateId(CONFIG.ID_PREFIXES.ADVANCE));
        const newAdv = {
          id: advId,
          memberId: payload.memberId,
          memberName: payload.memberName,
          activityId: payload.activityId,
          activityName: payload.activityName,
          purpose: payload.purpose,
          advanceAmount: Number(payload.advanceAmount),
          disbursementDate: payload.disbursementDate,
          paymentMethod: payload.paymentMethod,
          accountId: payload.accountId,
          accountName: payload.accountName,
          paymentReference: payload.paymentReference || '',
          status: 'Issued',
          actualExpenseSubmitted: 0,
          settlementBalance: 0,
          approvedBy: currentUserName,
          notes: payload.notes || ''
        };

        if (newAdv.accountId && data.accounts) {
          const acc = data.accounts.find(a => a.id === newAdv.accountId);
          if (acc) acc.currentBalance -= newAdv.advanceAmount;
        }

        if (!data.advances) data.advances = [];
        const advIdx = data.advances.findIndex(a => a.id === newAdv.id);
        if (advIdx !== -1) {
          data.advances[advIdx] = newAdv;
        } else {
          data.advances.unshift(newAdv);
        }
        window.store.logAction('Issue Advance', 'Advances', newAdv.id, `Issued ৳${newAdv.advanceAmount} advance to ${newAdv.memberName}`);
        return newAdv;
      }

      case 'settleAdvance': {
        if (!data.advances) data.advances = [];
        const adv = data.advances.find(a => a.id === payload.advanceId);
        if (!adv) return null;

        const actualSpent = Number(payload.actualExpense);
        const variance = adv.advanceAmount - actualSpent;
        const setId = (serverResult && (serverResult.id || serverResult.settlementId)) ? (serverResult.id || serverResult.settlementId) : window.store.generateId(CONFIG.ID_PREFIXES.SETTLEMENT);

        const newSettlement = {
          id: setId,
          advanceId: adv.id,
          memberId: adv.memberId,
          memberName: adv.memberName,
          activityId: adv.activityId,
          activityName: adv.activityName,
          advanceAmount: adv.advanceAmount,
          actualExpense: actualSpent,
          variance: Math.abs(variance),
          settlementAction: variance >= 0 ? `Refund Received (৳${variance})` : `Additional Reimbursement (৳${Math.abs(variance)})`,
          refundAccountId: payload.refundAccountId,
          refundAccountName: payload.refundAccountName,
          settlementDate: payload.settlementDate || new Date().toISOString().substring(0, 10),
          supportingExpensesList: payload.expenseIdList || '',
          status: 'Closed',
          settledBy: currentUserName,
          notes: payload.notes || ''
        };

        adv.status = 'Settled';
        adv.actualExpenseSubmitted = actualSpent;
        adv.settlementBalance = Math.abs(variance);
        adv.settlementType = variance >= 0 ? 'Refund Received' : 'Additional Reimbursement';
        adv.settlementId = newSettlement.id;

        if (variance > 0 && payload.refundAccountId && data.accounts) {
          const acc = data.accounts.find(a => a.id === payload.refundAccountId);
          if (acc) acc.currentBalance += variance;
        }

        if (!data.advanceSettlements) data.advanceSettlements = [];
        data.advanceSettlements.unshift(newSettlement);
        window.store.logAction('Settle Advance', 'Advances', adv.id, `Settled advance for ${adv.memberName}: Spent ৳${actualSpent}, ${newSettlement.settlementAction}`);
        return newSettlement;
      }

      case 'updateAdvance': {
        if (!data.advances) data.advances = [];
        const adv = data.advances.find(a => a.id === payload.advanceId);
        if (!adv) return null;

        const oldAmount = Number(adv.advanceAmount || 0);
        const oldAccountId = adv.accountId;
        const newAmount = Number(payload.advanceAmount);
        const newAccountId = payload.accountId;

        // If not settled, adjust account balance impact
        if (adv.status !== 'Settled') {
          if (oldAccountId && data.accounts) {
            const oldAcc = data.accounts.find(a => a.id === oldAccountId);
            if (oldAcc) oldAcc.currentBalance += oldAmount;
          }
          if (newAccountId && data.accounts) {
            const newAcc = data.accounts.find(a => a.id === newAccountId);
            if (newAcc) newAcc.currentBalance -= newAmount;
          }
        }

        adv.memberId = payload.memberId;
        adv.memberName = payload.memberName;
        adv.activityId = payload.activityId;
        adv.activityName = payload.activityName;
        adv.purpose = payload.purpose;
        adv.advanceAmount = newAmount;
        adv.disbursementDate = payload.disbursementDate;
        adv.paymentMethod = payload.paymentMethod;
        adv.accountId = newAccountId;
        adv.accountName = payload.accountName;
        adv.paymentReference = payload.paymentReference || '';
        adv.notes = payload.notes || '';

        window.store.logAction('Update Advance', 'Advances', adv.id, `Updated advance ${adv.id} for ${adv.memberName}: ৳${adv.advanceAmount}`);
        return adv;
      }

      case 'disburseReimbursement': {
        if (!data.reimbursements) data.reimbursements = [];
        const reim = data.reimbursements.find(r => r.id === payload.reimbursementId);
        if (!reim) return null;

        reim.approvalStatus = 'Paid';
        reim.paymentDate = payload.paymentDate || new Date().toISOString().substring(0, 10);
        reim.paymentMethod = payload.paymentMethod;
        reim.paymentAccountId = payload.paymentAccountId;
        reim.paymentReference = payload.paymentReference || '';

        if (data.expenses) {
          const exp = data.expenses.find(e => e.id === reim.expenseId);
          if (exp) {
            exp.status = 'Paid';
            exp.paymentMethod = reim.paymentMethod;
            exp.accountId = reim.paymentAccountId;
          }
        }

        if (payload.paymentAccountId && data.accounts) {
          const acc = data.accounts.find(a => a.id === payload.paymentAccountId);
          if (acc) acc.currentBalance -= reim.amount;
        }

        if (data.members) {
          const member = data.members.find(m => m.id === reim.memberId || m.name === reim.memberName);
          if (member) {
            member.totalReimbursed = (member.totalReimbursed || 0) + reim.amount;
            member.currentOutstanding = Math.max(0, (member.currentOutstanding || 0) - reim.amount);
          }
        }

        window.store.logAction('Disburse Reimbursement', 'Reimbursements', reim.id, `Paid ৳${reim.amount} reimbursement to ${reim.memberName}`);
        return reim;
      }

      case 'updateReimbursement': {
        if (!data.reimbursements) data.reimbursements = [];
        const reim = data.reimbursements.find(r => r.id === payload.reimbursementId);
        if (!reim) return null;

        const oldAmount = Number(reim.amount || 0);
        const newAmount = Number(payload.amount);

        reim.amount = newAmount;
        reim.category = payload.category;
        reim.description = payload.description;
        reim.notes = payload.notes || '';

        // Sync linked expense if present
        if (reim.expenseId && data.expenses) {
          const exp = data.expenses.find(e => e.id === reim.expenseId);
          if (exp) {
            exp.amount = newAmount;
            exp.category = reim.category;
            exp.description = reim.description;
          }
        }

        // Adjust member outstanding if not yet paid
        if (data.members && reim.approvalStatus !== 'Paid') {
          const member = data.members.find(m => m.id === reim.memberId || m.name === reim.memberName);
          if (member) {
            member.currentOutstanding = Math.max(0, (member.currentOutstanding || 0) - oldAmount + newAmount);
          }
        }

        window.store.logAction('Update Reimbursement', 'Reimbursements', reim.id, `Updated claim ${reim.id}: ৳${reim.amount}`);
        return reim;
      }

      case 'createAccount': {
        const openBal = Number(payload.openingBalance || 0);
        const accId = (serverResult && serverResult.id) ? serverResult.id : (payload.id || window.store.generateId(CONFIG.ID_PREFIXES.ACCOUNT));
        const newAcc = {
          id: accId,
          name: payload.name.trim(),
          accountType: payload.accountType,
          accountNumber: payload.accountNumber ? payload.accountNumber.trim() : '',
          bankName: payload.bankName ? payload.bankName.trim() : '',
          branchName: payload.branchName ? payload.branchName.trim() : '',
          routingNumber: payload.routingNumber ? payload.routingNumber.trim() : '',
          openingBalance: openBal,
          currentBalance: openBal,
          status: payload.status || 'Active',
          notes: payload.notes ? payload.notes.trim() : '',
          createdDate: new Date().toISOString().substring(0, 10),
          createdBy: currentUserName
        };
        if (!data.accounts) data.accounts = [];
        const aIdx = data.accounts.findIndex(a => a.id === newAcc.id);
        if (aIdx !== -1) {
          data.accounts[aIdx] = newAcc;
        } else {
          data.accounts.push(newAcc);
        }
        window.store.logAction('Create Account', 'Accounts', newAcc.id, `Created account ${newAcc.name} (${newAcc.accountType}) with opening balance ৳${openBal}`);
        return newAcc;
      }

      case 'updateAccount': {
        if (!data.accounts) data.accounts = [];
        const acc = data.accounts.find(a => a.id === payload.accountId);
        if (acc) {
          if (payload.name) acc.name = payload.name.trim();
          if (payload.accountType) acc.accountType = payload.accountType;
          if (payload.accountNumber !== undefined) acc.accountNumber = payload.accountNumber.trim();
          if (payload.bankName !== undefined) acc.bankName = payload.bankName.trim();
          if (payload.branchName !== undefined) acc.branchName = payload.branchName.trim();
          if (payload.routingNumber !== undefined) acc.routingNumber = payload.routingNumber.trim();
          if (payload.status) acc.status = payload.status;
          if (payload.notes !== undefined) acc.notes = payload.notes.trim();
          window.store.logAction('Update Account', 'Accounts', acc.id, `Updated details for account ${acc.name} (${acc.accountType})`);
        }
        return acc;
      }

      case 'createUser': {
        const userId = (serverResult && serverResult.id) ? serverResult.id : (payload.id || `USR-${Math.floor(100 + Math.random() * 900)}`);
        const newUser = {
          id: userId,
          name: payload.name,
          email: payload.email,
          role: payload.role,
          phone: payload.phone || '',
          password: payload.password || 'wcc123',
          status: 'Active',
          avatar: payload.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'US',
          createdDate: new Date().toISOString().substring(0, 10)
        };
        if (!data.users) data.users = [];
        const uIdx = data.users.findIndex(u => u.id === newUser.id);
        if (uIdx !== -1) {
          data.users[uIdx] = newUser;
        } else {
          data.users.push(newUser);
        }
        window.store.logAction('Create User', 'Users', newUser.id, `Created user account for ${newUser.name} with role ${newUser.role}`);
        return newUser;
      }

      case 'updateUser': {
        if (!data.users) data.users = [];
        const user = data.users.find(u => u.id === payload.userId);
        if (user) {
          user.name = payload.name;
          user.email = payload.email;
          user.role = payload.role;
          user.phone = payload.phone;
          user.status = payload.status;
          if (payload.newPassword) user.password = payload.newPassword;
          user.avatar = payload.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
          window.store.logAction('Update User', 'Users', user.id, `Admin updated user details for ${user.name} (${user.role})`);
        }
        return user;
      }

      default:
        return serverResult || payload;
    }
  }

  /**
   * Local Simulation Handler (Instant offline fallback)
   */
  handleMockRequest(action, payload) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let result = null;
        if (action === 'getInitialData') {
          result = window.store.data;
        } else {
          result = this.applyLocalMutation(action, payload, null);
        }
        window.store.saveState();
        window.store.notify(action, result);
        resolve(result);
      }, 100);
    });
  }

  /**
   * Upload Document to Google Drive (Base64 file transport)
   */
  async uploadFile(fileObject, metadata = {}) {
    if (!this.isLive || !this.apiUrl) {
      const demoUrl = `https://drive.google.com/file/d/demo_${Date.now()}/view`;
      return {
        fileId: `DRIVE-FILE-${Date.now()}`,
        fileName: fileObject.name,
        driveUrl: demoUrl,
        size: fileObject.size
      };
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target.result.split(',')[1];
        try {
          const res = await this.request('uploadDriveFile', {
            fileName: fileObject.name,
            mimeType: fileObject.type,
            base64Content: base64Data,
            transactionId: metadata.transactionId || '',
            activityId: metadata.activityId || ''
          });
          resolve(res);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(fileObject);
    });
  }

  async createAccount(accountData) {
    return this.request('createAccount', accountData);
  }

  async updateAccount(accountId, accountData) {
    return this.request('updateAccount', { accountId, ...accountData });
  }
}

window.api = new ApiClient();
