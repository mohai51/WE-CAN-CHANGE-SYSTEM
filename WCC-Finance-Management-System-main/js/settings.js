/**
 * WCC Finance Management & Accounting System
 * Settings & Configuration Module
 */

class SettingsModule {
  render() {
    const apiInput = document.getElementById('settings-gas-url');
    const storedUrl = localStorage.getItem(CONFIG.STORAGE_KEYS.API_URL) || CONFIG.API_URL || window.api?.apiUrl || '';
    if (apiInput) {
      apiInput.value = storedUrl;
    }

    const modeBadge = document.getElementById('settings-mode-status');
    if (modeBadge) {
      const isLive = Boolean(window.store?.isLiveMode && window.api?.apiUrl);
      modeBadge.className = `badge ${isLive ? 'badge-approved' : 'badge-verified'}`;
      modeBadge.textContent = isLive ? '🟢 Connected to Google Apps Script Live' : '🟠 Demo Simulation Mode (Offline/Local)';
    }

    // Populate categories list
    const catListEl = document.getElementById('settings-categories-list');
    if (catListEl) {
      catListEl.innerHTML = (window.store.data.categories || []).map(c => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:var(--bg-surface-secondary); border-radius:var(--radius-sm); font-size:13px;">
          <span>${window.escapeHTML(c.name)}</span>
          <span class="badge ${c.type === 'Expense' ? 'badge-draft' : 'badge-approved'}" style="font-size:10px;">${window.escapeHTML(c.type)}</span>
        </div>
      `).join('');
    }
  }

  async saveGASUrl() {
    const url = document.getElementById('settings-gas-url')?.value.trim();
    const saveBtn = document.getElementById('btn-save-gas-url');
    if (window.UI.setButtonLoading(saveBtn, true, 'Connecting & Syncing...') === false) {
      return;
    }

    try {
      if (!url) {
        window.api.setLiveMode(false, '');
        window.UI.showToast('Switched to Demo Simulation Mode', 'info');
      } else {
        if (!url.startsWith('https://')) {
          window.UI.showToast('Invalid endpoint URL. Google Apps Script Web App URLs must start with https://', 'error');
          return;
        }
        window.api.setLiveMode(true, url);
        window.UI.showToast('Saved Google Apps Script Web App endpoint URL!', 'success');
        // Automatically sync fresh database records from Google Sheets
        await window.api.syncFromCloud();
      }
    } finally {
      window.UI.setButtonLoading(saveBtn, false);
      this.render();
      window.app.updateHeaderStatus();
    }
  }

  async triggerSyncCloud() {
    await window.api.syncFromCloud();
    this.render();
  }

  resetAllDemoData() {
    if (confirm('Are you sure you want to clear all data and start with a fresh clean system? All local transactions will be removed.')) {
      window.store.resetToDemo();
      window.UI.showToast('All transaction data cleared successfully!', 'success');
      window.UI.navigateTo('dashboard');
    }
  }
}

window.settingsModule = new SettingsModule();
