/**
 * WCC Finance Management & Accounting System
 * Financial Reports & Document Export Engine
 */

class ReportsModule {
  constructor() {
    this.reportType = 'monthly';
  }

  render() {
    // Populate report filter options dynamically
    const actSelect = document.getElementById('report-activity-select');
    if (actSelect) {
      actSelect.innerHTML = '<option value="all">All Activities & Projects</option>' + 
        window.store.data.activities.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
    }
  }

  /**
   * Export Activity Financial Statement as Professional PDF
   */
  exportActivityPDF(activityId) {
    const summary = window.store.getActivityFinancialSummary(activityId);
    if (!summary) return;

    const { activity, budget, totalExpense, remaining, utilization, expenses, reimbursements, categoryBreakdown, paymentMethodBreakdown } = summary;
    const printWindow = window.open('', '_blank');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Financial Report - ${activity.name}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #191D24; line-height: 1.4; font-size: 12px; margin: 0; padding: 10px; }
          .header { border-bottom: 2px solid #B62A35; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          .org-title { font-size: 20px; font-weight: 800; color: #B62A35; text-transform: uppercase; }
          .org-sub { font-size: 11px; color: #667085; }
          .report-badge { text-align: right; }
          .report-title { font-size: 16px; font-weight: 700; color: #1D3557; margin-bottom: 4px; }
          .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; background: #F8F9FA; padding: 12px; border-radius: 6px; margin-bottom: 20px; border: 1px solid #E4E7EC; }
          .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; text-align: center; }
          .kpi-box { border: 1px solid #E4E7EC; padding: 10px; border-radius: 6px; background: #fff; }
          .kpi-val { font-size: 16px; font-weight: 800; margin-top: 4px; color: #191D24; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
          th { background: #1D3557; color: #fff; text-align: left; padding: 6px 8px; font-weight: 600; }
          td { border-bottom: 1px solid #EAECF0; padding: 6px 8px; }
          .section-heading { font-size: 13px; font-weight: 700; color: #1D3557; margin: 16px 0 8px 0; border-left: 3px solid #B62A35; padding-left: 8px; }
          .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 50px; text-align: center; }
          .sig-line { border-top: 1px solid #98A2B3; margin-top: 35px; padding-top: 6px; font-size: 11px; font-weight: 600; color: #475467; }
          .footer { margin-top: 30px; font-size: 10px; color: #98A2B3; text-align: center; border-top: 1px solid #EAECF0; padding-top: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="display:flex; align-items:center; gap:12px;">
            <img src="WCC_logo.png" alt="WCC Logo" style="height:48px; width:auto;" onerror="this.style.display='none'">
            <div>
              <div class="org-title">We Can Change (WCC)</div>
              <div class="org-sub">Financial Management & Accounting System</div>
            </div>
          </div>
          <div class="report-badge">
            <div class="report-title">ACTIVITY FINANCIAL STATEMENT</div>
            <div style="font-size:10px; color:#667085;">Generated: ${new Date().toLocaleString()}</div>
          </div>
        </div>

        <div class="meta-grid">
          <div><strong>Activity:</strong> ${window.escapeHTML(activity.name)}</div>
          <div><strong>Activity ID:</strong> ${window.escapeHTML(activity.id)}</div>
          <div><strong>Type:</strong> ${window.escapeHTML(activity.type)}</div>
          <div><strong>Responsible Person:</strong> ${window.escapeHTML(activity.responsiblePerson)}</div>
          <div><strong>Date:</strong> ${window.escapeHTML(activity.startDate)} to ${window.escapeHTML(activity.endDate || '-')}</div>
          <div><strong>Location:</strong> ${window.escapeHTML(activity.location)}</div>
        </div>

        <div class="kpi-row">
          <div class="kpi-box">
            <div style="font-size:10px; color:#667085;">Approved Budget</div>
            <div class="kpi-val">৳${budget.toLocaleString()}</div>
          </div>
          <div class="kpi-box">
            <div style="font-size:10px; color:#667085;">Actual Expense</div>
            <div class="kpi-val" style="color:#B62A35;">৳${totalExpense.toLocaleString()}</div>
          </div>
          <div class="kpi-box">
            <div style="font-size:10px; color:#667085;">Remaining Balance</div>
            <div class="kpi-val" style="color:#169053;">৳${remaining.toLocaleString()}</div>
          </div>
          <div class="kpi-box">
            <div style="font-size:10px; color:#667085;">Budget Utilization</div>
            <div class="kpi-val">${utilization}%</div>
          </div>
        </div>

        <div class="section-heading">1. Detailed Itemized Expenses</div>
        <table>
          <thead>
            <tr>
              <th>SL</th>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th>Paid By / Vendor</th>
              <th>Payment Method</th>
              <th style="text-align:right;">Amount (BDT)</th>
            </tr>
          </thead>
          <tbody>
            ${expenses.map((e, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td>${window.escapeHTML(e.date)}</td>
                <td>${window.escapeHTML(e.category)}</td>
                <td>${window.escapeHTML(e.description)}</td>
                <td>${window.escapeHTML(e.paidBy || e.vendorOrMember)}</td>
                <td>${window.escapeHTML(e.paymentMethod)}</td>
                <td style="text-align:right; font-weight:600;">৳${Number(e.amount).toLocaleString()}</td>
              </tr>
            `).join('')}
            <tr style="background:#F8F9FA; font-weight:700;">
              <td colspan="6" style="text-align:right;">Total Incurred Expense:</td>
              <td style="text-align:right; color:#B62A35;">৳${totalExpense.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        ${reimbursements.length > 0 ? `
          <div class="section-heading">2. Member Personal Expenses & Reimbursements</div>
          <table>
            <thead>
              <tr>
                <th>Reimbursement ID</th>
                <th>Member</th>
                <th>Expense Details</th>
                <th>Request Date</th>
                <th>Status</th>
                <th style="text-align:right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${reimbursements.map(r => `
                <tr>
                  <td>${window.escapeHTML(r.id)}</td>
                  <td>${window.escapeHTML(r.memberName)}</td>
                  <td>${window.escapeHTML(r.description)}</td>
                  <td>${window.escapeHTML(r.requestDate)}</td>
                  <td>${window.escapeHTML(r.approvalStatus)}</td>
                  <td style="text-align:right; font-weight:600;">৳${Number(r.amount).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <div class="signatures">
          <div>
            <div class="sig-line">Prepared By</div>
            <div style="font-size:10px; color:#667085;">${window.escapeHTML(window.store.currentUser ? window.store.currentUser.name : 'System')}</div>
          </div>
          <div>
            <div class="sig-line">Checked & Verified By</div>
            <div style="font-size:10px; color:#667085;">Finance Officer</div>
          </div>
          <div>
            <div class="sig-line">Approved By</div>
            <div style="font-size:10px; color:#667085;">Executive Director / Treasurer</div>
          </div>
        </div>

        <div class="footer">
          Generated automatically by WCC Finance Management & Accounting System &bull; Confidential
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
  }

  /**
   * Export Activity Ledger as CSV
   */
  exportActivityExcel(activityId) {
    const summary = window.store.getActivityFinancialSummary(activityId);
    if (!summary) return;

    const { activity, expenses } = summary;
    let csv = 'Transaction ID,Date,Activity Name,Category,Description,Paid By,Payment Method,Amount,Status\n';

    expenses.forEach(e => {
      csv += `"${e.id}","${e.date}","${activity.name}","${e.category}","${(e.description || '').replace(/"/g, '""')}","${e.paidBy}","${e.paymentMethod}",${e.amount},"${e.status}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `WCC_Statement_${activity.id}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.UI.showToast('Activity CSV exported successfully!', 'success');
  }
}

window.reportsModule = new ReportsModule();
