/**
 * WCC Finance Management & Accounting System
 * UI Core, View Router, Modals, Drawers & Notification System
 */

class UIEngine {
  constructor() {
    this.toastContainer = null;
    this.initToastContainer();
    this.initTheme();
  }

  initToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    this.toastContainer = container;
  }

  escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  showToast(message, type = 'info', duration = 3500) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✓';
    if (type === 'error') icon = '⚠️';
    if (type === 'warning') icon = '⚡';

    const safeMessage = this.escapeHTML(message);

    toast.innerHTML = `
      <div style="font-weight:700; font-size:16px;">${icon}</div>
      <div class="toast-message">${safeMessage}</div>
      <button class="close-btn" onclick="this.parentElement.remove()" style="margin-left:auto;">&times;</button>
    `;

    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // --- Button & Form Loading State Helper ---
  setButtonLoading(btnOrForm, isLoading, loadingText = 'Saving...') {
    let btn = btnOrForm;
    if (btnOrForm && btnOrForm.tagName === 'FORM') {
      btn = btnOrForm.querySelector('button[type="submit"]') || btnOrForm.querySelector('.btn-primary');
    }
    if (!btn) return;

    if (isLoading) {
      if (btn.disabled) return false; // Already submitting
      btn.dataset.origHtml = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<span class="btn-spinner"></span> ${loadingText}`;
      btn.classList.add('loading');
      return true;
    } else {
      btn.disabled = false;
      if (btn.dataset.origHtml !== undefined) {
        btn.innerHTML = btn.dataset.origHtml;
        delete btn.dataset.origHtml;
      }
      btn.classList.remove('loading');
    }
  }

  // --- View Routing & Navigation ---
  navigateTo(viewName, params = {}) {
    window.store.activeView = viewName;

    // Hide all view sections
    document.querySelectorAll('.view-section').forEach(el => {
      el.classList.remove('active-view');
    });

    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.remove('active');
      if (el.getAttribute('data-view') === viewName) {
        el.classList.add('active');
      }
    });

    const targetSection = document.getElementById(`view-${viewName}`);
    if (targetSection) {
      targetSection.classList.add('active-view');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // View specific rendering hooks
    if (viewName === 'dashboard') {
      window.dashboardModule?.render();
    } else if (viewName === 'transactions') {
      window.transactionsModule?.render();
    } else if (viewName === 'expenses') {
      window.expensesModule?.render();
    } else if (viewName === 'income') {
      window.incomeModule?.render();
    } else if (viewName === 'activities') {
      window.activitiesModule?.render();
    } else if (viewName === 'activity-statement') {
      window.activitiesModule?.renderStatement(params.activityId || window.store.activeActivityId);
    } else if (viewName === 'reimbursements') {
      window.reimbursementsModule?.render();
    } else if (viewName === 'advances') {
      window.advancesModule?.render();
    } else if (viewName === 'projects') {
      window.projectsModule?.render();
    } else if (viewName === 'reports') {
      window.reportsModule?.render();
    } else if (viewName === 'vendors') {
      window.vendorsModule?.render();
    } else if (viewName === 'accounts') {
      window.accountsModule?.render();
    } else if (viewName === 'audit') {
      window.auditModule?.render();
    } else if (viewName === 'users') {
      window.usersModule?.render();
    } else if (viewName === 'settings') {
      window.settingsModule?.render();
    }
  }

  // --- Modals & Drawers ---
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      // Dynamic Date Assignment (Defaults to Today's date)
      const today = new Date().toISOString().substring(0, 10);
      modal.querySelectorAll('input[type="date"]').forEach(input => {
        if (!input.value || input.value === '2026-02-16' || input.value === '2026-03-01' || input.value === '2026-03-02') {
          input.value = today;
        }
      });

      // Special handling for Add Expense modal toggle reset
      if (modalId === 'modal-add-expense') {
        const personalCheck = document.getElementById('chk-is-personal-expense');
        const memberPaidGroup = document.getElementById('group-paid-by-member');
        const accountGroup = document.getElementById('group-expense-account');
        if (personalCheck && memberPaidGroup && accountGroup) {
          if (personalCheck.checked) {
            memberPaidGroup.style.display = 'block';
            accountGroup.style.display = 'none';
          } else {
            memberPaidGroup.style.display = 'none';
            accountGroup.style.display = 'block';
          }
        }
      }

      // Ensure select dropdowns are fresh
      if (window.app && window.app.populateSelectDropdowns) {
        window.app.populateSelectDropdowns();
      }

      modal.classList.add('active');
      document.body.style.overflow = 'hidden';

      // Focus first actionable input
      setTimeout(() => {
        const firstInput = modal.querySelector('input:not([type="hidden"]), select, textarea');
        firstInput?.focus();
      }, 100);
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      // Reset any submit button loading state inside modal
      const btn = modal.querySelector('button[type="submit"]') || modal.querySelector('.btn-primary');
      if (btn && btn.disabled && btn.classList.contains('loading')) {
        this.setButtonLoading(btn, false);
      }
    }
  }

  openDrawer(drawerId) {
    const drawer = document.getElementById(drawerId);
    if (drawer) {
      drawer.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  closeDrawer(drawerId) {
    const drawer = document.getElementById(drawerId);
    if (drawer) {
      drawer.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  // --- Formatters ---
  formatMoney(amount) {
    const val = Number(amount || 0);
    return '৳' + val.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  }

  getStatusBadge(status) {
    const s = String(status || '').toLowerCase();
    let badgeClass = 'badge-draft';

    if (s === 'paid' || s === 'completed') badgeClass = 'badge-paid';
    else if (s === 'approved') badgeClass = 'badge-approved';
    else if (s === 'verified') badgeClass = 'badge-verified';
    else if (s === 'submitted') badgeClass = 'badge-submitted';
    else if (s.includes('pending')) badgeClass = 'badge-pending';
    else if (s === 'active' || s === 'issued') badgeClass = 'badge-active';
    else if (s === 'rejected' || s === 'cancelled') badgeClass = 'badge-rejected';

    return `<span class="badge ${badgeClass}">${status}</span>`;
  }

  // --- Theme Toggle ---
  initTheme() {
    const savedTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME) || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, next);
    this.showToast(`Theme switched to ${next} mode`, 'info');
  }
}

window.UI = new UIEngine();
window.escapeHTML = (s) => window.UI.escapeHTML(s);
