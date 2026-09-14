/**
 * WCC Finance Management & Accounting System
 * Google Apps Script - Main Web App Gateway & Router
 */

function isValidCallback(callback) {
  if (!callback || typeof callback !== 'string') return false;
  if (callback.length > 64) return false;
  return /^[a-zA-Z_$][a-zA-Z0-9_$.]*$/.test(callback);
}

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getInitialData';
  var callback = e && e.parameter && e.parameter.callback;

  try {
    var result = handleApiAction(action, e ? e.parameter : {}, null);
    var output = JSON.stringify({ success: true, data: result });

    if (callback) {
      if (!isValidCallback(callback)) {
        throw new Error('Invalid JSONP callback name.');
      }
      return ContentService.createTextOutput(callback + '(' + output + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    return ContentService.createTextOutput(output)
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    var errorOutput = JSON.stringify({ success: false, error: err.message });
    return ContentService.createTextOutput(errorOutput)
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;
    var payload = postData.payload || {};
    var user = postData.user || null;

    var result = handleApiAction(action, payload, user);

    return ContentService.createTextOutput(JSON.stringify({ success: true, data: result }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Server-Side Authentication & Role Verification against Database
 */
function verifyServerPermission(user, allowedRoles) {
  if (!user || (!user.email && !user.name)) {
    throw new Error('Authentication required: Missing user credentials.');
  }

  var usersSheet = getSheet(GAS_CONFIG.SHEETS.USERS);
  var data = usersSheet.getDataRange().getValues();

  // If initial deployment has no users table rows yet, allow initial Admin bootstrapping
  if (data.length <= 1) {
    return { name: user.name || 'Admin', role: user.role || 'Admin', email: user.email || 'admin@wcc.org' };
  }

  var normalizedEmail = user.email ? String(user.email).trim().toLowerCase() : '';
  var foundUser = null;

  for (var i = 1; i < data.length; i++) {
    var rowId = String(data[i][0] || '').trim();
    var rowEmail = String(data[i][2] || '').trim().toLowerCase();
    if ((normalizedEmail && rowEmail === normalizedEmail) || (user.id && rowId === user.id)) {
      foundUser = {
        id: data[i][0],
        name: data[i][1],
        email: data[i][2],
        role: data[i][3],
        status: data[i][5] || 'Active'
      };
      break;
    }
  }

  // Fallback to name match if email wasn't provided
  if (!foundUser && user.name) {
    var normalizedName = String(user.name).trim().toLowerCase();
    for (var j = 1; j < data.length; j++) {
      if (String(data[j][1] || '').trim().toLowerCase() === normalizedName) {
        foundUser = {
          id: data[j][0],
          name: data[j][1],
          email: data[j][2],
          role: data[j][3],
          status: data[j][5] || 'Active'
        };
        break;
      }
    }
  }

  if (!foundUser) {
    throw new Error('Unauthorized: User identity could not be verified in the WCC system.');
  }

  if (foundUser.status === 'Inactive') {
    throw new Error('Unauthorized: User account has been deactivated.');
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (foundUser.role !== 'Admin' && allowedRoles.indexOf(foundUser.role) === -1) {
      throw new Error('Forbidden: Role "' + foundUser.role + '" is not authorized for this operation.');
    }
  }

  return foundUser;
}

/**
 * Universal Server Action Router with Role-Based Access Control
 */
function handleApiAction(action, payload, user) {
  switch (action) {
    case 'getInitialData':
      return {
        transactions: readSheetData(GAS_CONFIG.SHEETS.TRANSACTIONS),
        expenses: readSheetData(GAS_CONFIG.SHEETS.EXPENSES),
        income: readSheetData(GAS_CONFIG.SHEETS.INCOME),
        activities: readSheetData(GAS_CONFIG.SHEETS.ACTIVITIES),
        projects: readSheetData(GAS_CONFIG.SHEETS.PROJECTS),
        reimbursements: readSheetData(GAS_CONFIG.SHEETS.REIMBURSEMENTS),
        advances: readSheetData(GAS_CONFIG.SHEETS.ADVANCES),
        advanceSettlements: readSheetData(GAS_CONFIG.SHEETS.ADVANCE_SETTLEMENTS),
        accounts: readSheetData(GAS_CONFIG.SHEETS.ACCOUNTS),
        vendors: readSheetData(GAS_CONFIG.SHEETS.VENDORS),
        members: readSheetData(GAS_CONFIG.SHEETS.MEMBERS),
        categories: readSheetData(GAS_CONFIG.SHEETS.CATEGORIES),
        users: readSheetData(GAS_CONFIG.SHEETS.USERS),
        auditLogs: readSheetData(GAS_CONFIG.SHEETS.AUDIT_LOG)
      };

    case 'createExpense': {
      var authUser = verifyServerPermission(user);
      return gasCreateExpense(payload, authUser);
    }

    case 'updateExpense': {
      var authUser = verifyServerPermission(user, ['Admin', 'Finance Manager', 'Finance Officer']);
      return gasUpdateExpense(payload, authUser);
    }

    case 'createIncome': {
      var authUser = verifyServerPermission(user);
      return gasCreateIncome(payload, authUser);
    }

    case 'updateIncome': {
      var authUser = verifyServerPermission(user, ['Admin', 'Finance Manager', 'Finance Officer']);
      return gasUpdateIncome(payload, authUser);
    }

    case 'createActivity': {
      var authUser = verifyServerPermission(user, ['Admin', 'Finance Manager', 'Finance Officer', 'Project Lead']);
      return gasCreateActivity(payload, authUser);
    }

    case 'updateActivity': {
      var authUser = verifyServerPermission(user, ['Admin', 'Finance Manager', 'Finance Officer', 'Project Lead']);
      return gasUpdateActivity(payload, authUser);
    }

    case 'closeActivity': {
      var authUser = verifyServerPermission(user, ['Admin', 'Finance Manager', 'Finance Officer', 'Project Lead']);
      return gasCloseActivity(payload, authUser);
    }

    case 'createAdvance': {
      var authUser = verifyServerPermission(user, ['Admin', 'Finance Manager', 'Finance Officer', 'Treasurer']);
      return gasCreateAdvance(payload, authUser);
    }

    case 'updateAdvance': {
      var authUser = verifyServerPermission(user, ['Admin', 'Finance Manager', 'Finance Officer', 'Treasurer']);
      return gasUpdateAdvance(payload, authUser);
    }

    case 'settleAdvance': {
      var authUser = verifyServerPermission(user, ['Admin', 'Finance Manager', 'Finance Officer']);
      return gasSettleAdvance(payload, authUser);
    }

    case 'updateReimbursement': {
      var authUser = verifyServerPermission(user, ['Admin', 'Finance Manager', 'Finance Officer']);
      return gasUpdateReimbursement(payload, authUser);
    }

    case 'disburseReimbursement': {
      var authUser = verifyServerPermission(user, ['Admin', 'Finance Manager', 'Finance Officer']);
      return gasDisburseReimbursement(payload, authUser);
    }

    case 'createVendor': {
      var authUser = verifyServerPermission(user);
      return gasCreateVendor(payload, authUser);
    }

    case 'createAccount': {
      var authUser = verifyServerPermission(user, ['Admin', 'Finance Manager', 'Finance Officer']);
      return gasCreateAccount(payload, authUser);
    }

    case 'updateAccount': {
      var authUser = verifyServerPermission(user, ['Admin', 'Finance Manager', 'Finance Officer']);
      return gasUpdateAccount(payload, authUser);
    }

    case 'createUser': {
      var authUser = verifyServerPermission(user, ['Admin']);
      return gasCreateUser(payload, authUser);
    }

    case 'updateUser': {
      var authUser = verifyServerPermission(user, ['Admin']);
      return gasUpdateUser(payload, authUser);
    }

    case 'uploadDriveFile': {
      var authUser = verifyServerPermission(user);
      return gasUploadDriveFile(payload, authUser);
    }

    default:
      throw new Error('Unsupported server action: ' + action);
  }
}
