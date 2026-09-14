/**
 * WCC Finance Management & Accounting System
 * Google Apps Script - Users & RBAC Management
 */

function gasCreateUser(payload, user) {
  // Only Admin can create users
  if (!user || user.role !== 'Admin') {
    throw new Error('Unauthorized: Only Main Admin can create new users.');
  }

  var userId = generateUniqueId('USR', GAS_CONFIG.SHEETS.USERS);
  var now = new Date().toISOString().substring(0, 19).replace('T', ' ');

  var userRow = [
    userId,
    payload.name,
    payload.email,
    payload.role,
    payload.phone || '',
    'Active',
    payload.password || 'wcc123', // In production, password hash is stored
    now
  ];
  appendSheetRow(GAS_CONFIG.SHEETS.USERS, userRow);

  gasLogAudit(user, 'Create User', 'Users', userId, 'Admin created user ' + payload.name + ' with role ' + payload.role);

  return {
    id: userId,
    name: payload.name,
    email: payload.email,
    role: payload.role,
    phone: payload.phone || '',
    status: 'Active'
  };
}

function gasUpdateUser(payload, user) {
  if (!user || user.role !== 'Admin') {
    throw new Error('Unauthorized: Only Main Admin can edit users.');
  }

  var sheet = getSheet(GAS_CONFIG.SHEETS.USERS);
  var data = sheet.getDataRange().getValues();
  var userId = payload.userId;
  var foundRow = -1;

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      foundRow = i + 1;
      break;
    }
  }

  if (foundRow === -1) throw new Error('User ID not found: ' + userId);

  // Update: Name(Col 2), Email(Col 3), Role(Col 4), Phone(Col 5), Status(Col 6)
  sheet.getRange(foundRow, 2).setValue(payload.name);
  sheet.getRange(foundRow, 3).setValue(payload.email);
  sheet.getRange(foundRow, 4).setValue(payload.role);
  sheet.getRange(foundRow, 5).setValue(payload.phone || '');
  sheet.getRange(foundRow, 6).setValue(payload.status || 'Active');

  if (payload.newPassword) {
    sheet.getRange(foundRow, 7).setValue(payload.newPassword);
  }

  gasLogAudit(user, 'Update User', 'Users', userId, 'Admin updated credentials for ' + payload.name + ' (' + payload.role + ')');

  return { success: true, userId: userId };
}

function gasCreateVendor(payload, user) {
  var vendorId = generateUniqueId('WCC-VND', GAS_CONFIG.SHEETS.VENDORS);
  var now = new Date().toISOString().substring(0, 19).replace('T', ' ');

  var vendorRow = [
    vendorId,
    payload.name,
    payload.serviceType || 'General Supplier',
    payload.contactPerson || '',
    payload.phone || '',
    payload.email || '',
    payload.address || '',
    Number(payload.totalTransactions || 0),
    Number(payload.totalPaid || 0),
    Number(payload.outstanding || 0)
  ];
  appendSheetRow(GAS_CONFIG.SHEETS.VENDORS, vendorRow);

  gasLogAudit(user, 'Create Vendor', 'Vendors', vendorId, 'Registered vendor ' + payload.name + ' (' + payload.serviceType + ')');

  return {
    id: vendorId,
    name: payload.name,
    serviceType: payload.serviceType || 'General Supplier',
    contactPerson: payload.contactPerson || '',
    phone: payload.phone || '',
    email: payload.email || '',
    address: payload.address || '',
    totalTransactions: Number(payload.totalTransactions || 0),
    totalPaid: Number(payload.totalPaid || 0),
    outstanding: Number(payload.outstanding || 0),
    notes: payload.notes || ''
  };
}
