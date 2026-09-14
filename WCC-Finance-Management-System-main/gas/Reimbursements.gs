/**
 * WCC Finance Management & Accounting System
 * Google Apps Script - Reimbursements Logic
 */

function gasDisburseReimbursement(payload, user) {
  var sheet = getSheet(GAS_CONFIG.SHEETS.REIMBURSEMENTS);
  var data = sheet.getDataRange().getValues();
  var reimId = payload.reimbursementId;
  var foundRow = -1;
  var memberName = '';
  var amount = 0;
  var expenseId = '';

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === reimId) {
      foundRow = i + 1;
      memberName = data[i][2];
      expenseId = data[i][3];
      amount = data[i][8];
      break;
    }
  }

  if (foundRow === -1) throw new Error('Reimbursement ID not found: ' + reimId);

  var now = payload.paymentDate || new Date().toISOString().substring(0, 10);

  // Update Reimbursement row: Status (Col 11), Payment Date (Col 12), Payment Method (Col 13), Account ID (Col 14), Reference (Col 15)
  sheet.getRange(foundRow, 11).setValue('Paid');
  sheet.getRange(foundRow, 12).setValue(now);
  sheet.getRange(foundRow, 13).setValue(payload.paymentMethod);
  sheet.getRange(foundRow, 14).setValue(payload.paymentAccountId || '');
  sheet.getRange(foundRow, 15).setValue(payload.paymentReference || '');

  // Also update linked Expense record status to 'Paid'
  if (expenseId) {
    var expSheet = getSheet(GAS_CONFIG.SHEETS.EXPENSES);
    var expData = expSheet.getDataRange().getValues();
    for (var k = 1; k < expData.length; k++) {
      if (expData[k][0] === expenseId) {
        expSheet.getRange(k + 1, 15).setValue('Paid');
        expSheet.getRange(k + 1, 8).setValue(payload.paymentMethod);
        break;
      }
    }
  }

  gasLogAudit(user, 'Disburse Reimbursement', 'Reimbursements', reimId, 'Paid ৳' + amount + ' reimbursement to ' + memberName);

  return {
    id: reimId,
    reimbursementId: reimId,
    expenseId: expenseId,
    memberName: memberName,
    amount: Number(amount),
    status: 'Paid',
    approvalStatus: 'Paid',
    paymentDate: now,
    paymentMethod: payload.paymentMethod,
    paymentAccountId: payload.paymentAccountId || '',
    paymentReference: payload.paymentReference || ''
  };
}

function gasUpdateReimbursement(payload, user) {
  var reimId = payload.reimbursementId || payload.id;
  if (!reimId) throw new Error('Reimbursement ID is required for update.');

  var amount = Number(payload.amount);
  if (isNaN(amount) || amount <= 0 || !isFinite(amount) || amount > 100000000) {
    throw new Error('Invalid reimbursement amount: must be a positive number up to ৳100,000,000');
  }

  var reimSheet = getSheet(GAS_CONFIG.SHEETS.REIMBURSEMENTS);
  var reimData = reimSheet.getDataRange().getValues();
  var foundRow = -1;
  var expenseId = '';

  for (var i = 1; i < reimData.length; i++) {
    if (reimData[i][0] === reimId) {
      foundRow = i + 1;
      expenseId = reimData[i][3];
      break;
    }
  }

  if (foundRow === -1) throw new Error('Reimbursement claim not found: ' + reimId);

  reimSheet.getRange(foundRow, 7).setValue(payload.category);
  reimSheet.getRange(foundRow, 8).setValue(payload.description);
  reimSheet.getRange(foundRow, 9).setValue(amount);
  if (payload.notes !== undefined) reimSheet.getRange(foundRow, 17).setValue(payload.notes);

  // Sync with Expense record if linked
  if (expenseId) {
    var expSheet = getSheet(GAS_CONFIG.SHEETS.EXPENSES);
    var expData = expSheet.getDataRange().getValues();
    for (var k = 1; k < expData.length; k++) {
      if (expData[k][0] === expenseId) {
        expSheet.getRange(k + 1, 5).setValue(payload.category);
        expSheet.getRange(k + 1, 6).setValue(payload.description);
        expSheet.getRange(k + 1, 7).setValue(amount);
        break;
      }
    }
  }

  gasLogAudit(user, 'Update Reimbursement', 'Reimbursements', reimId, 'Updated claim to ৳' + amount);

  return {
    success: true,
    reimbursementId: reimId,
    amount: amount
  };
}
