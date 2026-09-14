/**
 * WCC Finance Management & Accounting System
 * Google Apps Script - Drive File Vault & Document Uploads
 */

function getOrCreateFolder(folderName, parentFolder) {
  var parent = parentFolder || DriveApp.getRootFolder();
  var folders = parent.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parent.createFolder(folderName);
}

function gasUploadDriveFile(payload, user) {
  var base64Data = payload.base64Content;
  var fileName = payload.fileName || ('WCC_Doc_' + Date.now());
  var mimeType = payload.mimeType || 'application/octet-stream';

  var rootFolder = getOrCreateFolder(GAS_CONFIG.DRIVE_ROOT_FOLDER_NAME);
  var vouchersFolder = getOrCreateFolder(GAS_CONFIG.DRIVE_VOUCHERS_FOLDER_NAME, rootFolder);

  var decodedBytes = Utilities.base64Decode(base64Data);
  var blob = Utilities.newBlob(decodedBytes, mimeType, fileName);
  var file = vouchersFolder.createFile(blob);

  // Set permissions so authorized organization users can view
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  var fileUrl = file.getUrl();
  var fileId = file.getId();
  var attId = generateUniqueId('WCC-ATT', GAS_CONFIG.SHEETS.ATTACHMENTS);
  var now = new Date().toISOString().substring(0, 19).replace('T', ' ');

  var attRow = [
    attId,
    fileName,
    fileId,
    fileUrl,
    mimeType,
    payload.transactionId || '',
    payload.activityId || '',
    user ? user.name : 'System',
    now
  ];
  appendSheetRow(GAS_CONFIG.SHEETS.ATTACHMENTS, attRow);

  return {
    attachmentId: attId,
    fileId: fileId,
    fileName: fileName,
    driveUrl: fileUrl
  };
}
