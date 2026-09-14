# WCC Finance System - Operations & User Manual

This manual provides instructions for WCC Finance Managers, Field Operations Leads, and Board Auditors.

---

## 1. Recording Activity Expenses

### Scenario A: WCC Direct Payment (Cash from Vault or Bank)
1. Click **+ Quick Add** (or **+ Record Expense**).
2. Select the **Activity** (e.g. *WCC Free Health Camp – Jhalakathi*).
3. Select the **Category** (e.g. *Medical Supplies*).
4. Enter the amount (e.g. ৳65,000) and select the paying Account (e.g. *BRAC Bank Corporate A/C*).
5. Attach the supplier's bill/invoice.
6. Click **Save Expense**.

### Scenario B: Member Out-of-Pocket Payment (Pending Reimbursement)
1. In the Expense modal, check **"Paid by Member using Personal Money"**.
2. Select the member (e.g. *Sara Khan*).
3. Enter amount (e.g. ৳3,500 for Printing).
4. Save.
5. **Accounting Effect**:
   - The expense is recorded under the Activity so budget utilization is accurate.
   - A reimbursement claim is automatically created in **Member Finance &rarr; Reimbursements**.
   - No bank account is deducted yet.

---

## 2. Disbursing Member Reimbursements

1. Navigate to **Reimbursements** from the sidebar.
2. Locate the approved claim (e.g. Sara Khan ৳3,500).
3. Click **Disburse Pay**.
4. Select the disbursing account (e.g. *bKash Merchant Account* or *Bank Transfer*) and reference number.
5. Click **Confirm & Disburse**.
6. **Accounting Effect**:
   - The claim is marked `Paid`.
   - The original expense is updated to `Paid`.
   - The bank/MFS account balance is deducted once.
   - **Zero double-counting of expenses!**

---

## 3. Field Advances & Settlements

### Issuing an Advance
1. Go to **Advances & Settlements** &rarr; click **+ Issue Advance**.
2. Select member (e.g. *Rahim Uddin*), Activity (*Health Camp*), and amount (৳10,000).
3. Save. Cash is deducted from Vault.

### Reconciling / Settling the Advance
1. When field activities conclude, click **⚖️ Settle Advance**.
2. Enter the actual spent amount (e.g. ৳8,500).
3. The system automatically computes the difference:
   - If spent < Advance: **Refund Due to WCC (৳1,500)** &rarr; select deposit vault.
   - If spent > Advance: **Additional Reimbursement Due to Member (৳2,000)**.
4. Complete settlement.

---

## 4. Generating Activity Financial Statements

1. Navigate to **Activities & Events**.
2. Click **📄 View Statement** on any activity.
3. The statement displays:
   - Approved Budget vs Actual Incurred Expense
   - Remaining Liquidity & Utilization %
   - Category-wise Expenditure breakdown
   - Payment channels summary
   - Complete itemized ledger
4. Click **📥 Export PDF Report** to generate a clean, official A4 statement ready for board meetings or donor audits.

---

## 5. Closing an Activity

1. Click **🔒 Close** on the activity card.
2. The Pre-Closing Wizard performs automated compliance checks:
   - Are there pending member reimbursements?
   - Are there unsettled advances?
   - Has the budget been exceeded?
3. If all checks pass, click **Lock & Close Activity**.
