/**
 * WCC Finance Management & Accounting System
 * Users & RBAC Permissions Management Module
 * (Main Admin edits user details, manages roles, and resolves password reset requests)
 */

class UsersModule {
  constructor() {
    this.activeTab = 'users'; // 'users' or 'requests'
  }

  render() {
    this.renderUsersTable();
    this.renderResetRequestsTable();
    this.updatePendingCountBadge();
  }

  setTab(tabName) {
    this.activeTab = tabName;
    const usersTab = document.getElementById('users-tab-content');
    const reqsTab = document.getElementById('requests-tab-content');
    const btnUsers = document.getElementById('btn-tab-users');
    const btnReqs = document.getElementById('btn-tab-requests');

    if (tabName === 'users') {
      if (usersTab) usersTab.style.display = 'block';
      if (reqsTab) reqsTab.style.display = 'none';
      btnUsers?.classList.add('active');
      btnReqs?.classList.remove('active');
    } else {
      if (usersTab) usersTab.style.display = 'none';
      if (reqsTab) reqsTab.style.display = 'block';
      btnUsers?.classList.remove('active');
      btnReqs?.classList.add('active');
    }
  }

  updatePendingCountBadge() {
    const requests = window.store.data.passwordResetRequests || [];
    const pending = requests.filter(r => r.status === 'Pending').length;
    const badge = document.getElementById('badge-pending-reset-count');
    if (badge) {
      badge.textContent = pending;
      badge.style.display = pending > 0 ? 'inline-flex' : 'none';
    }
  }

  renderUsersTable() {
    const container = document.getElementById('users-table-body');
    if (!container) return;

    const list = window.store.data.users || [];
    const currentUser = window.auth.getCurrentUser();
    const isAdmin = currentUser && currentUser.role === 'Admin';

    if (list.length === 0) {
      container.innerHTML = `
        <tr><td colspan="7" class="text-center py-4 text-muted">No user accounts found.</td></tr>
      `;
      return;
    }

    container.innerHTML = list.map(u => {
      const isSelf = currentUser && currentUser.id === u.id;
      return `
        <tr>
          <td><span class="code-pill">${window.escapeHTML(u.id)}</span></td>
          <td>
            <div style="display:flex; align-items:center; gap:10px;">
              <div class="user-avatar" style="width:32px; height:32px; font-size:12px;">${window.escapeHTML(u.avatar || u.name.substring(0, 2).toUpperCase())}</div>
              <div>
                <strong>${window.escapeHTML(u.name)}</strong> ${isSelf ? '<span class="badge badge-verified" style="font-size:10px;">You</span>' : ''}
              </div>
            </div>
          </td>
          <td>${window.escapeHTML(u.email)}</td>
          <td>
            <span class="badge ${u.role === 'Admin' ? 'badge-completed' : (u.role.includes('Manager') ? 'badge-approved' : 'badge-draft')}">
              ${window.escapeHTML(u.role)}
            </span>
          </td>
          <td>${window.escapeHTML(u.phone || '-')}</td>
          <td>${u.status === 'Active' ? '<span class="badge badge-paid">Active</span>' : '<span class="badge badge-rejected">Inactive</span>'}</td>
          <td class="actions-cell">
            ${isAdmin ? `
              <div style="display:flex; gap:6px; justify-content:flex-end;">
                <button class="btn btn-outline btn-sm" onclick="window.usersModule.initEditModal('${window.escapeHTML(u.id)}')" title="Edit User">
                  ✏️ Edit
                </button>
                ${!isSelf ? `
                  <button class="btn btn-subtle btn-sm" style="color:var(--danger);" onclick="window.usersModule.deleteUser('${window.escapeHTML(u.id)}', '${window.escapeHTML(u.name)}')" title="Delete User">
                    🗑️
                  </button>
                ` : ''}
              </div>
            ` : '<span style="font-size:12px; color:var(--text-tertiary);">Protected</span>'}
          </td>
        </tr>
      `;
    }).join('');
  }

  renderResetRequestsTable() {
    const container = document.getElementById('password-requests-table-body');
    if (!container) return;

    const list = window.store.data.passwordResetRequests || [];

    if (list.length === 0) {
      container.innerHTML = `
        <tr><td colspan="7" class="text-center py-4 text-muted">No pending password reset requests.</td></tr>
      `;
      return;
    }

    container.innerHTML = list.map(req => {
      const isPending = req.status === 'Pending';
      return `
        <tr>
          <td><span class="code-pill">${window.escapeHTML(req.id)}</span></td>
          <td>${window.UI.formatDate(req.requestDate)}</td>
          <td><strong>${window.escapeHTML(req.userName)}</strong></td>
          <td>${window.escapeHTML(req.email)}</td>
          <td>${window.escapeHTML(req.contactPhone || '-')}</td>
          <td>${isPending ? '<span class="badge badge-pending">Pending Admin Action</span>' : '<span class="badge badge-paid">Resolved / Sent</span>'}</td>
          <td class="actions-cell">
            ${isPending ? `
              <button class="btn btn-primary btn-sm" onclick="window.usersModule.initResolveRequestModal('${window.escapeHTML(req.id)}')">
                🔑 Set Password & Resolve
              </button>
            ` : `<span style="font-size:11.5px; color:var(--text-tertiary);">Resolved by Admin</span>`}
          </td>
        </tr>
      `;
    }).join('');
  }

  // --- Create User ---
  async handleCreateSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('.btn-primary');

    if (window.UI.setButtonLoading(submitBtn, true, 'Creating User...') === false) {
      return;
    }

    const payload = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      password: form.password.value.trim(),
      role: form.role.value,
      phone: form.phone.value.trim()
    };

    const existing = window.store.data.users.find(u => u.email.toLowerCase() === payload.email.toLowerCase());
    if (existing) {
      window.UI.showToast(`A user with email "${payload.email}" already exists!`, 'error');
      window.UI.setButtonLoading(submitBtn, false);
      return;
    }

    try {
      await window.api.request('createUser', payload);
      window.UI.closeModal('modal-add-user');
      window.UI.showToast(`User "${payload.name}" created with role "${payload.role}"!`, 'success');
      form.reset();
      this.render();
      window.auth.updateUIPermissions();
    } catch (err) {
      window.UI.showToast(`Failed to create user: ${err.message}`, 'error');
    } finally {
      window.UI.setButtonLoading(submitBtn, false);
    }
  }

  // --- Edit User ---
  initEditModal(userId) {
    const user = window.store.data.users.find(u => u.id === userId);
    if (!user) return;

    document.getElementById('edit-user-id').value = user.id;
    document.getElementById('edit-user-name').value = user.name;
    document.getElementById('edit-user-email').value = user.email;
    document.getElementById('edit-user-role').value = user.role;
    document.getElementById('edit-user-phone').value = user.phone || '';
    document.getElementById('edit-user-status').value = user.status || 'Active';
    document.getElementById('edit-user-new-password').value = '';

    window.UI.openModal('modal-edit-user');
  }

  async handleEditSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('.btn-primary');

    if (window.UI.setButtonLoading(submitBtn, true, 'Updating User...') === false) {
      return;
    }

    const userId = form.userId.value;
    const payload = {
      userId,
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      role: form.role.value,
      phone: form.phone.value.trim(),
      status: form.status.value,
      newPassword: form.newPassword.value.trim() || null
    };

    try {
      await window.api.request('updateUser', payload);
      window.UI.closeModal('modal-edit-user');
      window.UI.showToast(`User "${payload.name}" updated successfully!`, 'success');
      this.render();
      window.auth.updateUIPermissions();
    } catch (err) {
      window.UI.showToast(`Failed to update user: ${err.message}`, 'error');
    } finally {
      window.UI.setButtonLoading(submitBtn, false);
    }
  }

  async deleteUser(userId, userName) {
    if (!confirm(`Are you sure you want to permanently delete user login for "${userName}"?`)) {
      return;
    }

    try {
      await window.api.request('deleteUser', { userId });
      window.UI.showToast(`User "${userName}" deleted.`, 'info');
      this.render();
      window.auth.updateUIPermissions();
    } catch (err) {
      window.UI.showToast(`Error: ${err.message}`, 'error');
    }
  }

  // --- Forgot Password Workflow ---
  async handleForgotPasswordSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('.btn-primary');

    if (window.UI.setButtonLoading(submitBtn, true, 'Sending Request...') === false) {
      return;
    }

    const email = form.email.value.trim();
    const contactPhone = form.phone.value.trim();
    const message = form.message.value.trim();

    try {
      await window.api.request('requestPasswordReset', { email, contactPhone, message });
      window.UI.closeModal('modal-forgot-password');
      window.UI.showToast('Password reset request sent to Main Admin successfully! Admin will notify you with the new password.', 'success');
      form.reset();
      this.updatePendingCountBadge();
    } catch (err) {
      window.UI.showToast(`Request failed: ${err.message}`, 'error');
    } finally {
      window.UI.setButtonLoading(submitBtn, false);
    }
  }

  initResolveRequestModal(requestId) {
    const req = (window.store.data.passwordResetRequests || []).find(r => r.id === requestId);
    if (!req) return;

    document.getElementById('resolve-req-id').value = req.id;
    document.getElementById('resolve-req-user-name').textContent = req.userName;
    document.getElementById('resolve-req-user-email').textContent = req.email;
    document.getElementById('resolve-req-user-phone').textContent = req.contactPhone || 'N/A';
    document.getElementById('resolve-new-password').value = 'wcc' + Math.floor(1000 + Math.random() * 9000);

    window.UI.openModal('modal-resolve-reset-request');
  }

  async handleResolveRequestSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('.btn-primary');

    if (window.UI.setButtonLoading(submitBtn, true, 'Resetting Password...') === false) {
      return;
    }

    const requestId = form.requestId.value;
    const newPassword = form.newPassword.value.trim();

    try {
      const result = await window.api.request('resolvePasswordReset', { requestId, newPassword });
      window.UI.closeModal('modal-resolve-reset-request');
      
      // Display clear copyable credential card
      alert(`✅ Password Reset Successfully!\n\nUser: ${result.userName} (${result.email})\nNew Password: ${newPassword}\n\nPlease copy this new password and share it with ${result.userName} via SMS/Email/WhatsApp.`);
      
      this.render();
      window.UI.showToast('Password reset resolved and user updated.', 'success');
    } catch (err) {
      window.UI.showToast(`Failed to resolve request: ${err.message}`, 'error');
    } finally {
      window.UI.setButtonLoading(submitBtn, false);
    }
  }
}

window.usersModule = new UsersModule();
