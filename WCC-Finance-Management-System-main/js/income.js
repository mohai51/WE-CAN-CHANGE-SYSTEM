/**
 * WCC Finance Management & Accounting System
 * Income Management Module
 */

class IncomeModule {
  constructor() {
    this.searchQuery = '';
  }

  render() {
    const container = document.getElementById('income-table-body');
    if (!container) return;

    let list = [...window.store.data.income];

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(i => 
        (i.id && i.id.toLowerCase().includes(q)) ||
        (i.sourceOrDonor && i.sourceOrDonor.toLowerCase().includes(q)) ||
        (i.incomeType && i.incomeType.toLowerCase().includes(q)) ||
        (i.activityName && i.activityName.toLowerCase().includes(q))
      );
    }

    if (list.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-5">
            <div class="empty-state">
              <div class="empty-state-icon">💰</div>
              <div class="empty-state-title">No income records</div>
              <div class="empty-state-desc">Record incoming grants, donations, or membership fees.</div>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    const canEdit = window.auth && window.auth.canEditFinance();

    container.innerHTML = list.map(i => `
      <tr>
        <td><span class="code-pill">${window.escapeHTML(i.id)}</span></td>
        <td>${window.UI.formatDate(i.date)}</td>
        <td>
          <div style="font-weight:600;">${window.escapeHTML(i.sourceOrDonor)}</div>
          <div style="font-size:11.5px; color:var(--text-tertiary);">${window.escapeHTML(i.incomeType)}</div>
        </td>
        <td>${window.escapeHTML(i.activityName || 'General Fund')}</td>
        <td>${window.escapeHTML(i.accountName || i.paymentMethod)}</td>
        <td style="font-weight:700; color:var(--success); font-family:var(--font-mono);">
          +${window.UI.formatMoney(i.amount)}
        </td>
        <td>${window.UI.getStatusBadge('Paid')}</td>
        <td class="actions-cell">
          ${canEdit ? `
            <button type="button" class="btn btn-outline btn-xs" onclick="window.incomeModule.openEditModal('${window.escapeHTML(i.id)}')" title="Edit Income">
              ✏️ Edit
            </button>
          ` : '-'}
        </td>
      </tr>
    `).join('');
  }

  async handleFormSubmit(event) {
    event.preventDefault();
    const form = event.target;

    const accountId = form.accountId ? form.accountId.value : '';
    const amount = parseFloat(form.amount ? form.amount.value : 0);
    const sourceOrDonor = (form.sourceOrDonor ? form.sourceOrDonor.value : '').trim();

    if (!accountId) {
      window.UI.showToast('Please select a deposit account or vault.', 'warning');
      return;
    }
    if (isNaN(amount) || amount <= 0 || !Number.isFinite(amount) || amount > 100000000) {
      window.UI.showToast('Please enter a valid positive received amount (Max ৳100,000,000).', 'warning');
      return;
    }
    if (!sourceOrDonor) {
      window.UI.showToast('Please specify the source or donor name.', 'warning');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('.btn-primary') || form.querySelector('.btn-navy');
    if (window.UI.setButtonLoading(submitBtn, true, 'Recording Income...') === false) {
      return; // Prevent duplicate submit
    }

    const activityId = form.activityId ? form.activityId.value : null;
    const activity = activityId ? ((window.store.data.activities || []).find(a => a.id === activityId) ||
                                  (window.store.data.projects || []).find(p => p.id === activityId)) : null;

    const account = (window.store.data.accounts || []).find(a => a.id === accountId);

    const payload = {
      date: form.date.value,
      incomeType: form.incomeType.value,
      sourceOrDonor: sourceOrDonor,
      activityId: activityId || null,
      activityName: activity ? activity.name : 'General Fund',
      amount: amount,
      paymentMethod: form.paymentMethod.value,
      accountId: accountId,
      accountName: account ? account.name : '',
      referenceNumber: (form.referenceNumber ? form.referenceNumber.value : '').trim(),
      remarks: (form.remarks ? form.remarks.value : '').trim()
    };

    try {
      await window.api.request('createIncome', payload);
      window.UI.closeModal('modal-add-income');
      window.UI.showToast('Income recorded successfully!', 'success');
      form.reset();
      this.render();
      window.dashboardModule?.render();
      window.transactionsModule?.render();
      if (window.app && window.app.populateSelectDropdowns) {
        window.app.populateSelectDropdowns();
      }
    } catch (err) {
      window.UI.showToast(`Failed to record income: ${err.message}`, 'error');
    } finally {
      window.UI.setButtonLoading(submitBtn, false);
    }
  }

  openEditModal(incomeId) {
    if (!window.auth || !window.auth.canEditFinance()) {
      window.UI.showToast('You do not have permission to edit financial records.', 'warning');
      return;
    }

    const inc = (window.store.data.income || []).find(i => i.id === incomeId);
    if (!inc) {
      window.UI.showToast('Income record not found: ' + incomeId, 'error');
      return;
    }

    if (window.app && window.app.populateSelectDropdowns) {
      window.app.populateSelectDropdowns();
    }

    document.getElementById('edit-income-id').value = inc.id;
    const displayEl = document.getElementById('edit-income-id-display');
    if (displayEl) displayEl.textContent = inc.id;
    document.getElementById('edit-income-date').value = inc.date ? inc.date.substring(0, 10) : '';
    document.getElementById('edit-income-amount').value = inc.amount;
    document.getElementById('edit-income-type').value = inc.incomeType || 'Donation';
    document.getElementById('edit-income-account').value = inc.accountId || '';
    document.getElementById('edit-income-source').value = inc.sourceOrDonor || '';
    document.getElementById('edit-income-activity').value = inc.activityId || '';
    document.getElementById('edit-income-payment-method').value = inc.paymentMethod || 'Bank Transfer';
    document.getElementById('edit-income-reference').value = inc.referenceNumber || '';
    document.getElementById('edit-income-remarks').value = inc.remarks || '';

    window.UI.openModal('modal-edit-income');
  }

  async handleEditSubmit(event) {
    event.preventDefault();
    if (!window.auth || !window.auth.canEditFinance()) {
      window.UI.showToast('Permission denied: Only Admin and Finance Officer can edit income.', 'error');
      return;
    }

    const form = event.target;
    const incomeId = form.incomeId.value;
    const accountId = form.accountId ? form.accountId.value : '';
    const amount = parseFloat(form.amount ? form.amount.value : 0);
    const sourceOrDonor = (form.sourceOrDonor ? form.sourceOrDonor.value : '').trim();

    if (!accountId) {
      window.UI.showToast('Please select a deposit account or vault.', 'warning');
      return;
    }
    if (isNaN(amount) || amount <= 0 || !Number.isFinite(amount) || amount > 100000000) {
      window.UI.showToast('Please enter a valid positive received amount (Max ৳100,000,000).', 'warning');
      return;
    }
    if (!sourceOrDonor) {
      window.UI.showToast('Please specify the source or donor name.', 'warning');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('.btn-navy');
    if (window.UI.setButtonLoading(submitBtn, true, 'Saving Changes...') === false) {
      return;
    }

    const activityId = form.activityId ? form.activityId.value : null;
    const activity = activityId ? ((window.store.data.activities || []).find(a => a.id === activityId) ||
                                  (window.store.data.projects || []).find(p => p.id === activityId)) : null;

    const account = (window.store.data.accounts || []).find(a => a.id === accountId);

    const payload = {
      incomeId: incomeId,
      date: form.date.value,
      incomeType: form.incomeType.value,
      sourceOrDonor: sourceOrDonor,
      activityId: activityId || null,
      activityName: activity ? activity.name : 'General Fund',
      amount: amount,
      paymentMethod: form.paymentMethod.value,
      accountId: accountId,
      accountName: account ? account.name : '',
      referenceNumber: (form.referenceNumber ? form.referenceNumber.value : '').trim(),
      remarks: (form.remarks ? form.remarks.value : '').trim()
    };

    try {
      await window.api.request('updateIncome', payload);
      window.UI.closeModal('modal-edit-income');
      window.UI.showToast(`Income ${incomeId} updated successfully!`, 'success');
      this.render();
      window.dashboardModule?.render();
      window.transactionsModule?.render();
      if (window.app && window.app.populateSelectDropdowns) {
        window.app.populateSelectDropdowns();
      }
    } catch (err) {
      window.UI.showToast(`Failed to update income: ${err.message}`, 'error');
    } finally {
      window.UI.setButtonLoading(submitBtn, false);
    }
  }
}

window.incomeModule = new IncomeModule();
