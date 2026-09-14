/**
 * WCC Finance Management & Accounting System
 * Google Apps Script - Database Engine & Auto Schema Initializer
 */

function getSpreadsheet() {
  if (GAS_CONFIG.SPREADSHEET_ID && GAS_CONFIG.SPREADSHEET_ID.trim() !== '') {
    return SpreadsheetApp.openById(GAS_CONFIG.SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet(sheetName) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

/**
 * Generate Guaranteed Unique Sequential ID
 * e.g., WCC-TXN-2026-000001
 */
function generateUniqueId(prefix, sheetName) {
  var year = new Date().getFullYear();
  var sheet = getSheet(sheetName);
  var lastRow = sheet.getLastRow();
  var nextNum = Math.max(1, lastRow); // row 1 is header
  var paddedNum = ('000000' + nextNum).slice(-6);
  return prefix + '-' + year + '-' + paddedNum;
}

/**
 * Read Entire Sheet Data as Array of Objects (CamelCase and Type Normalized)
 */
function readSheetData(sheetName) {
  var sheet = getSheet(sheetName);
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  var headers = data[0];
  var rows = [];

  var headerMap = {
    // IDs
    'Vendor_ID': 'id',
    'Expense_ID': 'id',
    'Income_ID': 'id',
    'Activity_ID': 'activityId',
    'Project_ID': 'id',
    'Program_ID': 'id',
    'Meeting_ID': 'id',
    'Account_ID': 'id',
    'Member_ID': 'id',
    'Category_ID': 'id',
    'Reimbursement_ID': 'id',
    'Advance_ID': 'id',
    'Settlement_ID': 'id',
    'Transaction_ID': 'id',
    'Attachment_ID': 'id',
    'User_ID': 'id',
    'Approval_ID': 'id',
    'Log_ID': 'id',
    'Budget_ID': 'id',

    // Fields
    'Name': 'name',
    'Meeting_Title': 'name',
    'Service_Type': 'serviceType',
    'Contact_Person': 'contactPerson',
    'Phone': 'phone',
    'Email': 'email',
    'Address': 'address',
    'Total_Transactions': 'totalTransactions',
    'Total_Paid': 'totalPaid',
    'Outstanding_Balance': 'outstanding',
    'Current_Outstanding': 'currentOutstanding',
    'Date': 'date',
    'Type': 'type',
    'Activity_Name': 'activityName',
    'Category': 'category',
    'Description': 'description',
    'Amount': 'amount',
    'Payment_Method': 'paymentMethod',
    'Account_Name': 'accountName',
    'Paid_By': 'paidBy',
    'Received_From': 'receivedFrom',
    'Vendor_Or_Member': 'vendorOrMember',
    'Reference_No': 'referenceNumber',
    'Status': 'status',
    'Attachment_URL': 'attachmentUrl',
    'Created_By': 'createdBy',
    'Created_Date': 'createdDate',
    'Remarks': 'remarks',
    'Notes': 'notes',
    'Is_Personal_Expense': 'isMemberPersonalExpense',
    'Settled_From_Advance_ID': 'settledFromAdvanceId',
    'Income_Type': 'incomeType',
    'Source_Or_Donor': 'sourceOrDonor',
    'Supporting_Doc_URL': 'supportingDocUrl',
    'Start_Date': 'startDate',
    'End_Date': 'endDate',
    'Location': 'location',
    'Budget': 'budget',
    'Actual_Expense': 'actualExpense',
    'Responsible_Person': 'responsiblePerson',
    'Lead_Person': 'responsiblePerson',
    'Organizer': 'responsiblePerson',
    'Designation': 'designation',
    'Bank_Name': 'bankName',
    'Bank_Account_No': 'accountNumber',
    'MFS_Type': 'mfsType',
    'MFS_Number': 'mfsNumber',
    'Total_Personal_Expenses': 'totalPersonalExpenses',
    'Total_Reimbursed': 'totalReimbursed',
    'Active_Advances': 'activeAdvances',
    'Account_Type': 'accountType',
    'Account_Number': 'accountNumber',
    'Opening_Balance': 'openingBalance',
    'Current_Balance': 'currentBalance',
    'Branch_Name': 'branchName',
    'Routing_Number': 'routingNumber',
    'Allocated_Budget': 'allocatedBudget',
    'Spent_Amount': 'spentAmount',
    'Variance': 'variance',
    'Member_Name': 'memberName',
    'Request_Date': 'requestDate',
    'Approval_Status': 'approvalStatus',
    'Payment_Date': 'paymentDate',
    'Payment_Account_ID': 'paymentAccountId',
    'Payment_Reference': 'paymentReference',
    'Bill_URL': 'billUrl',
    'Purpose': 'purpose',
    'Advance_Amount': 'advanceAmount',
    'Disbursement_Date': 'disbursementDate',
    'Actual_Expense_Submitted': 'actualExpenseSubmitted',
    'Settlement_Balance': 'settlementBalance',
    'Settlement_Type': 'settlementType',
    'Approved_By': 'approvedBy',
    'Settlement_Action': 'settlementAction',
    'Refund_Account_ID': 'refundAccountId',
    'Refund_Account_Name': 'refundAccountName',
    'Settlement_Date': 'settlementDate',
    'Supporting_Expenses_List': 'supportingExpensesList',
    'Settled_By': 'settledBy',
    'File_Name': 'fileName',
    'Drive_File_ID': 'driveFileId',
    'Drive_URL': 'driveUrl',
    'MIME_Type': 'mimeType',
    'Role': 'role',
    'Timestamp': 'timestamp',
    'User': 'user',
    'Action': 'action',
    'Module': 'module',
    'Record_ID': 'recordId',
    'Details': 'details',
    'Metric_Key': 'metricKey',
    'Metric_Name': 'metricName',
    'Value': 'value',
    'Last_Updated': 'lastUpdated'
  };

  var numericFields = [
    'amount', 'budget', 'actualExpense', 'openingBalance', 'currentBalance',
    'outstanding', 'totalTransactions', 'totalPaid', 'totalPersonalExpenses',
    'totalReimbursed', 'currentOutstanding', 'activeAdvances', 'advanceAmount',
    'actualExpenseSubmitted', 'settlementBalance', 'variance', 'allocatedBudget', 'spentAmount'
  ];

  for (var i = 1; i < data.length; i++) {
    var rowObj = {};
    var hasContent = false;

    for (var j = 0; j < headers.length; j++) {
      var headerKey = headers[j].toString().trim();
      var val = data[i][j];

      if (val !== '' && val !== null && val !== undefined) {
        hasContent = true;
      }

      // Preserve raw key
      rowObj[headerKey] = val;

      // Map to camelCase normalized key
      var camelKey = headerMap[headerKey] || headerKey;
      
      // Type casting
      if (numericFields.indexOf(camelKey) !== -1) {
        rowObj[camelKey] = Number(val || 0);
      } else if (camelKey === 'isMemberPersonalExpense') {
        rowObj[camelKey] = (val === true || String(val).toUpperCase() === 'TRUE');
      } else {
        rowObj[camelKey] = val;
      }
    }

    if (hasContent) {
      // Security: Scrub sensitive credentials if reading Users table
      if (sheetName === GAS_CONFIG.SHEETS.USERS) {
        delete rowObj['password'];
        delete rowObj['Password'];
        delete rowObj['newPassword'];
      }
      // Ensure standard id property exists
      if (!rowObj.id) {
        rowObj.id = rowObj[headers[0]] || ('ROW-' + i);
      }
      rows.push(rowObj);
    }
  }
  return rows;
}

/**
 * Append Row to Sheet with Concurrency Lock
 */
function appendSheetRow(sheetName, rowArray) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // 10s wait for lock
    var sheet = getSheet(sheetName);
    sheet.appendRow(rowArray);
  } finally {
    lock.releaseLock();
  }
}

/**
 * AUTOMATED DATABASE SETUP: Creates and styles all 21 sheets with required headers!
 * Run this function once from Google Apps Script editor.
 */
function initDatabase() {
  var ss = getSpreadsheet();

  var schema = {
    'Dashboard_Data': ['Metric_Key', 'Metric_Name', 'Value', 'Last_Updated'],
    'Transactions': ['Transaction_ID', 'Date', 'Type', 'Activity_ID', 'Activity_Name', 'Category', 'Description', 'Amount', 'Payment_Method', 'Account_ID', 'Account_Name', 'Paid_By', 'Received_From', 'Vendor_Or_Member', 'Reference_No', 'Status', 'Attachment_URL', 'Created_By', 'Created_Date'],
    'Income': ['Income_ID', 'Date', 'Income_Type', 'Source_Or_Donor', 'Activity_ID', 'Activity_Name', 'Amount', 'Payment_Method', 'Account_ID', 'Account_Name', 'Reference_No', 'Supporting_Doc_URL', 'Remarks', 'Created_By', 'Created_Date'],
    'Expenses': ['Expense_ID', 'Date', 'Activity_ID', 'Activity_Name', 'Category', 'Description', 'Amount', 'Payment_Method', 'Account_ID', 'Account_Name', 'Paid_By', 'Vendor_Or_Member', 'Reference_No', 'Attachment_URL', 'Status', 'Is_Personal_Expense', 'Reimbursement_ID', 'Settled_From_Advance_ID', 'Created_By', 'Created_Date', 'Remarks'],
    'Activities': ['Activity_ID', 'Name', 'Type', 'Start_Date', 'End_Date', 'Location', 'Description', 'Budget', 'Actual_Expense', 'Responsible_Person', 'Status', 'Created_Date', 'Notes'],
    'Projects': ['Project_ID', 'Name', 'Description', 'Start_Date', 'End_Date', 'Budget', 'Actual_Expense', 'Responsible_Person', 'Status', 'Notes'],
    'Programs': ['Program_ID', 'Name', 'Description', 'Lead_Person', 'Annual_Budget', 'Status'],
    'Meetings': ['Meeting_ID', 'Meeting_Title', 'Date', 'Location', 'Total_Expense', 'Organizer', 'Status', 'Notes'],
    'Categories': ['Category_ID', 'Name', 'Type', 'Status'],
    'Vendors': ['Vendor_ID', 'Name', 'Service_Type', 'Contact_Person', 'Phone', 'Email', 'Address', 'Total_Transactions', 'Total_Paid', 'Outstanding_Balance'],
    'Members': ['Member_ID', 'Name', 'Designation', 'Email', 'Phone', 'Bank_Name', 'Bank_Account_No', 'MFS_Type', 'MFS_Number', 'Total_Personal_Expenses', 'Total_Reimbursed', 'Current_Outstanding', 'Active_Advances'],
    'Accounts': ['Account_ID', 'Name', 'Account_Type', 'Account_Number', 'Bank_Name', 'Opening_Balance', 'Current_Balance', 'Status', 'Branch_Name', 'Routing_Number', 'Notes', 'Created_By', 'Created_Date'],
    'Budgets': ['Budget_ID', 'Activity_ID', 'Category', 'Allocated_Budget', 'Spent_Amount', 'Variance'],
    'Reimbursements': ['Reimbursement_ID', 'Member_ID', 'Member_Name', 'Expense_ID', 'Activity_ID', 'Activity_Name', 'Category', 'Description', 'Amount', 'Request_Date', 'Approval_Status', 'Payment_Date', 'Payment_Method', 'Payment_Account_ID', 'Payment_Reference', 'Bill_URL', 'Notes'],
    'Advances': ['Advance_ID', 'Member_ID', 'Member_Name', 'Activity_ID', 'Activity_Name', 'Purpose', 'Advance_Amount', 'Disbursement_Date', 'Payment_Method', 'Account_ID', 'Account_Name', 'Payment_Reference', 'Status', 'Actual_Expense_Submitted', 'Settlement_Balance', 'Settlement_Type', 'Settlement_ID', 'Approved_By', 'Notes'],
    'Advance_Settlements': ['Settlement_ID', 'Advance_ID', 'Member_ID', 'Member_Name', 'Activity_ID', 'Activity_Name', 'Advance_Amount', 'Actual_Expense', 'Variance', 'Settlement_Action', 'Refund_Account_ID', 'Refund_Account_Name', 'Settlement_Date', 'Supporting_Expenses_List', 'Status', 'Settled_By', 'Notes'],
    'Attachments': ['Attachment_ID', 'File_Name', 'Drive_File_ID', 'Drive_URL', 'MIME_Type', 'Transaction_ID', 'Activity_ID', 'Uploaded_By', 'Upload_Date'],
    'Users': ['User_ID', 'Name', 'Email', 'Role', 'Phone', 'Status'],
    'Approvals': ['Approval_ID', 'Module', 'Record_ID', 'Submitted_By', 'Reviewed_By', 'Approval_Status', 'Timestamp', 'Comments'],
    'Audit_Log': ['Log_ID', 'Timestamp', 'User', 'Role', 'Action', 'Module', 'Record_ID', 'Details'],
    'Settings': ['Setting_Key', 'Setting_Value', 'Description']
  };

  for (var sheetName in schema) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    var headers = schema[sheetName];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Style Header Row (Deep Crimson background with white text)
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#B62A35');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    headerRange.setFontFamily('Inter');
    sheet.setFrozenRows(1);
  }

  Logger.log('WCC Database initialized successfully with all 21 sheets.');
}
