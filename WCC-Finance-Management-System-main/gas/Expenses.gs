/**
 * WCC Finance Management & Accounting System
 * Google Apps Script - Expense Logic
 */

function gasCreateExpense(payload, user) {
  var amount = Number(payload.amount);
  if (isNaN(amount) || amount <= 0 || !isFinite(amount) || amount > 100000000) {
    throw new Error('Invalid expense amount: must be a positive number up to ৳100,000,000');
  }

  var expId = generateUniqueId('WCC-EXP', GAS_CONFIG.SHEETS.EXPENSES);
  var txnId = generateUniqueId('WCC-TXN', GAS_CONFIG.SHEETS.TRANSACTIONS);
  var now = new Date().toISOString().substring(0, 19).replace('T', ' ');

  var isPersonal = !!payload.isMemberPersonalExpense;
  var status = isPersonal ? 'Pending Reimbursement' : 'Paid';
  var reimId = '';

  // If Member Personal Expense, automatically generate Reimbursement Record
  if (isPersonal) {
    reimId = generateUniqueId('WCC-REIM', GAS_CONFIG.SHEETS.REIMBURSEMENTS);
    var reimRow = [
      reimId,
      payload.memberId || '',
      payload.paidBy || '',
      expId,
      payload.activityId || '',
      payload.activityName || '',
      payload.category || '',
      payload.description || '',
      amount,
      payload.date || now.substring(0, 10),
      'Submitted',
      '',
      'Pending',
      '',
      '',
      payload.attachmentUrl || '',
      'Auto-created from Personal Expense entry'
    ];
    appendSheetRow(GAS_CONFIG.SHEETS.REIMBURSEMENTS, reimRow);
  }

  var expRow = [
    expId,
    payload.date,
    payload.activityId,
    payload.activityName,
    payload.category,
    payload.description,
    amount,
    payload.paymentMethod,
    payload.accountId || '',
    payload.accountName || (isPersonal ? 'Pending Reimbursement' : ''),
    payload.paidBy,
    payload.vendorOrMember || '',
    payload.referenceNumber || '',
    payload.attachmentUrl || '',
    status,
    isPersonal ? 'TRUE' : 'FALSE',
    reimId,
    payload.settledFromAdvanceId || '',
    user ? user.name : 'System',
    now,
    payload.remarks || ''
  ];
  appendSheetRow(GAS_CONFIG.SHEETS.EXPENSES, expRow);

  // Mirror into central Transactions ledger
  var txnRow = [
    txnId,
    payload.date,
    'Expense',
    payload.activityId,
    payload.activityName,
    payload.category,
    payload.description,
    Number(payload.amount),
    payload.paymentMethod,
    payload.accountId || '',
    payload.accountName || (isPersonal ? 'Pending Reimbursement' : ''),
    payload.paidBy,
    '',
    payload.vendorOrMember || '',
    payload.referenceNumber || '',
    status,
    payload.attachmentUrl || '',
    user ? user.name : 'System',
    now
  ];
  appendSheetRow(GAS_CONFIG.SHEETS.TRANSACTIONS, txnRow);

  gasLogAudit(user, 'Create Expense', 'Expenses', expId, 'Recorded expense of ৳' + payload.amount + ' for ' + payload.activityName);

  return {
    id: expId,
    expenseId: expId,
    transactionId: txnId,
    reimbursementId: reimId,
    date: payload.date,
    activityId: payload.activityId,
    activityName: payload.activityName,
    category: payload.category,
    description: payload.description,
    amount: Number(payload.amount),
    paymentMethod: payload.paymentMethod,
    accountId: payload.accountId || null,
    accountName: payload.accountName || (isPersonal ? 'Pending Reimbursement' : ''),
    paidBy: payload.paidBy,
    vendorOrMember: payload.vendorOrMember || '',
    referenceNumber: payload.referenceNumber || '',
    attachmentUrl: payload.attachmentUrl || '',
    status: status,
    isMemberPersonalExpense: isPersonal,
    settledFromAdvanceId: payload.settledFromAdvanceId || '',
    createdBy: user ? user.name : 'System',
    remarks: payload.remarks || ''
  };
}

function gasUpdateExpense(payload, user) {
  var expenseId = payload.expenseId || payload.id;
  if (!expenseId) throw new Error('Expense ID is required for update.');

  var amount = Number(payload.amount);
  if (isNaN(amount) || amount <= 0 || !isFinite(amount) || amount > 100000000) {
    throw new Error('Invalid expense amount: must be a positive number up to ৳100,000,000');
  }

  var expSheet = getSheet(GAS_CONFIG.SHEETS.EXPENSES);
  var expData = expSheet.getDataRange().getValues();
  var foundRow = -1;
  var reimId = '';

  for (var i = 1; i < expData.length; i++) {
    if (expData[i][0] === expenseId) {
      foundRow = i + 1;
      reimId = expData[i][16] || '';
      break;
    }
  }

  if (foundRow === -1) throw new Error('Expense not found with ID: ' + expenseId);

  var isPersonal = !!payload.isMemberPersonalExpense;
  var status = isPersonal ? 'Pending Reimbursement' : 'Paid';

  // Update Expenses Sheet
  expSheet.getRange(foundRow, 2).setValue(payload.date);
  expSheet.getRange(foundRow, 3).setValue(payload.activityId);
  expSheet.getRange(foundRow, 4).setValue(payload.activityName);
  expSheet.getRange(foundRow, 5).setValue(payload.category);
  expSheet.getRange(foundRow, 6).setValue(payload.description);
  expSheet.getRange(foundRow, 7).setValue(amount);
  expSheet.getRange(foundRow, 8).setValue(payload.paymentMethod);
  expSheet.getRange(foundRow, 9).setValue(payload.accountId || '');
  expSheet.getRange(foundRow, 10).setValue(payload.accountName || (isPersonal ? 'Pending Reimbursement' : ''));
  expSheet.getRange(foundRow, 11).setValue(payload.paidBy);
  expSheet.getRange(foundRow, 12).setValue(payload.vendorOrMember || '');
  expSheet.getRange(foundRow, 13).setValue(payload.referenceNumber || '');
  expSheet.getRange(foundRow, 15).setValue(status);
  expSheet.getRange(foundRow, 16).setValue(isPersonal ? 'TRUE' : 'FALSE');
  if (payload.remarks !== undefined) expSheet.getRange(foundRow, 21).setValue(payload.remarks);

  // Sync with Reimbursements Sheet if exists
  if (reimId) {
    var reimSheet = getSheet(GAS_CONFIG.SHEETS.REIMBURSEMENTS);
    var reimData = reimSheet.getDataRange().getValues();
    for (var r = 1; r < reimData.length; r++) {
      if (reimData[r][0] === reimId) {
        reimSheet.getRange(r + 1, 7).setValue(payload.category);
        reimSheet.getRange(r + 1, 8).setValue(payload.description);
        reimSheet.getRange(r + 1, 9).setValue(amount);
        reimSheet.getRange(r + 1, 5).setValue(payload.activityId);
        reimSheet.getRange(r + 1, 6).setValue(payload.activityName);
        break;
      }
    }
  }

  // Sync with Transactions Sheet
  var txnSheet = getSheet(GAS_CONFIG.SHEETS.TRANSACTIONS);
  var txnData = txnSheet.getDataRange().getValues();
  for (var t = 1; t < txnData.length; t++) {
    if (txnData[t][0] === expenseId || (txnData[t][2] === 'Expense' && txnData[t][14] === expData[foundRow - 1][12])) {
      txnSheet.getRange(t + 1, 2).setValue(payload.date);
      txnSheet.getRange(t + 1, 4).setValue(payload.activityId);
      txnSheet.getRange(t + 1, 5).setValue(payload.activityName);
      txnSheet.getRange(t + 1, 6).setValue(payload.category);
      txnSheet.getRange(t + 1, 7).setValue(payload.description);
      txnSheet.getRange(t + 1, 8).setValue(amount);
      txnSheet.getRange(t + 1, 9).setValue(payload.paymentMethod);
      txnSheet.getRange(t + 1, 10).setValue(payload.accountId || '');
      txnSheet.getRange(t + 1, 11).setValue(payload.accountName || (isPersonal ? 'Pending Reimbursement' : ''));
      txnSheet.getRange(t + 1, 12).setValue(payload.paidBy);
      txnSheet.getRange(t + 1, 14).setValue(payload.vendorOrMember || '');
      txnSheet.getRange(t + 1, 15).setValue(payload.referenceNumber || '');
      txnSheet.getRange(t + 1, 16).setValue(status);
      break;
    }
  }

  gasLogAudit(user, 'Update Expense', 'Expenses', expenseId, 'Updated expense to ৳' + amount + ' for ' + payload.activityName);

  return {
    success: true,
    id: expenseId,
    amount: amount,
    activityName: payload.activityName
  };
}
