/**
 * WCC Finance Management & Accounting System
 * Member Reimbursement Module
 */

class ReimbursementsModule {
  constructor() {
    this.searchQuery = '';
    this.activeReimbursementToPay = null;
  }

  render() {
    const container = document.getElementById('reimbursements-table-body');
    if (!container) return;

    let list = [...window.store.data.reimbursements];

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(r => 
        (r.memberName && r.memberName.toLowerCase().includes(q)) ||
        (r.id && r.id.toLowerCase().includes(q)) ||
        (r.activityName && r.activityName.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q))
      );
    }

    if (list.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-5">
            <div class="empty-state">
              <div class="empty-state-icon">💳</div>
              <div class="empty-state-title">No pending reimbursements</div>
              <div class="empty-state-desc">All member personal expense claims have been settled.</div>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    const canEdit = window.auth && window.auth.canEditFinance();

    container.innerHTML = list.map(r => {
      const isPaid = r.approvalStatus === 'Paid';
      return `
        <tr>
          <td><span class="code-pill">${window.escapeHTML(r.id)}</span></td>
          <td>${window.UI.formatDate(r.requestDate)}</td>
          <td><strong>${window.escapeHTML(r.memberName)}</strong></td>
          <td>
            <div style="font-weight:600;">${window.escapeHTML(r.activityName)}</div>
            <div style="font-size:11.5px; color:var(--text-tertiary);">${window.escapeHTML(r.category)} &bull; ${window.escapeHTML(r.expenseId)}</div>
          </td>
          <td style="max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            ${window.escapeHTML(r.description)}
          </td>
          <td style="font-weight:700; color:var(--gold-dark); font-family:var(--font-mono);">
            ${window.UI.formatMoney(r.amount)}
          </td>
          <td>${window.UI.getStatusBadge(r.approvalStatus)}</td>
          <td class="actions-cell">
            <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
              ${!isPaid ? `
                <button class="btn btn-primary btn-sm" onclick="window.reimbursementsModule.initPayModal('${window.escapeHTML(r.id)}')">
                  Disburse Pay
                </button>
              ` : `
                <span style="font-size:11.5px; color:var(--text-tertiary);">Paid on ${window.UI.formatDate(r.paymentDate)}</span>
              `}
              ${canEdit && !isPaid ? `
                <button class="btn btn-outline btn-sm" onclick="window.reimbursementsModule.openEditModal('${window.escapeHTML(r.id)}')">
                  ✏️ Edit
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  initPayModal(reimbursementId) {
    const reim = window.store.data.reimbursements.find(r => r.id === reimbursementId);
    if (!reim) return;

    this.activeReimbursementToPay = reim;
    const modal = document.getElementById('modal-pay-reimbursement');
    if (!modal) return;

    document.getElementById('pay-reim-id').value = reim.id;
    document.getElementById('pay-reim-member-name').textContent = reim.memberName;
    document.getElementById('pay-reim-amount-display').textContent = window.UI.formatMoney(reim.amount);
    document.getElementById('pay-reim-activity-display').textContent = reim.activityName;

    window.UI.openModal('modal-pay-reimbursement');
  }

  async handlePaySubmit(event) {
    event.preventDefault();
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('.btn-primary');

    if (window.UI.setButtonLoading(submitBtn, true, 'Disbursing...') === false) {
      return;
    }

    const payload = {
      reimbursementId: form.reimbursementId.value,
      paymentMethod: form.paymentMethod.value,
      paymentAccountId: form.accountId.value,
      paymentDate: form.paymentDate.value,
      paymentReference: form.paymentReference.value
    };

    try {
      await window.api.request('disburseReimbursement', payload);
      window.UI.closeModal('modal-pay-reimbursement');
      window.UI.showToast('Reimbursement disbursed successfully!', 'success');
      this.render();
      window.expensesModule?.render();
      window.transactionsModule?.render();
      window.dashboardModule?.render();
      if (window.app && window.app.populateSelectDropdowns) {
        window.app.populateSelectDropdowns();
      }
    } catch (err) {
      window.UI.showToast(`Payment failed: ${err.message}`, 'error');
    } finally {
      window.UI.setButtonLoading(submitBtn, false);
    }
  }

  openEditModal(reimbursementId) {
    if (!window.auth || !window.auth.canEditFinance()) {
      window.UI.showToast('You do not have permission to edit reimbursement claims.', 'warning');
      return;
    }

    const reim = (window.store.data.reimbursements || []).find(r => r.id === reimbursementId);
    if (!reim) {
      window.UI.showToast('Reimbursement claim not found: ' + reimbursementId, 'error');
      return;
    }

    if (window.app && window.app.populateSelectDropdowns) {
      window.app.populateSelectDropdowns();
    }

    document.getElementById('edit-reim-id').value = reim.id;
    const displayEl = document.getElementById('edit-reim-id-display');
    if (displayEl) displayEl.textContent = reim.id;
    const memberEl = document.getElementById('edit-reim-member-display');
    if (memberEl) memberEl.textContent = reim.memberName || '-';

    document.getElementById('edit-reim-amount').value = reim.amount;
    document.getElementById('edit-reim-category').value = reim.category || '';
    document.getElementById('edit-reim-description').value = reim.description || '';
    document.getElementById('edit-reim-notes').value = reim.notes || '';

    window.UI.openModal('modal-edit-reimbursement');
  }

  async handleEditSubmit(event) {
    event.preventDefault();
    if (!window.auth || !window.auth.canEditFinance()) {
      window.UI.showToast('Permission denied: Only Admin and Finance Officer can edit claims.', 'error');
      return;
    }

    const form = event.target;
    const reimbursementId = form.reimbursementId.value;
    const amountVal = parseFloat(form.amount.value);
    if (isNaN(amountVal) || amountVal <= 0 || !Number.isFinite(amountVal) || amountVal > 100000000) {
      window.UI.showToast('Please enter a valid positive claim amount (Max ৳100,000,000).', 'warning');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('.btn-primary');
    if (window.UI.setButtonLoading(submitBtn, true, 'Saving Changes...') === false) {
      return;
    }

    const payload = {
      reimbursementId: reimbursementId,
      amount: amountVal,
      category: form.category.value,
      description: form.description.value.trim(),
      notes: form.notes ? form.notes.value.trim() : ''
    };

    try {
      await window.api.request('updateReimbursement', payload);
      window.UI.closeModal('modal-edit-reimbursement');
      window.UI.showToast(`Reimbursement ${reimbursementId} updated successfully!`, 'success');
      this.render();
      window.expensesModule?.render();
      window.transactionsModule?.render();
      window.dashboardModule?.render();
      if (window.app && window.app.populateSelectDropdowns) {
        window.app.populateSelectDropdowns();
      }
    } catch (err) {
      window.UI.showToast(`Failed to update reimbursement: ${err.message}`, 'error');
    } finally {
      window.UI.setButtonLoading(submitBtn, false);
    }
  }
}

window.reimbursementsModule = new ReimbursementsModule();
