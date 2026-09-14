/**
 * WCC Finance Management & Accounting System
 * Expense Management Module
 */

class ExpensesModule {
  constructor() {
    this.searchQuery = '';
    this.categoryFilter = 'all';
  }

  render() {
    const container = document.getElementById('expenses-table-body');
    if (!container) return;

    let list = [...window.store.data.expenses];

    if (this.categoryFilter !== 'all') {
      list = list.filter(e => e.category === this.categoryFilter);
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(e => 
        (e.id && e.id.toLowerCase().includes(q)) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.activityName && e.activityName.toLowerCase().includes(q)) ||
        (e.paidBy && e.paidBy.toLowerCase().includes(q)) ||
        (e.vendorOrMember && e.vendorOrMember.toLowerCase().includes(q))
      );
    }

    if (list.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-5">
            <div class="empty-state">
              <div class="empty-state-icon">💸</div>
              <div class="empty-state-title">No expenses recorded</div>
              <div class="empty-state-desc">Record a new expense using the "+ Add Expense" button above.</div>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    const canEdit = window.auth && window.auth.canEditFinance();

    container.innerHTML = list.map(e => `
      <tr>
        <td><span class="code-pill">${window.escapeHTML(e.id)}</span></td>
        <td>${window.UI.formatDate(e.date)}</td>
        <td>
          <div style="font-weight:600;">${window.escapeHTML(e.activityName)}</div>
          <div style="font-size:11.5px; color:var(--text-tertiary);">${window.escapeHTML(e.category)}</div>
        </td>
        <td>
          <div style="max-width:220px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${window.escapeHTML(e.description)}">
            ${window.escapeHTML(e.description)}
          </div>
        </td>
        <td>
          <div>${window.escapeHTML(e.paidBy || '-')}</div>
          ${e.isMemberPersonalExpense ? '<span class="badge badge-warning" style="font-size:10px;">Personal Payment</span>' : ''}
        </td>
        <td>${window.escapeHTML(e.paymentMethod || '-')}</td>
        <td style="font-weight:700; color:var(--primary); font-family:var(--font-mono);">
          ${window.UI.formatMoney(e.amount)}
        </td>
        <td>${window.UI.getStatusBadge(e.status)}</td>
        <td class="actions-cell">
          ${canEdit ? `
            <button type="button" class="btn btn-outline btn-xs" onclick="window.expensesModule.openEditModal('${window.escapeHTML(e.id)}')" title="Edit Expense">
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

    const activityId = form.activityId.value;
    const isPersonal = form.isMemberPersonalExpense ? form.isMemberPersonalExpense.checked : false;
    const paidByMemberInput = form.paidByMember;
    const paidByMemberName = paidByMemberInput ? paidByMemberInput.value.trim() : '';

    const amountVal = parseFloat(form.amount.value);
    if (isNaN(amountVal) || amountVal <= 0 || !Number.isFinite(amountVal) || amountVal > 100000000) {
      window.UI.showToast('Please enter a valid positive expense amount (Max ৳100,000,000).', 'warning');
      return;
    }

    // Check if the entered name matches any existing member
    let memberId = '';
    if (paidByMemberName && window.store.data.members) {
      const matchedMember = window.store.data.members.find(m => 
        (m.name && m.name.toLowerCase() === paidByMemberName.toLowerCase()) ||
        (m.id && m.id.toLowerCase() === paidByMemberName.toLowerCase())
      );
      if (matchedMember) {
        memberId = matchedMember.id;
      }
    }

    const accountId = form.accountId ? form.accountId.value : '';

    if (!activityId) {
      window.UI.showToast('Please select a linked activity or project.', 'warning');
      return;
    }
    if (isPersonal && !paidByMemberName) {
      window.UI.showToast('Please enter the name of the person who paid personal money.', 'warning');
      return;
    }
    if (!isPersonal && !accountId) {
      window.UI.showToast('Please select an account/vault to deduct payment from.', 'warning');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('.btn-primary');
    if (window.UI.setButtonLoading(submitBtn, true, 'Recording Expense...') === false) {
      return; // Prevent multi-clicks
    }

    const activity = (window.store.data.activities || []).find(a => a.id === activityId) ||
                     (window.store.data.projects || []).find(p => p.id === activityId);
    const account = (window.store.data.accounts || []).find(a => a.id === accountId);

    const payload = {
      date: form.date.value,
      activityId: activityId,
      activityName: activity ? activity.name : 'General Fund',
      category: form.category.value,
      description: form.description.value.trim(),
      amount: amountVal,
      paymentMethod: isPersonal ? `Personal Payment (${paidByMemberName})` : form.paymentMethod.value,
      accountId: isPersonal ? null : accountId,
      accountName: isPersonal ? 'Pending Reimbursement' : (account ? account.name : ''),
      paidBy: isPersonal ? paidByMemberName : 'WCC Direct',
      memberId: isPersonal ? (memberId || null) : null,
      vendorOrMember: form.vendorOrMember.value.trim() || (isPersonal ? paidByMemberName : 'General Supplier'),
      referenceNumber: form.referenceNumber.value.trim(),
      remarks: form.remarks.value.trim(),
      isMemberPersonalExpense: isPersonal
    };

    try {
      // Check if file attached
      const fileInput = form.querySelector('input[type="file"]');
      if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const uploadRes = await window.api.uploadFile(file, { activityId });
        payload.attachmentUrl = uploadRes.driveUrl;
        payload.attachmentName = uploadRes.fileName;
      }

      await window.api.request('createExpense', payload);
      window.UI.closeModal('modal-add-expense');
      window.UI.showToast('Expense recorded successfully!', 'success');
      form.reset();

      // Reset personal payment toggle UI
      const memberPaidGroup = document.getElementById('group-paid-by-member');
      const accountGroup = document.getElementById('group-expense-account');
      if (memberPaidGroup) memberPaidGroup.style.display = 'none';
      if (accountGroup) accountGroup.style.display = 'block';

      this.render();
      window.dashboardModule?.render();
      window.transactionsModule?.render();
      if (window.app && window.app.populateSelectDropdowns) {
        window.app.populateSelectDropdowns();
      }
    } catch (err) {
      window.UI.showToast(`Failed to record expense: ${err.message}`, 'error');
    } finally {
      window.UI.setButtonLoading(submitBtn, false);
    }
  }

  toggleEditPersonalExpense(isPersonal) {
    const memberPaidGroup = document.getElementById('edit-group-paid-by-member');
    const accountGroup = document.getElementById('edit-group-expense-account');
    if (memberPaidGroup) memberPaidGroup.style.display = isPersonal ? 'block' : 'none';
    if (accountGroup) accountGroup.style.display = isPersonal ? 'none' : 'block';
  }

  openEditModal(expenseId) {
    if (!window.auth || !window.auth.canEditFinance()) {
      window.UI.showToast('You do not have permission to edit financial records.', 'warning');
      return;
    }

    const exp = (window.store.data.expenses || []).find(e => e.id === expenseId);
    if (!exp) {
      window.UI.showToast('Expense record not found: ' + expenseId, 'error');
      return;
    }

    if (window.app && window.app.populateSelectDropdowns) {
      window.app.populateSelectDropdowns();
    }

    document.getElementById('edit-expense-id').value = exp.id;
    const displayEl = document.getElementById('edit-expense-id-display');
    if (displayEl) displayEl.textContent = exp.id;
    document.getElementById('edit-expense-date').value = exp.date ? exp.date.substring(0, 10) : '';
    document.getElementById('edit-expense-amount').value = exp.amount;
    document.getElementById('edit-expense-activity').value = exp.activityId || '';
    document.getElementById('edit-expense-category').value = exp.category || '';
    document.getElementById('edit-expense-payment-method').value = exp.paymentMethod || 'Cash';
    
    const isPersonal = !!exp.isMemberPersonalExpense;
    const personalChk = document.getElementById('edit-chk-is-personal-expense');
    if (personalChk) personalChk.checked = isPersonal;
    
    const paidByMemberInput = document.getElementById('edit-input-paid-by-member');
    if (paidByMemberInput) paidByMemberInput.value = isPersonal ? (exp.paidBy || '') : '';

    const accountSelect = document.getElementById('edit-expense-account');
    if (accountSelect) accountSelect.value = exp.accountId || '';

    const vendorInput = document.getElementById('edit-expense-vendor');
    if (vendorInput) vendorInput.value = exp.vendorOrMember || '';

    const descInput = document.getElementById('edit-expense-description');
    if (descInput) descInput.value = exp.description || '';

    const refInput = document.getElementById('edit-expense-reference');
    if (refInput) refInput.value = exp.referenceNumber || '';

    const remarksInput = document.getElementById('edit-expense-remarks');
    if (remarksInput) remarksInput.value = exp.remarks || '';

    this.toggleEditPersonalExpense(isPersonal);
    window.UI.openModal('modal-edit-expense');
  }

  async handleEditSubmit(event) {
    event.preventDefault();
    if (!window.auth || !window.auth.canEditFinance()) {
      window.UI.showToast('Permission denied: Only Admin and Finance Officer can edit expenses.', 'error');
      return;
    }

    const form = event.target;
    const expenseId = form.expenseId.value;
    const activityId = form.activityId.value;
    const isPersonal = form.isMemberPersonalExpense ? form.isMemberPersonalExpense.checked : false;
    const paidByMemberInput = form.paidByMember;
    const paidByMemberName = paidByMemberInput ? paidByMemberInput.value.trim() : '';

    const amountVal = parseFloat(form.amount.value);
    if (isNaN(amountVal) || amountVal <= 0 || !Number.isFinite(amountVal) || amountVal > 100000000) {
      window.UI.showToast('Please enter a valid positive expense amount (Max ৳100,000,000).', 'warning');
      return;
    }

    if (!activityId) {
      window.UI.showToast('Please select a linked activity or project.', 'warning');
      return;
    }
    if (isPersonal && !paidByMemberName) {
      window.UI.showToast('Please enter the name of the person who paid personal money.', 'warning');
      return;
    }
    const accountId = form.accountId ? form.accountId.value : '';
    if (!isPersonal && !accountId) {
      window.UI.showToast('Please select an account/vault to deduct payment from.', 'warning');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('.btn-primary');
    if (window.UI.setButtonLoading(submitBtn, true, 'Saving Changes...') === false) {
      return;
    }

    const activity = (window.store.data.activities || []).find(a => a.id === activityId) ||
                     (window.store.data.projects || []).find(p => p.id === activityId);
    const account = (window.store.data.accounts || []).find(a => a.id === accountId);

    const payload = {
      expenseId: expenseId,
      date: form.date.value,
      activityId: activityId,
      activityName: activity ? activity.name : 'General Fund',
      category: form.category.value,
      description: form.description.value.trim(),
      amount: amountVal,
      paymentMethod: isPersonal ? `Personal Payment (${paidByMemberName})` : form.paymentMethod.value,
      accountId: isPersonal ? null : accountId,
      accountName: isPersonal ? 'Pending Reimbursement' : (account ? account.name : ''),
      paidBy: isPersonal ? paidByMemberName : 'WCC Direct',
      vendorOrMember: form.vendorOrMember.value.trim() || (isPersonal ? paidByMemberName : 'General Supplier'),
      referenceNumber: form.referenceNumber.value.trim(),
      remarks: form.remarks.value.trim(),
      isMemberPersonalExpense: isPersonal
    };

    try {
      await window.api.request('updateExpense', payload);
      window.UI.closeModal('modal-edit-expense');
      window.UI.showToast(`Expense ${expenseId} updated successfully!`, 'success');
      this.render();
      window.dashboardModule?.render();
      window.transactionsModule?.render();
      window.reimbursementsModule?.render();
      if (window.app && window.app.populateSelectDropdowns) {
        window.app.populateSelectDropdowns();
      }
    } catch (err) {
      window.UI.showToast(`Failed to update expense: ${err.message}`, 'error');
    } finally {
      window.UI.setButtonLoading(submitBtn, false);
    }
  }
}

window.expensesModule = new ExpensesModule();
