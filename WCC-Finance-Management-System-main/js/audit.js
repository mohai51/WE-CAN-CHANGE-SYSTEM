/**
 * WCC Finance Management & Accounting System
 * Audit Trail & Immutable Log Module
 */

class AuditModule {
  render() {
    const container = document.getElementById('audit-table-body');
    if (!container) return;

    const list = window.store.data.auditLogs || [];
    container.innerHTML = list.map(log => `
      <tr>
        <td><span class="code-pill">${window.escapeHTML(log.id)}</span></td>
        <td style="white-space:nowrap; font-size:12px; color:var(--text-tertiary);">${window.escapeHTML(log.timestamp)}</td>
        <td>
          <div style="font-weight:600;">${window.escapeHTML(log.user)}</div>
          <div style="font-size:11px; color:var(--text-tertiary);">${window.escapeHTML(log.role)}</div>
        </td>
        <td><span class="badge badge-draft">${window.escapeHTML(log.action)}</span></td>
        <td><span class="badge badge-submitted">${window.escapeHTML(log.module)}</span></td>
        <td><span class="code-pill">${window.escapeHTML(log.recordId)}</span></td>
        <td style="font-size:12.5px; color:var(--text-secondary);">${window.escapeHTML(log.details)}</td>
      </tr>
    `).join('');
  }
}

window.auditModule = new AuditModule();
