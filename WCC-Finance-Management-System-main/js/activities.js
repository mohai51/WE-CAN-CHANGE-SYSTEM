/**
 * WCC Finance Management & Accounting System
 * Activities & Financial Statement Module
 */

class ActivitiesModule {
  constructor() {
    this.typeFilter = 'all';
    this.searchQuery = '';
  }

  render() {
    const container = document.getElementById('activities-grid');
    if (!container) return;

    let list = [...window.store.data.activities];

    if (this.typeFilter !== 'all') {
      list = list.filter(a => a.type.toLowerCase() === this.typeFilter.toLowerCase());
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(a => 
        (a.name && a.name.toLowerCase().includes(q)) ||
        (a.id && a.id.toLowerCase().includes(q)) ||
        (a.location && a.location.toLowerCase().includes(q)) ||
        (a.responsiblePerson && a.responsiblePerson.toLowerCase().includes(q))
      );
    }

    if (list.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1;" class="text-center py-5">
          <div class="empty-state">
            <div class="empty-state-icon">🎯</div>
            <div class="empty-state-title">No activities found</div>
            <div class="empty-state-desc">Create your first event, health camp, program, or meeting.</div>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(act => {
      // Calculate dynamic actual expenses
      const expenses = window.store.data.expenses.filter(e => e.activityId === act.id);
      const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const budget = Number(act.budget || 0);
      const utilization = budget > 0 ? ((totalExpense / budget) * 100).toFixed(1) : 0;
      const isCompleted = act.status === 'Completed';

      let progressColorClass = 'progress-bar-fill';
      if (utilization > 100) progressColorClass += ' danger';
      else if (utilization > 85) progressColorClass += ' warning';
      else progressColorClass += ' success';

      return `
        <div class="card" style="display:flex; flex-direction:column; justify-content:space-between;">
          <div class="card-body">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
              <div>
                <span class="code-pill">${window.escapeHTML(act.id)}</span>
                <span class="badge ${isCompleted ? 'badge-completed' : 'badge-active'}" style="margin-left:6px;">${window.escapeHTML(act.status)}</span>
              </div>
              <span class="badge badge-draft">${window.escapeHTML(act.type)}</span>
            </div>

            <h3 style="font-size:16px; font-weight:700; margin-bottom:6px; color:var(--text-primary);">
              ${window.escapeHTML(act.name)}
            </h3>
            
            <p style="font-size:12.5px; color:var(--text-secondary); margin-bottom:14px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
              ${window.escapeHTML(act.description || 'No description provided.')}
            </p>

            <div style="font-size:12px; color:var(--text-tertiary); display:flex; flex-direction:column; gap:4px; margin-bottom:16px;">
              <div>📍 <strong>Location:</strong> ${window.escapeHTML(act.location || 'Dhaka')}</div>
              <div>👤 <strong>Lead:</strong> ${window.escapeHTML(act.responsiblePerson || 'WCC Team')}</div>
              <div>🗓️ <strong>Date:</strong> ${window.UI.formatDate(act.startDate)}</div>
            </div>

            <div class="progress-container">
              <div style="display:flex; justify-content:space-between; font-size:12px;">
                <span style="color:var(--text-tertiary);">Expense vs Budget</span>
                <strong style="color:var(--text-primary);">${utilization}%</strong>
              </div>
              <div class="progress-bar-track">
                <div class="${progressColorClass}" style="width: ${Math.min(utilization, 100)}%;"></div>
              </div>
              <div style="display:flex; justify-content:space-between; font-size:12px; margin-top:2px;">
                <span style="font-weight:700; color:var(--primary);">${window.UI.formatMoney(totalExpense)}</span>
                <span style="color:var(--text-tertiary);">Budget: ${window.UI.formatMoney(budget)}</span>
              </div>
            </div>
          </div>

          <div class="card-footer" style="display:flex; gap:8px; justify-content:space-between; flex-wrap:wrap;">
            <button class="btn btn-outline btn-sm" style="flex:1;" onclick="window.activitiesModule.viewStatement('${window.escapeHTML(act.id)}')">
              📄 View Statement
            </button>
            ${window.auth && window.auth.canEditFinance() ? `
              <button class="btn btn-outline btn-sm" onclick="window.activitiesModule.openEditModal('${window.escapeHTML(act.id)}')" title="Edit Activity">
                ✏️ Edit
              </button>
            ` : ''}
            ${!isCompleted ? `
              <button class="btn btn-subtle btn-sm" onclick="window.activitiesModule.initCloseActivityModal('${window.escapeHTML(act.id)}')" title="Close Activity">
                🔒 Close
              </button>
            ` : `
              <button class="btn btn-subtle btn-sm" disabled title="Activity is completed">
                ✓ Closed
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');
  }

  viewStatement(activityId) {
    window.store.activeActivityId = activityId;
    window.UI.navigateTo('activity-statement', { activityId });
  }

  /**
   * Render Complete Activity Financial Statement
   */
  renderStatement(activityId) {
    const summary = window.store.getActivityFinancialSummary(activityId);
    const container = document.getElementById('activity-statement-container');
    if (!summary || !container) return;

    const { activity, budget, totalExpense, remaining, utilization, expenses, reimbursements, categoryBreakdown, paymentMethodBreakdown } = summary;

    container.innerHTML = `
      <div class="statement-header-banner">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px;">
          <div>
            <div style="display:flex; gap:8px; align-items:center; margin-bottom:8px;">
              <span class="code-pill" style="background:rgba(255,255,255,0.2); color:#fff;">${window.escapeHTML(activity.id)}</span>
              <span class="badge ${activity.status === 'Completed' ? 'badge-completed' : 'badge-active'}">${window.escapeHTML(activity.status)}</span>
              <span class="badge" style="background:rgba(241,173,26,0.3); color:#F1AD1A;">${window.escapeHTML(activity.type)}</span>
            </div>
            <h1 style="font-size:24px; font-weight:800; color:#fff; margin-bottom:6px;">${window.escapeHTML(activity.name)}</h1>
            <p style="font-size:13.5px; opacity:0.85; max-width:700px;">${window.escapeHTML(activity.description || '')}</p>
            <div style="font-size:12px; opacity:0.75; margin-top:8px;">
              📍 ${window.escapeHTML(activity.location)} &bull; 👤 Lead: ${window.escapeHTML(activity.responsiblePerson)} &bull; 🗓️ Date: ${window.UI.formatDate(activity.startDate)}
            </div>
          </div>

          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button class="btn btn-accent btn-sm" onclick="window.reportsModule.exportActivityPDF('${window.escapeHTML(activity.id)}')">
              📥 Export PDF Report
            </button>
            <button class="btn btn-outline btn-sm" style="background:rgba(255,255,255,0.15); color:#fff; border-color:rgba(255,255,255,0.3);" onclick="window.reportsModule.exportActivityExcel('${window.escapeHTML(activity.id)}')">
              📊 Export Excel/CSV
            </button>
          </div>
        </div>

        <div class="statement-kpi-row">
          <div class="statement-kpi-item">
            <div class="label">Approved Budget</div>
            <div class="val">${window.UI.formatMoney(budget)}</div>
          </div>
          <div class="statement-kpi-item">
            <div class="label">Total Expense Incurred</div>
            <div class="val" style="color:#FF8A95;">${window.UI.formatMoney(totalExpense)}</div>
          </div>
          <div class="statement-kpi-item">
            <div class="label">Remaining Balance</div>
            <div class="val" style="color:#72E2AE;">${window.UI.formatMoney(remaining)}</div>
          </div>
          <div class="statement-kpi-item">
            <div class="label">Budget Utilization</div>
            <div class="val">${utilization}%</div>
          </div>
          <div class="statement-kpi-item">
            <div class="label">Total Transactions</div>
            <div class="val">${expenses.length}</div>
          </div>
        </div>
      </div>

      <!-- Two-column summary breakdown -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:20px; margin-bottom:24px;">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Category-wise Expenditure</h3>
          </div>
          <div class="card-body">
            <div style="display:flex; flex-direction:column; gap:12px;">
              ${Object.entries(categoryBreakdown).map(([cat, amt]) => {
                const pct = totalExpense > 0 ? ((amt / totalExpense) * 100).toFixed(1) : 0;
                return `
                  <div>
                    <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:4px;">
                      <span style="font-weight:600;">${window.escapeHTML(cat)}</span>
                      <span>${window.UI.formatMoney(amt)} (${pct}%)</span>
                    </div>
                    <div class="progress-bar-track" style="height:6px;">
                      <div class="progress-bar-fill" style="width:${pct}%;"></div>
                    </div>
                  </div>
                `;
              }).join('') || '<div class="text-muted">No expense categories</div>'}
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Payment Method & Disbursal Channels</h3>
          </div>
          <div class="card-body">
            <div style="display:flex; flex-direction:column; gap:12px;">
              ${Object.entries(paymentMethodBreakdown).map(([method, amt]) => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:var(--bg-surface-secondary); border-radius:var(--radius-md);">
                  <span style="font-weight:600;">💳 ${window.escapeHTML(method)}</span>
                  <span style="font-weight:700; font-family:var(--font-mono);">${window.UI.formatMoney(amt)}</span>
                </div>
              `).join('') || '<div class="text-muted">No payment channels recorded</div>'}
            </div>
          </div>
        </div>
      </div>

      <!-- Detailed Expenses Statement Table -->
      <div class="card mb-4">
        <div class="card-header">
          <h3 class="card-title">Detailed Itemized Expense Ledger</h3>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>SL</th>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Paid By / Vendor</th>
                <th>Payment Method</th>
                <th>Amount</th>
                <th>Voucher / Doc</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${expenses.map((exp, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${window.UI.formatDate(exp.date)}</td>
                  <td><span class="code-pill">${window.escapeHTML(exp.category)}</span></td>
                  <td style="max-width:240px;">${window.escapeHTML(exp.description)}</td>
                  <td>${window.escapeHTML(exp.paidBy || exp.vendorOrMember)}</td>
                  <td>${window.escapeHTML(exp.paymentMethod)}</td>
                  <td style="font-weight:700; color:var(--primary); font-family:var(--font-mono);">${window.UI.formatMoney(exp.amount)}</td>
                  <td>
                    ${exp.attachmentUrl ? `
                      <a href="${window.escapeHTML(exp.attachmentUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm" style="padding:2px 8px; font-size:11px;">
                        📎 View
                      </a>
                    ` : '<span style="color:var(--text-quaternary); font-size:12px;">None</span>'}
                  </td>
                  <td>${window.UI.getStatusBadge(exp.status)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Member Reimbursements Linked Section -->
      <div class="card mb-4">
        <div class="card-header">
          <h3 class="card-title">Linked Member Personal Expenses & Reimbursements</h3>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Reimbursement ID</th>
                <th>Member Name</th>
                <th>Original Expense Item</th>
                <th>Amount</th>
                <th>Request Date</th>
                <th>Approval Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${reimbursements.length > 0 ? reimbursements.map(r => `
                <tr>
                  <td><span class="code-pill">${window.escapeHTML(r.id)}</span></td>
                  <td><strong>${window.escapeHTML(r.memberName)}</strong></td>
                  <td>${window.escapeHTML(r.description)}</td>
                  <td style="font-weight:700; color:var(--gold-dark);">${window.UI.formatMoney(r.amount)}</td>
                  <td>${window.UI.formatDate(r.requestDate)}</td>
                  <td>${window.UI.getStatusBadge(r.approvalStatus)}</td>
                  <td>
                    ${r.approvalStatus !== 'Paid' ? `
                      <button class="btn btn-primary btn-sm" onclick="window.reimbursementsModule.initPayModal('${window.escapeHTML(r.id)}')">
                        Disburse
                      </button>
                    ` : '<span style="color:var(--success); font-weight:600; font-size:12px;">✓ Reimbursed</span>'}
                  </td>
                </tr>
              `).join('') : `
                <tr><td colspan="7" class="text-center py-4 text-muted">No personal member reimbursement claims for this activity.</td></tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  /**
   * Activity Closing Pre-Flight Validation Wizard
   */
  initCloseActivityModal(activityId) {
    const summary = window.store.getActivityFinancialSummary(activityId);
    if (!summary) return;

    const modalBody = document.getElementById('modal-close-activity-body');
    if (!modalBody) return;

    const { activity, budget, totalExpense, pendingReimbursementsCount, unsettledAdvancesCount, canClose } = summary;

    modalBody.innerHTML = `
      <div style="margin-bottom:16px;">
        <h4 style="font-weight:700; margin-bottom:4px;">${window.escapeHTML(activity.name)}</h4>
        <div style="font-size:12px; color:var(--text-tertiary);">Activity ID: ${window.escapeHTML(activity.id)}</div>
      </div>

      <div style="background:var(--bg-surface-secondary); padding:16px; border-radius:var(--radius-md); margin-bottom:20px;">
        <div style="font-size:13px; font-weight:600; margin-bottom:10px;">Pre-Closing Validation Checklist:</div>
        <ul style="list-style:none; display:flex; flex-direction:column; gap:8px; font-size:13px;">
          <li style="display:flex; align-items:center; gap:8px;">
            ${pendingReimbursementsCount === 0 ? '✅' : '❌'}
            <span>Pending Member Reimbursements: <strong>${pendingReimbursementsCount}</strong></span>
          </li>
          <li style="display:flex; align-items:center; gap:8px;">
            ${unsettledAdvancesCount === 0 ? '✅' : '❌'}
            <span>Unsettled Member Advances: <strong>${unsettledAdvancesCount}</strong></span>
          </li>
          <li style="display:flex; align-items:center; gap:8px;">
            ${totalExpense <= budget ? '✅' : '⚠️'}
            <span>Budget Compliance: Total Expense ${window.UI.formatMoney(totalExpense)} of Budget ${window.UI.formatMoney(budget)}</span>
          </li>
        </ul>
      </div>

      ${!canClose ? `
        <div class="alert" style="background:var(--danger-light); color:var(--danger); padding:12px; border-radius:var(--radius-md); font-size:13px;">
          ⚠️ <strong>Cannot Close Activity:</strong> You have pending reimbursements or unsettled advances. Please resolve them before closing.
        </div>
      ` : `
        <div class="alert" style="background:var(--success-light); color:var(--success-hover); padding:12px; border-radius:var(--radius-md); font-size:13px;">
          ✓ All financial records verified. Once closed, standard edits will be locked.
        </div>
      `}

      <input type="hidden" id="close-activity-target-id" value="${activity.id}">
    `;

    const confirmBtn = document.getElementById('btn-confirm-close-activity');
    if (confirmBtn) {
      confirmBtn.disabled = !canClose;
    }

    window.UI.openModal('modal-close-activity');
  }

  async executeCloseActivity() {
    const actId = document.getElementById('close-activity-target-id')?.value;
    if (!actId) return;

    const confirmBtn = document.getElementById('btn-confirm-close-activity');
    if (window.UI.setButtonLoading(confirmBtn, true, 'Closing...') === false) return;

    try {
      await window.api.request('closeActivity', { activityId: actId });
      window.UI.closeModal('modal-close-activity');
      window.UI.showToast('Activity successfully marked as Completed and locked.', 'success');
      this.render();
      window.dashboardModule?.render();
      if (window.app && window.app.populateSelectDropdowns) {
        window.app.populateSelectDropdowns();
      }
    } catch (err) {
      window.UI.showToast(`Error closing activity: ${err.message}`, 'error');
    } finally {
      window.UI.setButtonLoading(confirmBtn, false);
    }
  }

  async handleFormSubmit(event) {
    event.preventDefault();
    const form = event.target;

    const name = (form.name ? form.name.value : '').trim();
    if (!name) {
      window.UI.showToast('Please enter an activity name.', 'warning');
      return;
    }

    const startDate = form.startDate ? form.startDate.value : '';
    const endDate = form.endDate ? form.endDate.value : '';
    if (startDate && endDate && endDate < startDate) {
      window.UI.showToast('End Date cannot be earlier than Start Date.', 'warning');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('.btn-primary');
    if (window.UI.setButtonLoading(submitBtn, true, 'Creating Activity...') === false) {
      return;
    }

    const budgetVal = parseFloat(form.budget ? form.budget.value : 0) || 0;
    if (isNaN(budgetVal) || budgetVal < 0 || !Number.isFinite(budgetVal) || budgetVal > 1000000000) {
      window.UI.showToast('Please enter a valid budget amount (Max ৳1,000,000,000).', 'warning');
      return;
    }

    const payload = {
      name: name,
      type: form.type.value,
      startDate: startDate,
      endDate: endDate,
      location: form.location ? form.location.value.trim() : 'Dhaka',
      description: form.description ? form.description.value.trim() : '',
      budget: budgetVal,
      responsiblePerson: form.responsiblePerson ? form.responsiblePerson.value.trim() : '',
      notes: form.notes ? form.notes.value.trim() : ''
    };

    try {
      await window.api.request('createActivity', payload);
      window.UI.closeModal('modal-add-activity');
      window.UI.showToast(`Activity "${payload.name}" created successfully!`, 'success');
      form.reset();
      this.render();
      window.dashboardModule?.render();
      if (window.app && window.app.populateSelectDropdowns) {
        window.app.populateSelectDropdowns();
      }
    } catch (err) {
      window.UI.showToast(`Failed to create activity: ${err.message}`, 'error');
    } finally {
      window.UI.setButtonLoading(submitBtn, false);
    }
  }

  openEditModal(activityId) {
    if (!window.auth || !window.auth.canEditFinance()) {
      window.UI.showToast('You do not have permission to edit financial activities.', 'warning');
      return;
    }

    const act = (window.store.data.activities || []).find(a => a.id === activityId);
    if (!act) {
      window.UI.showToast('Activity record not found: ' + activityId, 'error');
      return;
    }

    document.getElementById('edit-act-id').value = act.id;
    const displayEl = document.getElementById('edit-act-id-display');
    if (displayEl) displayEl.textContent = act.id;

    document.getElementById('edit-act-name').value = act.name || '';
    document.getElementById('edit-act-type').value = act.type || 'Event';
    document.getElementById('edit-act-budget').value = act.budget || 0;
    document.getElementById('edit-act-start-date').value = act.startDate ? act.startDate.substring(0, 10) : '';
    document.getElementById('edit-act-end-date').value = act.endDate ? act.endDate.substring(0, 10) : '';
    document.getElementById('edit-act-location').value = act.location || '';
    document.getElementById('edit-act-lead').value = act.responsiblePerson || '';
    document.getElementById('edit-act-description').value = act.description || '';
    document.getElementById('edit-act-notes').value = act.notes || '';

    window.UI.openModal('modal-edit-activity');
  }

  async handleEditSubmit(event) {
    event.preventDefault();
    if (!window.auth || !window.auth.canEditFinance()) {
      window.UI.showToast('Permission denied: Only Admin and Finance Officer can edit activities.', 'error');
      return;
    }

    const form = event.target;
    const activityId = form.activityId.value;
    const name = form.name.value.trim();
    const startDate = form.startDate.value;
    const endDate = form.endDate.value;

    if (!name) {
      window.UI.showToast('Activity name is required.', 'warning');
      return;
    }

    const budgetVal = parseFloat(form.budget ? form.budget.value : 0) || 0;
    if (isNaN(budgetVal) || budgetVal < 0 || !Number.isFinite(budgetVal) || budgetVal > 1000000000) {
      window.UI.showToast('Please enter a valid budget amount (Max ৳1,000,000,000).', 'warning');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('.btn-primary');
    if (window.UI.setButtonLoading(submitBtn, true, 'Saving Changes...') === false) {
      return;
    }

    const payload = {
      activityId: activityId,
      name: name,
      type: form.type.value,
      startDate: startDate,
      endDate: endDate,
      location: form.location ? form.location.value.trim() : 'Dhaka',
      description: form.description ? form.description.value.trim() : '',
      budget: budgetVal,
      responsiblePerson: form.responsiblePerson ? form.responsiblePerson.value.trim() : '',
      notes: form.notes ? form.notes.value.trim() : ''
    };

    try {
      await window.api.request('updateActivity', payload);
      window.UI.closeModal('modal-edit-activity');
      window.UI.showToast(`Activity "${payload.name}" updated successfully!`, 'success');
      this.render();
      window.dashboardModule?.render();
      if (window.app && window.app.populateSelectDropdowns) {
        window.app.populateSelectDropdowns();
      }
    } catch (err) {
      window.UI.showToast(`Failed to update activity: ${err.message}`, 'error');
    } finally {
      window.UI.setButtonLoading(submitBtn, false);
    }
  }
}

window.activitiesModule = new ActivitiesModule();
