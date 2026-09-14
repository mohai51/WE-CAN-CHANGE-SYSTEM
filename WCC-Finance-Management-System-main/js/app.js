/**
 * WCC Finance Management & Accounting System
 * Main Application Orchestrator & Dashboard Controller
 */

class DashboardModule {
  render() {
    const kpis = window.store.getFinancialKPIs();

    // Update KPI Cards
    const incEl = document.getElementById('kpi-total-income');
    const expEl = document.getElementById('kpi-total-expense');
    const balEl = document.getElementById('kpi-current-balance');
    const reimEl = document.getElementById('kpi-pending-reimbursements');

    if (incEl) incEl.textContent = window.UI.formatMoney(kpis.totalIncome);
    if (expEl) expEl.textContent = window.UI.formatMoney(kpis.totalPaidExpenses);
    if (balEl) balEl.textContent = window.UI.formatMoney(kpis.currentBalance);
    if (reimEl) reimEl.textContent = window.UI.formatMoney(kpis.pendingReimbursements);

    // Render Charts
    window.chartEngine?.renderIncomeExpenseChart('chart-income-expense');
    window.chartEngine?.renderCategoryExpenseChart('chart-category-expense');
    window.chartEngine?.renderActivityTypeChart('chart-activity-type');

    // Render Recent Transactions
    const recentTable = document.getElementById('dashboard-recent-txns');
    if (recentTable) {
      const recent = window.store.data.transactions.slice(0, 5);
      if (recent.length === 0) {
        recentTable.innerHTML = `
          <tr>
            <td colspan="6" class="text-center py-4 text-muted" style="text-align:center; padding: 24px; color: var(--text-tertiary);">
              No transactions recorded yet. Use <strong>+ Quick Add</strong> or <strong>+ Record Expense</strong> to begin.
            </td>
          </tr>
        `;
      } else {
        recentTable.innerHTML = recent.map(t => `
          <tr>
            <td><span class="code-pill">${window.escapeHTML(t.id)}</span></td>
            <td>${window.UI.formatDate(t.date)}</td>
            <td><strong>${window.escapeHTML(t.activityName || 'General')}</strong></td>
            <td>${window.escapeHTML(t.category)}</td>
            <td style="font-weight:700; color:${t.type === 'Income' ? 'var(--success)' : 'var(--primary)'};">
              ${t.type === 'Income' ? '+' : '-'}${window.UI.formatMoney(t.amount)}
            </td>
            <td>${window.UI.getStatusBadge(t.status)}</td>
          </tr>
        `).join('');
      }
    }
  }
}

class AppInitializer {
  constructor() {
    window.dashboardModule = new DashboardModule();
  }

  init() {
    window.auth.checkAuthGate();
    this.setDefaultDates();
    this.populateSelectDropdowns();
    this.bindEvents();
    this.updateHeaderStatus();
    window.auth.updateUIPermissions();

    // Start on dashboard view if authenticated
    if (window.auth.isAuthenticated()) {
      window.UI.navigateTo('dashboard');
    }

    // Auto-sync latest cloud data if in Live Mode
    if (window.store.isLiveMode && window.api.apiUrl) {
      window.api.syncFromCloud(true);
    }

    // Subscribe to state updates
    window.store.subscribe((event) => {
      this.populateSelectDropdowns();
      this.updateHeaderStatus();
      if (window.store.activeView === 'dashboard') {
        window.dashboardModule.render();
      }
    });

    console.log('WCC Finance Management System initialized successfully.');
  }

  async handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const email = form.email.value;
    const password = form.password.value;
    const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('.btn-primary');

    if (window.UI.setButtonLoading(submitBtn, true, 'Signing in...') === false) {
      return;
    }

    try {
      await window.auth.login(email, password);
      form.reset();
    } catch (err) {
      window.UI.showToast(err.message, 'error');
    } finally {
      window.UI.setButtonLoading(submitBtn, false);
    }
  }

  setDefaultDates() {
    const today = new Date().toISOString().substring(0, 10);
    document.querySelectorAll('input[type="date"]').forEach(input => {
      if (!input.value || input.value === '2026-02-16' || input.value === '2026-03-01' || input.value === '2026-03-02') {
        input.value = today;
      }
    });
  }

  updateHeaderStatus() {
    const pill = document.getElementById('env-mode-pill') || document.getElementById('connection-status-pill');
    if (pill) {
      const isLive = Boolean(window.store?.isLiveMode && window.api?.apiUrl);
      if (isLive) {
        pill.className = 'env-pill live';
        pill.innerHTML = '<span class="pulse-dot"></span> LIVE GAS API';
        pill.title = `Connected to: ${window.api.apiUrl}`;
      } else {
        pill.className = 'env-pill mock';
        pill.innerHTML = '<span class="pulse-dot"></span> DEMO MODE';
        pill.title = 'Click to configure Google Apps Script endpoint in Settings';
      }
    }
  }

  /**
   * Populate all select options across all modals dynamically from state store
   */
  populateSelectDropdowns() {
    const activities = window.store.data.activities || [];
    const projects = window.store.data.projects || [];
    const accounts = window.store.data.accounts || [];
    const categories = window.store.data.categories || [];
    const members = window.store.data.members || [];
    const vendors = window.store.data.vendors || [];

    const allActivities = [...activities, ...projects];

    // 1. Populate Activity Selects
    document.querySelectorAll('.select-activity-list').forEach(sel => {
      const currentVal = sel.value;
      const isRequired = sel.hasAttribute('required');
      let optionsHtml = isRequired
        ? '<option value="">-- Select Activity / Health Camp / Project * --</option>'
        : '<option value="">-- General Fund / No Specific Activity --</option>';

      if (allActivities.length === 0) {
        optionsHtml += '<option value="" disabled>(No activities created yet - Please create one first)</option>';
      } else {
        optionsHtml += allActivities.map(a => {
          const typeTag = a.type ? ` (${window.escapeHTML(a.type)})` : '';
          const statusTag = a.status === 'Completed' ? ' [COMPLETED]' : '';
          return `<option value="${window.escapeHTML(a.id)}">${window.escapeHTML(a.name)}${typeTag}${statusTag}</option>`;
        }).join('');
      }

      sel.innerHTML = optionsHtml;
      if (currentVal && Array.from(sel.options).some(o => o.value === currentVal)) {
        sel.value = currentVal;
      }
    });

    // 2. Populate Expense Category Selects
    document.querySelectorAll('.select-expense-category-list').forEach(sel => {
      const currentVal = sel.value;
      const expenseCats = categories.filter(c => c.type === 'Expense');
      sel.innerHTML = '<option value="">-- Select Expense Category * --</option>' +
        expenseCats.map(c => `<option value="${window.escapeHTML(c.name)}">${window.escapeHTML(c.name)}</option>`).join('');
      if (currentVal && Array.from(sel.options).some(o => o.value === currentVal)) {
        sel.value = currentVal;
      }
    });

    // 3. Populate Income Category Selects
    document.querySelectorAll('.select-income-category-list').forEach(sel => {
      const currentVal = sel.value;
      const incomeCats = categories.filter(c => c.type === 'Income');
      sel.innerHTML = '<option value="">-- Select Inflow / Grant Category * --</option>' +
        incomeCats.map(c => `<option value="${window.escapeHTML(c.name)}">${window.escapeHTML(c.name)}</option>`).join('');
      if (currentVal && Array.from(sel.options).some(o => o.value === currentVal)) {
        sel.value = currentVal;
      }
    });

    // 4. Populate Accounts Selects
    document.querySelectorAll('.select-account-list').forEach(sel => {
      const currentVal = sel.value;
      let optionsHtml = '<option value="">-- Select Account / Vault / Wallet * --</option>';
      if (accounts.length === 0) {
        optionsHtml += '<option value="" disabled>(No accounts registered - Please add an account first)</option>';
      } else {
        optionsHtml += accounts.map(a => {
          const typeTag = a.accountType ? `[${window.escapeHTML(a.accountType)}] ` : '';
          const bankTag = a.bankName ? ` - ${window.escapeHTML(a.bankName)}` : '';
          const statusTag = a.status === 'Inactive' ? ' [INACTIVE]' : '';
          return `<option value="${window.escapeHTML(a.id)}" ${a.status === 'Inactive' ? 'disabled' : ''}>${typeTag}${window.escapeHTML(a.name)}${bankTag} (Balance: ${window.UI.formatMoney(a.currentBalance)})${statusTag}</option>`;
        }).join('');
      }
      sel.innerHTML = optionsHtml;
      if (currentVal && Array.from(sel.options).some(o => o.value === currentVal)) {
        sel.value = currentVal;
      }
    });

    // 5. Populate Members Selects
    document.querySelectorAll('.select-member-list').forEach(sel => {
      const currentVal = sel.value;
      let optionsHtml = '<option value="">-- Select Member / Official * --</option>';
      if (members.length === 0) {
        optionsHtml += '<option value="" disabled>(No members registered)</option>';
      } else {
        optionsHtml += members.map(m => `<option value="${window.escapeHTML(m.id)}" data-name="${window.escapeHTML(m.name)}">${window.escapeHTML(m.name)} (${window.escapeHTML(m.designation || 'Member')})</option>`).join('');
      }
      sel.innerHTML = optionsHtml;
      if (currentVal && Array.from(sel.options).some(o => o.value === currentVal)) {
        sel.value = currentVal;
      }
    });

    // 6. Populate Vendors Datalist for autocomplete in Expense modal
    let datalist = document.getElementById('datalist-vendors');
    if (!datalist) {
      datalist = document.createElement('datalist');
      datalist.id = 'datalist-vendors';
      document.body.appendChild(datalist);
    }
    datalist.innerHTML = vendors.map(v => `<option value="${window.escapeHTML(v.name)}">${window.escapeHTML(v.serviceType || 'Supplier')}</option>`).join('');

    // 7. Populate Members Datalist for autocomplete (also supports manual typing)
    let memberDatalist = document.getElementById('datalist-members');
    if (!memberDatalist) {
      memberDatalist = document.createElement('datalist');
      memberDatalist.id = 'datalist-members';
      document.body.appendChild(memberDatalist);
    }
    memberDatalist.innerHTML = members.map(m => `<option value="${window.escapeHTML(m.name)}">${window.escapeHTML(m.designation ? m.designation + ' - ' : '')}${window.escapeHTML(m.id)}</option>`).join('');
  }

  bindEvents() {
    const sidebar = document.getElementById('sidebar');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');
    const mobileToggle = document.getElementById('mobile-toggle-btn');

    const toggleSidebar = (forceClose = false) => {
      if (!sidebar) return;
      if (forceClose) {
        sidebar.classList.remove('mobile-open');
        sidebarBackdrop?.classList.remove('active');
        document.body.style.overflow = '';
      } else {
        const isOpen = sidebar.classList.toggle('mobile-open');
        if (isOpen) {
          sidebarBackdrop?.classList.add('active');
        } else {
          sidebarBackdrop?.classList.remove('active');
        }
      }
    };

    // Navigation items
    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.getAttribute('data-view');
        window.UI.navigateTo(view);

        // Auto close mobile sidebar
        toggleSidebar(true);
      });
    });

    // Mobile sidebar toggle & backdrop click
    mobileToggle?.addEventListener('click', () => toggleSidebar());
    sidebarBackdrop?.addEventListener('click', () => toggleSidebar(true));

    // Personal Expense toggle in Add Expense Modal
    const personalCheck = document.getElementById('chk-is-personal-expense');
    const memberPaidGroup = document.getElementById('group-paid-by-member');
    const accountGroup = document.getElementById('group-expense-account');

    if (personalCheck && memberPaidGroup && accountGroup) {
      personalCheck.addEventListener('change', () => {
        if (personalCheck.checked) {
          memberPaidGroup.style.display = 'block';
          accountGroup.style.display = 'none';
        } else {
          memberPaidGroup.style.display = 'none';
          accountGroup.style.display = 'block';
        }
      });
    }

    // Modal and Drawer backdrop click dismissal
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          window.UI.closeModal(backdrop.id);
        }
      });
    });

    document.querySelectorAll('.drawer-backdrop').forEach(drawer => {
      drawer.addEventListener('click', (e) => {
        if (e.target === drawer) {
          window.UI.closeDrawer(drawer.id);
        }
      });
    });

    // Global Search Keybinding ('/' key)
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        document.getElementById('global-search-input')?.focus();
      } else if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.active').forEach(m => window.UI.closeModal(m.id));
        document.querySelectorAll('.drawer-backdrop.active').forEach(d => window.UI.closeDrawer(d.id));
      }
    });

    // Global Search Input
    document.getElementById('global-search-input')?.addEventListener('input', (e) => {
      const q = e.target.value;
      if (window.store.activeView === 'transactions') {
        window.transactionsModule.search(q);
      } else if (window.store.activeView === 'expenses') {
        window.expensesModule.searchQuery = q;
        window.expensesModule.render();
      } else if (window.store.activeView === 'income') {
        window.incomeModule.searchQuery = q;
        window.incomeModule.render();
      } else if (window.store.activeView === 'activities') {
        window.activitiesModule.searchQuery = q;
        window.activitiesModule.render();
      }
    });
  }
}

window.app = new AppInitializer();
document.addEventListener('DOMContentLoaded', () => window.app.init());
