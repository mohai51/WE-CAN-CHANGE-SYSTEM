/**
 * WCC Finance Management & Accounting System
 * Google Apps Script - Income Logic
 */

function gasCreateIncome(payload, user) {
  var amount = Number(payload.amount);
  if (isNaN(amount) || amount <= 0 || !isFinite(amount) || amount > 100000000) {
    throw new Error('Invalid income amount: must be a positive number up to ৳100,000,000');
  }

  var incId = generateUniqueId('WCC-INC', GAS_CONFIG.SHEETS.INCOME);
  var txnId = generateUniqueId('WCC-TXN', GAS_CONFIG.SHEETS.TRANSACTIONS);
  var now = new Date().toISOString().substring(0, 19).replace('T', ' ');

  var incRow = [
    incId,
    payload.date,
    payload.incomeType,
    payload.sourceOrDonor,
    payload.activityId || '',
    payload.activityName || 'General Fund',
    amount,
    payload.paymentMethod,
    payload.accountId || '',
    payload.accountName || '',
    payload.referenceNumber || '',
    payload.supportingDocUrl || '',
    payload.remarks || '',
    user ? user.name : 'System',
    now
  ];
  appendSheetRow(GAS_CONFIG.SHEETS.INCOME, incRow);

  var txnRow = [
    txnId,
    payload.date,
    'Income',
    payload.activityId || '',
    payload.activityName || 'General Fund',
    payload.incomeType,
    'Income received from ' + payload.sourceOrDonor,
    Number(payload.amount),
    payload.paymentMethod,
    payload.accountId || '',
    payload.accountName || '',
    '',
    payload.sourceOrDonor,
    payload.sourceOrDonor,
    payload.referenceNumber || '',
    'Paid',
    payload.supportingDocUrl || '',
    user ? user.name : 'System',
    now
  ];
  appendSheetRow(GAS_CONFIG.SHEETS.TRANSACTIONS, txnRow);

  gasLogAudit(user, 'Create Income', 'Income', incId, 'Received ৳' + payload.amount + ' from ' + payload.sourceOrDonor);

  return {
    id: incId,
    incomeId: incId,
    transactionId: txnId,
    date: payload.date,
    incomeType: payload.incomeType,
    sourceOrDonor: payload.sourceOrDonor,
    activityId: payload.activityId || null,
    activityName: payload.activityName || 'General Fund',
    amount: Number(payload.amount),
    paymentMethod: payload.paymentMethod,
    accountId: payload.accountId || null,
    accountName: payload.accountName || '',
    referenceNumber: payload.referenceNumber || '',
    supportingDocUrl: payload.supportingDocUrl || '',
    remarks: payload.remarks || '',
    createdBy: user ? user.name : 'System'
  };
}

function gasUpdateIncome(payload, user) {
  var incomeId = payload.incomeId || payload.id;
  if (!incomeId) throw new Error('Income ID is required for update.');

  var amount = Number(payload.amount);
  if (isNaN(amount) || amount <= 0 || !isFinite(amount) || amount > 100000000) {
    throw new Error('Invalid income amount: must be a positive number up to ৳100,000,000');
  }

  var incSheet = getSheet(GAS_CONFIG.SHEETS.INCOME);
  var incData = incSheet.getDataRange().getValues();
  var foundRow = -1;

  for (var i = 1; i < incData.length; i++) {
    if (incData[i][0] === incomeId) {
      foundRow = i + 1;
      break;
    }
  }

  if (foundRow === -1) throw new Error('Income record not found with ID: ' + incomeId);

  // Update Income sheet
  incSheet.getRange(foundRow, 2).setValue(payload.date);
  incSheet.getRange(foundRow, 3).setValue(payload.incomeType);
  incSheet.getRange(foundRow, 4).setValue(payload.sourceOrDonor);
  incSheet.getRange(foundRow, 5).setValue(payload.activityId || '');
  incSheet.getRange(foundRow, 6).setValue(payload.activityName || 'General Fund');
  incSheet.getRange(foundRow, 7).setValue(amount);
  incSheet.getRange(foundRow, 8).setValue(payload.paymentMethod);
  incSheet.getRange(foundRow, 9).setValue(payload.accountId || '');
  incSheet.getRange(foundRow, 10).setValue(payload.accountName || '');
  if (payload.referenceNumber !== undefined) incSheet.getRange(foundRow, 11).setValue(payload.referenceNumber);
  if (payload.remarks !== undefined) incSheet.getRange(foundRow, 13).setValue(payload.remarks);

  // Sync matching row in Transactions sheet
  var txnSheet = getSheet(GAS_CONFIG.SHEETS.TRANSACTIONS);
  var txnData = txnSheet.getDataRange().getValues();
  for (var t = 1; t < txnData.length; t++) {
    if (txnData[t][0] === incomeId || (txnData[t][2] === 'Income' && (txnData[t][12] === incData[foundRow - 1][3] || txnData[t][14] === incData[foundRow - 1][10]))) {
      txnSheet.getRange(t + 1, 2).setValue(payload.date);
      txnSheet.getRange(t + 1, 4).setValue(payload.activityId || '');
      txnSheet.getRange(t + 1, 5).setValue(payload.activityName || 'General Fund');
      txnSheet.getRange(t + 1, 6).setValue(payload.incomeType);
      txnSheet.getRange(t + 1, 7).setValue('Income from ' + payload.sourceOrDonor);
      txnSheet.getRange(t + 1, 8).setValue(amount);
      txnSheet.getRange(t + 1, 9).setValue(payload.paymentMethod);
      txnSheet.getRange(t + 1, 10).setValue(payload.accountId || '');
      txnSheet.getRange(t + 1, 11).setValue(payload.accountName || '');
      txnSheet.getRange(t + 1, 13).setValue(payload.sourceOrDonor);
      txnSheet.getRange(t + 1, 14).setValue(payload.sourceOrDonor);
      txnSheet.getRange(t + 1, 15).setValue(payload.referenceNumber || '');
      break;
    }
  }

  gasLogAudit(user, 'Update Income', 'Income', incomeId, 'Updated income to ৳' + amount + ' from ' + payload.sourceOrDonor);

  return {
    success: true,
    id: incomeId,
    amount: amount,
    sourceOrDonor: payload.sourceOrDonor
  };
}
