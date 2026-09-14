/**
 * WCC Finance Management & Accounting System
 * Vendors & Suppliers Module
 */

class VendorsModule {
  render() {
    const container = document.getElementById('vendors-table-body');
    if (!container) return;

    const list = window.store.data.vendors || [];

    if (list.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-5">
            <div class="empty-state">
              <div class="empty-state-icon">🏢</div>
              <div class="empty-state-title">No vendors registered yet</div>
              <div class="empty-state-desc">Register pharmaceutical suppliers, printing presses, caterers, and service partners.</div>
              <button class="btn btn-primary btn-sm" onclick="window.UI.openModal('modal-add-vendor')" style="margin-top:12px;">
                + Add First Vendor
              </button>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    container.innerHTML = list.map(v => `
      <tr>
        <td><span class="code-pill">${window.escapeHTML(v.id)}</span></td>
        <td><strong>${window.escapeHTML(v.name)}</strong></td>
        <td><span class="badge badge-draft">${window.escapeHTML(v.serviceType)}</span></td>
        <td>${window.escapeHTML(v.contactPerson || '-')} (${window.escapeHTML(v.phone || '-')})</td>
        <td>${window.escapeHTML(v.address || '-')}</td>
        <td style="font-weight:700; color:var(--text-primary); font-family:var(--font-mono);">
          ${window.UI.formatMoney(v.totalTransactions)}
        </td>
        <td>
          ${v.outstanding > 0 ? `<span class="badge badge-pending">Due: ${window.UI.formatMoney(v.outstanding)}</span>` : '<span class="badge badge-paid">Cleared</span>'}
        </td>
      </tr>
    `).join('');
  }

  async handleFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('.btn-primary');

    const outstandingVal = parseFloat(form.outstanding?.value || 0) || 0;
    if (isNaN(outstandingVal) || outstandingVal < 0 || !Number.isFinite(outstandingVal) || outstandingVal > 1000000000) {
      window.UI.showToast('Please enter a valid outstanding balance.', 'warning');
      return;
    }

    if (window.UI.setButtonLoading(submitBtn, true, 'Saving Vendor...') === false) {
      return; // Already in-flight
    }

    const payload = {
      name: form.name.value.trim(),
      serviceType: form.serviceType.value.trim(),
      contactPerson: form.contactPerson.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      address: form.address.value.trim(),
      outstanding: outstandingVal,
      notes: form.notes?.value.trim() || ''
    };

    try {
      await window.api.request('createVendor', payload);
      window.UI.closeModal('modal-add-vendor');
      window.UI.showToast(`Vendor "${payload.name}" added successfully!`, 'success');
      form.reset();
      this.render();
      if (window.app && window.app.populateSelectDropdowns) {
        window.app.populateSelectDropdowns();
      }
    } catch (err) {
      window.UI.showToast(`Failed to add vendor: ${err.message}`, 'error');
    } finally {
      window.UI.setButtonLoading(submitBtn, false);
    }
  }
}

window.vendorsModule = new VendorsModule();
