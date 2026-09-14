/**
 * WCC Finance Management & Accounting System
 * Google Apps Script - Immutable Audit Trail Logger
 */

function gasLogAudit(user, action, module, recordId, details) {
  try {
    var logId = generateUniqueId('WCC-LOG', GAS_CONFIG.SHEETS.AUDIT_LOG);
    var now = new Date().toISOString().substring(0, 19).replace('T', ' ');

    var row = [
      logId,
      now,
      user ? user.name : 'System User',
      user ? user.role : 'Admin',
      action,
      module,
      recordId,
      details
    ];

    appendSheetRow(GAS_CONFIG.SHEETS.AUDIT_LOG, row);
  } catch (err) {
    Logger.log('Failed to write audit log: ' + err.message);
  }
}
