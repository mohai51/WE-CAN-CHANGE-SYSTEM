/**
 * WCC Finance Management & Accounting System
 * Financial Accounts & Vaults Management Module
 * Supports multiple Bank Accounts, multiple bKash Merchant Wallets, Nagad, Rocket, and Cash Vaults.
 */

class AccountsModule {
  constructor() {
    this.currentFilter = 'all';
    this.searchQuery = '';
  }

  setFilter(filterType) {
    this.currentFilter = filterType;
    this.updateFilterButtons();
    this.render();
  }

  setSearch(query) {
    this.searchQuery = (query || '').toLowerCase().trim();
    this.render();
  }

  updateFilterButtons() {
    document.querySelectorAll('.account-filter-btn').forEach(btn => {
      const filter = btn.getAttribute('data-filter');
      if (filter === this.currentFilter) {
        btn.classList.remove('btn-outline');
        btn.classList.add('btn-primary', 'active');
      } else {
        btn.classList.remove('btn-primary', 'active');
        btn.classList.add('btn-outline');
      }
    });
  }

  getFilteredAccounts() {
    const list = window.store.data.accounts || [];
    return list.filter(acc => {
      const type = (acc.accountType || '').toLowerCase();

      // Type Filter
      if (this.currentFilter === 'bank') {
        if (!type.includes('bank')) return false;
      } else if (this.currentFilter === 'mfs') {
        if (!type.includes('bkash') && !type.includes('nagad') && !type.includes('rocket') && !type.includes('mfs') && !type.includes('wallet') && !type.includes('upay')) {
          return false;
        }
      } else if (this.currentFilter === 'cash') {
        if (type !== 'cash' && !type.includes('vault') && !type.includes('hand')) return false;
      } else if (this.currentFilter === 'active') {
        if (acc.status !== 'Active') return false;
      }

      // Search Filter
      if (this.searchQuery) {
        const matchName = (acc.name || '').toLowerCase().includes(this.searchQuery);
        const matchBank = (acc.bankName || '').toLowerCase().includes(this.searchQuery);
        const matchNumber = (acc.accountNumber || '').toLowerCase().includes(this.searchQuery);
        const matchBranch = (acc.branchName || '').toLowerCase().includes(this.searchQuery);
        const matchType = type.includes(this.searchQuery);
        const matchId = (acc.id || '').toLowerCase().includes(this.searchQuery);
        if (!matchName && !matchBank && !matchNumber && !matchBranch && !matchType && !matchId) {
          return false;
        }
      }

      return true;
    });
  }

  render() {
    this.updateFilterButtons();
    this.renderSummary();
    this.renderGrid();
  }

  renderSummary() {
    const summaryContainer = document.getElementById('accounts-summary-bar');
    if (!summaryContainer) return;

    const list = window.store.data.accounts || [];
    let totalLiquidity = 0;
    let totalBanks = 0;
    let bankCount = 0;
    let totalMFS = 0;
    let mfsCount = 0;
    let totalCash = 0;
    let cashCount = 0;

    list.forEach(acc => {
      const bal = Number(acc.currentBalance || 0);
      const type = (acc.accountType || '').toLowerCase();

      if (acc.status === 'Active') {
        totalLiquidity += bal;
      }

      if (type.includes('bank')) {
        totalBanks += bal;
        bankCount++;
      } else if (type.includes('bkash') || type.includes('nagad') || type.includes('rocket') || type.includes('mfs') || type.includes('wallet') || type.includes('upay')) {
        totalMFS += bal;
        mfsCount++;
      } else if (type === 'cash' || type.includes('vault') || type.includes('hand')) {
        totalCash += bal;
        cashCount++;
      }
    });

    summaryContainer.innerHTML = `
      <div class="stat-card" style="border-left: 4px solid var(--navy);">
        <div class="stat-icon-wrap" style="background:var(--navy-subtle); color:var(--navy);">
          <span style="font-size:20px;">🏦</span>
        </div>
        <div class="stat-content">
          <div class="stat-label">Total Bank Accounts (${bankCount})</div>
          <div class="stat-value" style="color:var(--navy);">${window.UI.formatMoney(totalBanks)}</div>
          <div class="stat-meta">Across Corporate Bank A/Cs</div>
        </div>
      </div>

      <div class="stat-card" style="border-left: 4px solid #D12053;">
        <div class="stat-icon-wrap" style="background:#FDF2F5; color:#D12053;">
          <span style="font-size:20px;">📱</span>
        </div>
        <div class="stat-content">
          <div class="stat-label">bKash & MFS Wallets (${mfsCount})</div>
          <div class="stat-value" style="color:#D12053;">${window.UI.formatMoney(totalMFS)}</div>
          <div class="stat-meta">bKash Merchant, Nagad & Rocket</div>
        </div>
      </div>

      <div class="stat-card" style="border-left: 4px solid var(--success);">
        <div class="stat-icon-wrap" style="background:var(--success-subtle); color:var(--success);">
          <span style="font-size:20px;">💵</span>
        </div>
        <div class="stat-content">
          <div class="stat-label">Cash in Hand / Vaults (${cashCount})</div>
          <div class="stat-value" style="color:var(--success);">${window.UI.formatMoney(totalCash)}</div>
          <div class="stat-meta">Internal Petty Cash Safes</div>
        </div>
      </div>

      <div class="stat-card" style="border-left: 4px solid var(--primary);">
        <div class="stat-icon-wrap" style="background:var(--primary-subtle); color:var(--primary);">
          <span style="font-size:20px;">💎</span>
        </div>
        <div class="stat-content">
          <div class="stat-label">Total Liquid Reserve</div>
          <div class="stat-value" style="color:var(--primary);">${window.UI.formatMoney(totalLiquidity)}</div>
          <div class="stat-meta">Combined Active Balance</div>
        </div>
      </div>
    `;
  }

  getBadgeStyleForType(type) {
    const t = (type || '').toLowerCase();
    if (t.includes('bkash')) {
      return 'background:#FDF2F5; color:#D12053; border:1px solid #F8C3D2;';
    } else if (t.includes('nagad')) {
      return 'background:#FFF6ED; color:#E65100; border:1px solid #FFCC80;';
    } else if (t.includes('rocket')) {
      return 'background:#F7F0FA; color:#7B1FA2; border:1px solid #E1BEE7;';
    } else if (t.includes('bank')) {
      return 'background:var(--navy-subtle); color:var(--navy); border:1px solid var(--navy-light);';
    } else if (t.includes('cash') || t.includes('vault') || t.includes('hand')) {
      return 'background:var(--success-subtle); color:var(--success); border:1px solid var(--success-light);';
    }
    return 'background:var(--bg-surface-tertiary); color:var(--text-secondary); border:1px solid var(--border-color);';
  }

  getTypeIcon(type) {
    const t = (type || '').toLowerCase();
    if (t.includes('bkash')) return '🌸';
    if (t.includes('nagad')) return '🔥';
    if (t.includes('rocket')) return '🚀';
    if (t.includes('bank')) return '🏦';
    if (t.includes('cash') || t.includes('vault') || t.includes('hand')) return '💵';
    return '💳';
  }

  renderGrid() {
    const grid = document.getElementById('accounts-grid');
    if (!grid) return;

    const list = this.getFilteredAccounts();

    if (list.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:48px 20px; background:var(--bg-surface); border:1px dashed var(--border-color); border-radius:var(--radius-lg);">
          <div style="font-size:36px; margin-bottom:12px;">🏦</div>
          <h3 style="font-size:16px; font-weight:700; color:var(--text-primary); margin-bottom:6px;">No Accounts Found</h3>
          <p style="font-size:13px; color:var(--text-tertiary); max-width:400px; margin:0 auto 16px auto;">
            ${this.searchQuery ? `No account matched your search "${this.searchQuery}".` : 'No financial accounts or vaults registered under this filter.'}
          </p>
          <button class="btn btn-primary btn-sm" onclick="window.accountsModule.openAddModal()">+ Add New Account / Vault</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = list.map(acc => {
      const badgeStyle = this.getBadgeStyleForType(acc.accountType);
      const typeIcon = this.getTypeIcon(acc.accountType);
      const isActive = acc.status === 'Active';

      return `
        <div class="card account-card" style="display:flex; flex-direction:column; justify-content:space-between; transition:transform 0.15s ease, box-shadow 0.15s ease; border: 1px solid var(--border-color); position:relative; overflow:hidden;">
          <div class="card-body" style="padding:20px;">
            <!-- Header Row: ID + Type Badge + Status -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:6px;">
              <span class="code-pill" style="font-size:11.5px; font-weight:700;">${window.escapeHTML(acc.id)}</span>
              <div style="display:flex; gap:6px; align-items:center;">
                <span class="badge" style="${badgeStyle} font-size:11.5px; font-weight:700; padding:3px 8px; border-radius:12px; display:inline-flex; align-items:center; gap:4px;">
                  <span>${typeIcon}</span> ${window.escapeHTML(acc.accountType)}
                </span>
                <span class="badge ${isActive ? 'badge-active' : 'badge-inactive'}" style="font-size:11px;">
                  ${window.escapeHTML(acc.status || 'Active')}
                </span>
              </div>
            </div>

            <!-- Account Name -->
            <h3 style="font-size:16.5px; font-weight:800; color:var(--text-primary); margin-bottom:6px; line-height:1.3; word-break:break-word;">
              ${window.escapeHTML(acc.name)}
            </h3>

            <!-- Institution & Branch -->
            <div style="font-size:12.5px; color:var(--text-secondary); margin-bottom:12px; display:flex; flex-direction:column; gap:3px;">
              <div><strong>Institution:</strong> ${window.escapeHTML(acc.bankName || 'Internal Safe')}</div>
              ${acc.branchName ? `<div><strong>Branch:</strong> ${window.escapeHTML(acc.branchName)}</div>` : ''}
              ${acc.routingNumber ? `<div><strong>Routing / Short Code:</strong> <span style="font-family:var(--font-mono); font-size:11.5px;">${window.escapeHTML(acc.routingNumber)}</span></div>` : ''}
            </div>

            <!-- Account / Wallet Number Bar -->
            <div style="background:var(--bg-surface-secondary); border:1px solid var(--border-light); border-radius:var(--radius-md); padding:8px 12px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; gap:8px;">
              <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;">
                <span style="font-size:10.5px; color:var(--text-tertiary); display:block; text-transform:uppercase; letter-spacing:0.04em;">A/C / Wallet #</span>
                <strong style="font-family:var(--font-mono); font-size:13.5px; color:var(--navy); word-break:break-all;">${window.escapeHTML(acc.accountNumber || 'N/A')}</strong>
              </div>
              ${acc.accountNumber ? `
                <button type="button" class="btn btn-outline btn-xs" onclick="window.accountsModule.copyAccountNumber('${window.escapeHTML(acc.accountNumber)}')" title="Copy Number" style="padding:4px 8px; font-size:11px; flex-shrink:0;">
                  📋 Copy
                </button>
              ` : ''}
            </div>

            <!-- Current Balance Display -->
            <div style="background:linear-gradient(135deg, var(--bg-surface-secondary) 0%, #FFFFFF 100%); border:1.5px solid var(--border-color); border-radius:var(--radius-md); padding:12px 14px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
              <div>
                <span style="font-size:11px; color:var(--text-tertiary); display:block;">Current Balance</span>
                <span style="font-size:11.5px; color:var(--text-secondary);">Opening: ৳${Number(acc.openingBalance || 0).toLocaleString()}</span>
              </div>
              <div style="text-align:right;">
                <span style="font-size:18px; font-weight:800; color:var(--navy); font-family:var(--font-mono);">
                  ${window.UI.formatMoney(acc.currentBalance)}
                </span>
              </div>
            </div>

            <!-- Notes / Purpose if any -->
            ${acc.notes ? `
              <div style="font-size:11.5px; color:var(--text-tertiary); font-style:italic; line-height:1.3; margin-top:6px; border-left:2px solid var(--accent); padding-left:8px; word-break:break-word;">
                ${window.escapeHTML(acc.notes)}
              </div>
            ` : ''}
          </div>

          <!-- Card Footer Actions -->
          <div style="background:var(--bg-surface-secondary); padding:10px 16px; border-top:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
            ${window.auth && window.auth.canEditFinance() ? `
              <button type="button" class="btn btn-outline btn-xs" onclick="window.accountsModule.openEditModal('${window.escapeHTML(acc.id)}')" style="font-weight:600;">
                ✏️ Edit
              </button>
            ` : '<span></span>'}
            <button type="button" class="btn btn-outline btn-xs" onclick="window.accountsModule.filterTransactionsByAccount('${window.escapeHTML(acc.id)}')" style="font-weight:600; color:var(--navy);">
              📊 Transactions &rarr;
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- Modal Operations ---

  openAddModal() {
    const form = document.querySelector('#modal-add-account form');
    if (form) form.reset();
    window.UI.openModal('modal-add-account');
  }

  async handleFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('.btn-primary');

    if (window.UI.setButtonLoading(submitBtn, true, 'Creating Account...') === false) {
      return;
    }

    const formData = new FormData(form);
    const name = (formData.get('name') || '').trim();
    const accountType = formData.get('accountType');
    const accountNumber = (formData.get('accountNumber') || '').trim();
    const bankName = (formData.get('bankName') || '').trim();
    const branchName = (formData.get('branchName') || '').trim();
    const routingNumber = (formData.get('routingNumber') || '').trim();
    const openingBalance = Number(formData.get('openingBalance') || 0);
    const status = formData.get('status') || 'Active';
    const notes = (formData.get('notes') || '').trim();

    if (!name) {
      window.UI.showToast('Please enter an account name.', 'warning');
      window.UI.setButtonLoading(submitBtn, false);
      return;
    }
    if (isNaN(openingBalance) || openingBalance < 0 || !Number.isFinite(openingBalance) || openingBalance > 1000000000) {
      window.UI.showToast('Please enter a valid positive opening balance (Max ৳1,000,000,000).', 'warning');
      window.UI.setButtonLoading(submitBtn, false);
      return;
    }

    const payload = {
      name,
      accountType,
      accountNumber,
      bankName,
      branchName,
      routingNumber,
      openingBalance,
      status,
      notes
    };

    try {
      await window.api.request('createAccount', payload);
      window.UI.closeModal('modal-add-account');
      window.UI.showToast(`Account "${name}" created successfully!`, 'success');
      form.reset();

      // Refresh accounts view
      this.render();

      // Refresh all select dropdowns across the application
      if (window.app && window.app.populateSelectDropdowns) {
        window.app.populateSelectDropdowns();
      }
    } catch (err) {
      console.error('Failed to create account:', err);
      window.UI.showToast(`Error creating account: ${err.message}`, 'danger');
    } finally {
      window.UI.setButtonLoading(submitBtn, false);
    }
  }

  openEditModal(accountId) {
    if (!window.auth || !window.auth.canEditFinance()) {
      window.UI.showToast('You do not have permission to edit financial accounts.', 'warning');
      return;
    }

    const list = window.store.data.accounts || [];
    const acc = list.find(a => a.id === accountId);
    if (!acc) {
      window.UI.showToast('Account not found.', 'danger');
      return;
    }

    document.getElementById('edit-account-id').value = acc.id;
    document.getElementById('edit-account-name').value = acc.name || '';
    document.getElementById('edit-account-type').value = acc.accountType || 'Bank Account';
    document.getElementById('edit-account-number').value = acc.accountNumber || '';
    document.getElementById('edit-account-bank').value = acc.bankName || '';
    document.getElementById('edit-account-branch').value = acc.branchName || '';
    document.getElementById('edit-account-routing').value = acc.routingNumber || '';
    document.getElementById('edit-account-status').value = acc.status || 'Active';
    document.getElementById('edit-account-notes').value = acc.notes || '';

    window.UI.openModal('modal-edit-account');
  }

  async handleEditSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('.btn-primary');

    if (window.UI.setButtonLoading(submitBtn, true, 'Updating Account...') === false) {
      return;
    }

    const formData = new FormData(form);
    const accountId = formData.get('accountId');
    const name = (formData.get('name') || '').trim();
    const accountType = formData.get('accountType');
    const accountNumber = (formData.get('accountNumber') || '').trim();
    const bankName = (formData.get('bankName') || '').trim();
    const branchName = (formData.get('branchName') || '').trim();
    const routingNumber = (formData.get('routingNumber') || '').trim();
    const status = formData.get('status') || 'Active';
    const notes = (formData.get('notes') || '').trim();

    if (!accountId || !name) {
      window.UI.showToast('Account ID and Name are required.', 'warning');
      window.UI.setButtonLoading(submitBtn, false);
      return;
    }

    const payload = {
      accountId,
      name,
      accountType,
      accountNumber,
      bankName,
      branchName,
      routingNumber,
      status,
      notes
    };

    try {
      await window.api.request('updateAccount', payload);
      window.UI.closeModal('modal-edit-account');
      window.UI.showToast(`Account "${name}" updated successfully!`, 'success');

      // Refresh accounts view
      this.render();

      // Refresh dropdowns
      if (window.app && window.app.populateSelectDropdowns) {
        window.app.populateSelectDropdowns();
      }
    } catch (err) {
      console.error('Failed to update account:', err);
      window.UI.showToast(`Error updating account: ${err.message}`, 'danger');
    } finally {
      window.UI.setButtonLoading(submitBtn, false);
    }
  }

  copyAccountNumber(number) {
    if (!number) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(number).then(() => {
        window.UI.showToast(`Copied ${number} to clipboard!`, 'success');
      }).catch(() => {
        this.fallbackCopy(number);
      });
    } else {
      this.fallbackCopy(number);
    }
  }

  fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      window.UI.showToast(`Copied ${text} to clipboard!`, 'success');
    } catch (err) {
      window.UI.showToast('Could not copy automatically.', 'info');
    }
    document.body.removeChild(textArea);
  }

  filterTransactionsByAccount(accountId) {
    const acc = (window.store.data.accounts || []).find(a => a.id === accountId);
    window.UI.navigateTo('transactions');
    if (acc) {
      const searchInput = document.getElementById('search-transactions');
      if (searchInput) {
        searchInput.value = acc.name;
      }
      if (window.transactionsModule) {
        window.transactionsModule.search(acc.name);
      }
    }
  }
}

window.accountsModule = new AccountsModule();
