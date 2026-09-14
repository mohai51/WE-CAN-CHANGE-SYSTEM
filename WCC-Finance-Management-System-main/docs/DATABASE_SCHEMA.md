# WCC Finance Management System - Database Schema Documentation

This document describes the 21 normalized Google Sheets comprising the database for **We Can Change (WCC)**.

---

## Entity Relationship Overview

```
Organization (WCC)
├── Accounts (Cash Vault, BRAC Bank, DBBL, bKash, Nagad)
├── Categories (25 Expense & Inflow Types)
├── Members (Staff, Field Leads, Volunteers)
├── Vendors (Pharmaceuticals, Printing, Logistics, Catering)
└── Activities (Events, Health Camps, Projects, Meetings)
    ├── Budgets (Category Allocations)
    ├── Expenses (Itemized Outflows)
    │   ├── Attachments (Drive Bills & Vouchers)
    │   └── Reimbursements (Member Personal Claims)
    ├── Income (Grants, Donations, Fees, Sponsorships)
    └── Advances (Operational Field Requisitions)
        └── Advance Settlements (Reconciled Actual vs Advance)
```

---

## 21 Database Sheets Specification

### 1. `Dashboard_Data`
Caches aggregated metrics for fast frontend KPI card rendering.
- `Metric_Key` (Text, PK): e.g. `TOTAL_INCOME`, `TOTAL_EXPENSE`, `CURRENT_LIQUIDITY`
- `Metric_Name` (Text): Human readable title
- `Value` (Number): Aggregated amount
- `Last_Updated` (DateTime): Timestamp

### 2. `Transactions`
The master chronological double-entry ledger.
- `Transaction_ID` (Text, PK): `WCC-TXN-YYYY-XXXXXX`
- `Date` (Date): YYYY-MM-DD
- `Type` (Enum): `Income`, `Expense`, `Member Reimbursement`, `Member Advance`, `Advance Settlement`, `Adjustment`
- `Activity_ID` (Text, FK): References `Activities.Activity_ID`
- `Activity_Name` (Text)
- `Category` (Text): References `Categories.Name`
- `Description` (Text)
- `Amount` (Number): Positive value in BDT
- `Payment_Method` (Enum): `Cash`, `Bank Transfer`, `Cheque`, `bKash`, `Nagad`, `Rocket`
- `Account_ID` (Text, FK): References `Accounts.Account_ID`
- `Account_Name` (Text)
- `Paid_By` (Text): Member or entity who paid
- `Received_From` (Text): Donor or source
- `Vendor_Or_Member` (Text)
- `Reference_No` (Text): External bank/receipt slip number
- `Status` (Enum): `Draft`, `Submitted`, `Verified`, `Approved`, `Paid`, `Cancelled`
- `Attachment_URL` (URL): Google Drive link
- `Created_By` (Text)
- `Created_Date` (DateTime)

### 3. `Income`
Tracks all inflow streams.
- `Income_ID` (Text, PK): `WCC-INC-YYYY-XXXXXX`
- `Date` (Date)
- `Income_Type` (Enum): `Donation`, `Project Grant`, `Sponsorship`, `Membership Fee`, `Event Contribution`, `Other Income`
- `Source_Or_Donor` (Text)
- `Activity_ID` (Text, FK)
- `Activity_Name` (Text)
- `Amount` (Number)
- `Payment_Method` (Enum)
- `Account_ID` (Text, FK)
- `Account_Name` (Text)
- `Reference_No` (Text)
- `Supporting_Doc_URL` (URL)
- `Remarks` (Text)
- `Created_By` (Text)
- `Created_Date` (DateTime)

### 4. `Expenses`
Tracks all expenditures.
- `Expense_ID` (Text, PK): `WCC-EXP-YYYY-XXXXXX`
- `Date` (Date)
- `Activity_ID` (Text, FK)
- `Activity_Name` (Text)
- `Category` (Text)
- `Description` (Text)
- `Amount` (Number)
- `Payment_Method` (Enum)
- `Account_ID` (Text, FK)
- `Account_Name` (Text)
- `Paid_By` (Text)
- `Vendor_Or_Member` (Text)
- `Reference_No` (Text)
- `Attachment_URL` (URL)
- `Status` (Enum): `Draft`, `Submitted`, `Verified`, `Approved`, `Pending Reimbursement`, `Paid`
- `Is_Personal_Expense` (Boolean): `TRUE` / `FALSE`
- `Reimbursement_ID` (Text, FK): References `Reimbursements.Reimbursement_ID`
- `Settled_From_Advance_ID` (Text, FK): References `Advances.Advance_ID`
- `Created_By` (Text)
- `Created_Date` (DateTime)
- `Remarks` (Text)

### 5. `Activities`
Core organizational operational containers.
- `Activity_ID` (Text, PK): `WCC-ACT-YYYY-XXXXXX`
- `Name` (Text)
- `Type` (Enum): `Health Camp`, `Event`, `Campaign`, `Meeting`, `Training`, `Office Operation`, `Project`, `Workshop`
- `Start_Date` (Date)
- `End_Date` (Date)
- `Location` (Text)
- `Description` (Text)
- `Budget` (Number)
- `Actual_Expense` (Number)
- `Responsible_Person` (Text)
- `Status` (Enum): `Active`, `Completed`, `Closed`
- `Created_Date` (Date)
- `Notes` (Text)

### 6. `Projects`
Multi-month strategic initiatives.
- `Project_ID` (Text, PK): `WCC-PRJ-YYYY-XXXXXX`
- `Name` (Text), `Description` (Text), `Start_Date`, `End_Date`, `Budget`, `Actual_Expense`, `Responsible_Person`, `Status`, `Notes`

### 7. `Programs`
Ongoing standing organizational programs (`WCC-PRG-YYYY-XXXXXX`).

### 8. `Meetings`
Board & Committee meetings (`WCC-MTG-YYYY-XXXXXX`).

### 9. `Categories`
Expense & Income classification taxonomy.
- `Category_ID` (PK), `Name`, `Type` (`Expense` / `Income`), `Status` (`Active` / `Inactive`)

### 10. `Vendors`
Supplier directory.
- `Vendor_ID` (PK): `WCC-VND-XXXXXX`
- `Name`, `Service_Type`, `Contact_Person`, `Phone`, `Email`, `Address`, `Total_Transactions`, `Total_Paid`, `Outstanding_Balance`

### 11. `Members`
Staff, field leads, and volunteer directory.
- `Member_ID` (PK): `WCC-MBR-XXXXXX`
- `Name`, `Designation`, `Email`, `Phone`, `Bank_Name`, `Bank_Account_No`, `MFS_Type`, `MFS_Number`, `Total_Personal_Expenses`, `Total_Reimbursed`, `Current_Outstanding`, `Active_Advances`

### 12. `Accounts`
Internal vaults, multiple bank accounts, and multiple bKash/Nagad/Rocket merchant wallets.
- `Account_ID` (PK): `WCC-ACC-YYYY-XXXXXX`
- `Name`, `Account_Type` (`Bank Account`, `bKash`, `Nagad`, `Rocket`, `Cash`, `Other`), `Account_Number`, `Bank_Name`, `Opening_Balance`, `Current_Balance`, `Status` (`Active` / `Inactive`), `Branch_Name`, `Routing_Number`, `Notes`, `Created_By`, `Created_Date`

### 13. `Budgets`
Category-level budget allocations per activity (`Allocated_Budget`, `Spent_Amount`, `Variance`).

### 14. `Reimbursements`
Member personal expense claims.
- `Reimbursement_ID` (PK): `WCC-REIM-YYYY-XXXXXX`
- `Member_ID`, `Member_Name`, `Expense_ID` (FK), `Activity_ID`, `Activity_Name`, `Category`, `Description`, `Amount`, `Request_Date`, `Approval_Status` (`Submitted`, `Verified`, `Approved`, `Paid`, `Rejected`), `Payment_Date`, `Payment_Method`, `Payment_Account_ID`, `Payment_Reference`, `Bill_URL`, `Notes`

### 15. `Advances`
Requisitions given to members for field operations.
- `Advance_ID` (PK): `WCC-ADV-YYYY-XXXXXX`
- `Member_ID`, `Member_Name`, `Activity_ID`, `Activity_Name`, `Purpose`, `Advance_Amount`, `Disbursement_Date`, `Payment_Method`, `Account_ID`, `Account_Name`, `Payment_Reference`, `Status` (`Issued`, `Settled`, `Closed`), `Actual_Expense_Submitted`, `Settlement_Balance`, `Settlement_Type` (`Refund Received` / `Additional Reimbursement`), `Settlement_ID`, `Approved_By`, `Notes`

### 16. `Advance_Settlements`
Reconciliation records.
- `Settlement_ID` (PK): `WCC-SET-YYYY-XXXXXX`
- `Advance_ID`, `Member_ID`, `Member_Name`, `Activity_ID`, `Activity_Name`, `Advance_Amount`, `Actual_Expense`, `Variance`, `Settlement_Action`, `Refund_Account_ID`, `Refund_Account_Name`, `Settlement_Date`, `Supporting_Expenses_List`, `Status`, `Settled_By`, `Notes`

### 17. `Attachments`
Drive document index (`Attachment_ID`, `File_Name`, `Drive_File_ID`, `Drive_URL`, `MIME_Type`, `Transaction_ID`, `Activity_ID`, `Uploaded_By`, `Upload_Date`).

### 18. `Users`
Authorized system operators (`User_ID`, `Name`, `Email`, `Role`, `Phone`, `Status`).

### 19. `Approvals`
Multi-tier approval audit steps (`Approval_ID`, `Module`, `Record_ID`, `Submitted_By`, `Reviewed_By`, `Approval_Status`, `Timestamp`, `Comments`).

### 20. `Audit_Log`
Immutable audit log (`Log_ID`, `Timestamp`, `User`, `Role`, `Action`, `Module`, `Record_ID`, `Details`).

### 21. `Settings`
System-wide preferences (`Setting_Key`, `Setting_Value`, `Description`).
