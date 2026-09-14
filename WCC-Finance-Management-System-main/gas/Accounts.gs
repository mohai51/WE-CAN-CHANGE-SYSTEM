/**
 * WCC Finance Management & Accounting System
 * Google Apps Script - Financial Accounts & Vaults Management
 */

/**
 * Create a new Bank Account, bKash Merchant Wallet, or Cash Vault
 */
function gasCreateAccount(payload, user) {
  if (!payload.name || !payload.accountType) {
    throw new Error('Account name and account type are required.');
  }

  var openingBal = Number(payload.openingBalance || 0);
  if (isNaN(openingBal) || openingBal < 0 || !isFinite(openingBal) || openingBal > 1000000000) {
    throw new Error('Invalid opening balance: must be a non-negative number up to ৳1,000,000,000');
  }

  var accId = generateUniqueId('WCC-ACC', GAS_CONFIG.SHEETS.ACCOUNTS);
  var now = new Date().toISOString().substring(0, 19).replace('T', ' ');

  var accountRow = [
    accId,
    payload.name.trim(),
    payload.accountType,
    payload.accountNumber ? payload.accountNumber.trim() : '',
    payload.bankName ? payload.bankName.trim() : '',
    openingBal,
    openingBal, // Initial current balance equals opening balance
    payload.status || 'Active',
    payload.branchName ? payload.branchName.trim() : '',
    payload.routingNumber ? payload.routingNumber.trim() : '',
    payload.notes ? payload.notes.trim() : '',
    user ? user.name : 'System',
    now
  ];

  appendSheetRow(GAS_CONFIG.SHEETS.ACCOUNTS, accountRow);

  gasLogAudit(
    user,
    'Create Account',
    'Accounts',
    accId,
    'Created new financial account: ' + payload.name + ' (' + payload.accountType + ') with initial balance ৳' + openingBal
  );

  return {
    id: accId,
    name: payload.name.trim(),
    accountType: payload.accountType,
    accountNumber: payload.accountNumber ? payload.accountNumber.trim() : '',
    bankName: payload.bankName ? payload.bankName.trim() : '',
    openingBalance: openingBal,
    currentBalance: openingBal,
    status: payload.status || 'Active',
    branchName: payload.branchName ? payload.branchName.trim() : '',
    routingNumber: payload.routingNumber ? payload.routingNumber.trim() : '',
    notes: payload.notes ? payload.notes.trim() : '',
    createdBy: user ? user.name : 'System',
    createdDate: now
  };
}

/**
 * Update an existing Bank Account, bKash Merchant Wallet, or Cash Vault
 */
function gasUpdateAccount(payload, user) {
  if (!payload.accountId) {
    throw new Error('Account ID is required for updating.');
  }

  var sheet = getSheet(GAS_CONFIG.SHEETS.ACCOUNTS);
  var data = sheet.getDataRange().getValues();
  var accountId = payload.accountId;
  var foundRow = -1;

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === accountId) {
      foundRow = i + 1;
      break;
    }
  }

  if (foundRow === -1) {
    throw new Error('Account ID not found: ' + accountId);
  }

  // Schema Columns:
  // 1: Account_ID, 2: Name, 3: Account_Type, 4: Account_Number, 5: Bank_Name,
  // 6: Opening_Balance, 7: Current_Balance, 8: Status, 9: Branch_Name, 10: Routing_Number,
  // 11: Notes, 12: Created_By, 13: Created_Date

  if (payload.name) sheet.getRange(foundRow, 2).setValue(payload.name.trim());
  if (payload.accountType) sheet.getRange(foundRow, 3).setValue(payload.accountType);
  if (payload.accountNumber !== undefined) sheet.getRange(foundRow, 4).setValue(payload.accountNumber.trim());
  if (payload.bankName !== undefined) sheet.getRange(foundRow, 5).setValue(payload.bankName.trim());
  if (payload.status) sheet.getRange(foundRow, 8).setValue(payload.status);
  if (payload.branchName !== undefined) sheet.getRange(foundRow, 9).setValue(payload.branchName.trim());
  if (payload.routingNumber !== undefined) sheet.getRange(foundRow, 10).setValue(payload.routingNumber.trim());
  if (payload.notes !== undefined) sheet.getRange(foundRow, 11).setValue(payload.notes.trim());

  gasLogAudit(
    user,
    'Update Account',
    'Accounts',
    accountId,
    'Updated account details for ' + (payload.name || accountId)
  );

  return {
    success: true,
    accountId: accountId
  };
}
