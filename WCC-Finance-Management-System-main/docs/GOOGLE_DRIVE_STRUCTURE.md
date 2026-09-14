# Google Drive Folder Hierarchy & Document Protocols

The **We Can Change (WCC)** Finance Management System uses Google Drive as its secure document vault for invoices, cash vouchers, supplier receipts, and financial statements.

---

## Folder Hierarchy

```
My Drive/
└── WCC_Finance_Documents/                     [Root Vault]
    ├── Vouchers_and_Bills/                   [All Uploaded Supporting Bills]
    │   ├── 2026_Q1/
    │   └── 2026_Q2/
    ├── Financial_Reports/                    [Official Exported PDF Statements]
    │   ├── Activity_Statements/
    │   └── Monthly_Audit_Packs/
    └── Vendor_Agreements/                    [Supplier CSR & Distributor Contracts]
```

---

## Document Naming Conventions

All files uploaded through the frontend or Google Apps Script API must strictly follow the standard prefix format:

1. **Expense Bills & Receipts**:
   `WCC_EXP_YYYY_XXXXXX_Bill.[pdf|jpg|png]`
   *Example*: `WCC_EXP_2026_000001_SquarePharma_Bill.pdf`

2. **Member Reimbursement Vouchers**:
   `WCC_REIM_YYYY_XXXXXX_Voucher.[pdf|jpg|png]`
   *Example*: `WCC_REIM_2026_000001_Sara_Printing_Bill.pdf`

3. **Field Advance Requisition Slips**:
   `WCC_ADV_YYYY_XXXXXX_Requisition.[pdf|jpg|png]`

4. **Official Activity Statements**:
   `WCC_Statement_WCC-ACT-YYYY-XXXXXX_[Timestamp].pdf`

---

## File Upload Technical Flow

1. User attaches a file (PDF, PNG, JPG up to 15 MB) in the Web Application modal.
2. The file is read via JavaScript `FileReader` as Base64 encoded payload.
3. The frontend dispatches `api.uploadFile(...)` to Google Apps Script.
4. Apps Script decodes the Base64 stream using `Utilities.base64Decode()`.
5. A Google Drive file is created in `WCC_Finance_Documents / Vouchers_and_Bills`.
6. Public link sharing (`DriveApp.Access.ANYONE_WITH_LINK`) is set for internal viewing.
7. A record is added to the `Attachments` sheet and the file URL is attached to the transaction.
