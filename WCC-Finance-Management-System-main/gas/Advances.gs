/**
 * WCC Finance Management & Accounting System
 * Google Apps Script - Advances & Settlement Logic
 */

function gasCreateAdvance(payload, user) {
  var advAmount = Number(payload.advanceAmount);
  if (isNaN(advAmount) || advAmount <= 0 || !isFinite(advAmount) || advAmount > 100000000) {
    throw new Error('Invalid advance amount: must be a positive number up to ৳100,000,000');
  }

  var advId = generateUniqueId('WCC-ADV', GAS_CONFIG.SHEETS.ADVANCES);
  var now = payload.disbursementDate || new Date().toISOString().substring(0, 10);

  var advRow = [
    advId,
    payload.memberId,
    payload.memberName,
    payload.activityId,
    payload.activityName,
    payload.purpose,
    advAmount,
    now,
    payload.paymentMethod,
    payload.accountId || '',
    payload.accountName || '',
    payload.paymentReference || '',
    'Issued',
    0,
    0,
    '',
    '',
    user ? user.name : 'System',
    payload.notes || ''
  ];
  appendSheetRow(GAS_CONFIG.SHEETS.ADVANCES, advRow);

  gasLogAudit(user, 'Issue Advance', 'Advances', advId, 'Issued ৳' + advAmount + ' advance to ' + payload.memberName);

  return {
    id: advId,
    advanceId: advId,
    memberId: payload.memberId,
    memberName: payload.memberName,
    activityId: payload.activityId,
    activityName: payload.activityName,
    purpose: payload.purpose,
    advanceAmount: advAmount,
    disbursementDate: now,
    paymentMethod: payload.paymentMethod,
    accountId: payload.accountId || '',
    accountName: payload.accountName || '',
    paymentReference: payload.paymentReference || '',
    status: 'Issued',
    actualExpenseSubmitted: 0,
    settlementBalance: 0,
    approvedBy: user ? user.name : 'System',
    notes: payload.notes || ''
  };
}

function gasSettleAdvance(payload, user) {
  var advSheet = getSheet(GAS_CONFIG.SHEETS.ADVANCES);
  var advData = advSheet.getDataRange().getValues();
  var advId = payload.advanceId;
  var foundRow = -1;
  var origAdvanceAmount = 0;
  var memberName = '';
  var memberId = '';
  var activityId = '';
  var activityName = '';

  for (var i = 1; i < advData.length; i++) {
    if (advData[i][0] === advId) {
      foundRow = i + 1;
      memberId = advData[i][1];
      memberName = advData[i][2];
      activityId = advData[i][3];
      activityName = advData[i][4];
      origAdvanceAmount = Number(advData[i][6]);
      break;
    }
  }

  if (foundRow === -1) throw new Error('Advance ID not found: ' + advId);

  var actualExpense = Number(payload.actualExpense);
  if (isNaN(actualExpense) || actualExpense < 0 || !isFinite(actualExpense) || actualExpense > 100000000) {
    throw new Error('Invalid actual expense amount: must be a non-negative number up to ৳100,000,000');
  }
  var diff = origAdvanceAmount - actualExpense;
  var setId = generateUniqueId('WCC-SET', GAS_CONFIG.SHEETS.ADVANCE_SETTLEMENTS);
  var now = payload.settlementDate || new Date().toISOString().substring(0, 10);

  var settlementAction = diff >= 0 ? 'Refund Received (৳' + diff + ')' : 'Additional Reimbursement (৳' + Math.abs(diff) + ')';

  // Record Settlement Row
  var setRow = [
    setId,
    advId,
    memberId,
    memberName,
    activityId,
    activityName,
    origAdvanceAmount,
    actualExpense,
    Math.abs(diff),
    settlementAction,
    payload.refundAccountId || '',
    payload.refundAccountName || '',
    now,
    payload.expenseIdList || '',
    'Closed',
    user ? user.name : 'System',
    payload.notes || ''
  ];
  appendSheetRow(GAS_CONFIG.SHEETS.ADVANCE_SETTLEMENTS, setRow);

  // Update Advance record: Status (Col 13), Actual Expense (Col 14), Balance (Col 15), Settlement Type (Col 16), Settlement ID (Col 17)
  advSheet.getRange(foundRow, 13).setValue('Settled');
  advSheet.getRange(foundRow, 14).setValue(actualExpense);
  advSheet.getRange(foundRow, 15).setValue(Math.abs(diff));
  advSheet.getRange(foundRow, 16).setValue(diff >= 0 ? 'Refund Received' : 'Additional Reimbursement');
  advSheet.getRange(foundRow, 17).setValue(setId);

  gasLogAudit(user, 'Settle Advance', 'Advances', advId, 'Settled advance for ' + memberName + ': Spent ৳' + actualExpense + ', ' + settlementAction);

  return {
    id: setId,
    settlementId: setId,
    advanceId: advId,
    memberId: memberId,
    memberName: memberName,
    activityId: activityId,
    activityName: activityName,
    advanceAmount: origAdvanceAmount,
    actualExpense: actualExpense,
    variance: Math.abs(diff),
    settlementAction: settlementAction,
    refundAccountId: payload.refundAccountId || '',
    refundAccountName: payload.refundAccountName || '',
    settlementDate: now,
    supportingExpensesList: payload.expenseIdList || '',
    status: 'Closed',
    settledBy: user ? user.name : 'System',
    notes: payload.notes || ''
  };
}

function gasUpdateAdvance(payload, user) {
  var advanceId = payload.advanceId || payload.id;
  if (!advanceId) throw new Error('Advance ID is required for update.');

  var advAmount = Number(payload.advanceAmount);
  if (isNaN(advAmount) || advAmount <= 0 || !isFinite(advAmount) || advAmount > 100000000) {
    throw new Error('Invalid advance amount: must be a positive number up to ৳100,000,000');
  }

  var advSheet = getSheet(GAS_CONFIG.SHEETS.ADVANCES);
  var advData = advSheet.getDataRange().getValues();
  var foundRow = -1;

  for (var i = 1; i < advData.length; i++) {
    if (advData[i][0] === advanceId) {
      foundRow = i + 1;
      break;
    }
  }

  if (foundRow === -1) throw new Error('Advance record not found with ID: ' + advanceId);

  advSheet.getRange(foundRow, 2).setValue(payload.memberId);
  advSheet.getRange(foundRow, 3).setValue(payload.memberName);
  advSheet.getRange(foundRow, 4).setValue(payload.activityId);
  advSheet.getRange(foundRow, 5).setValue(payload.activityName);
  advSheet.getRange(foundRow, 6).setValue(payload.purpose);
  advSheet.getRange(foundRow, 7).setValue(advAmount);
  advSheet.getRange(foundRow, 8).setValue(payload.disbursementDate);
  advSheet.getRange(foundRow, 9).setValue(payload.paymentMethod);
  advSheet.getRange(foundRow, 10).setValue(payload.accountId || '');
  advSheet.getRange(foundRow, 11).setValue(payload.accountName || '');
  if (payload.paymentReference !== undefined) advSheet.getRange(foundRow, 12).setValue(payload.paymentReference);
  if (payload.notes !== undefined) advSheet.getRange(foundRow, 19).setValue(payload.notes);

  gasLogAudit(user, 'Update Advance', 'Advances', advanceId, 'Updated advance for ' + payload.memberName + ': ৳' + advAmount);

  return {
    success: true,
    id: advanceId,
    advanceAmount: advAmount,
    memberName: payload.memberName
  };
}
