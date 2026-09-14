# We Can Change (WCC) - Finance Management & Accounting System

[![Status](https://img.shields.io/badge/Status-Production--Ready-success.svg)](#)
[![Stack](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20ES6%2B%20%7C%20GAS-crimson.svg)](#)
[![Database](https://img.shields.io/badge/Database-Google%20Sheets%20(21%20Sheets)-green.svg)](#)
[![Storage](https://img.shields.io/badge/Storage-Google%20Drive-blue.svg)](#)

A modern, enterprise-grade **Finance Management & Accounting Web Application** built specifically for **We Can Change (WCC)**. Designed as a high-performance financial SaaS platform, it provides complete financial traceability, activity-based cost accounting, personal expense reimbursement workflows (with zero double-counting), field advance settlements, branded PDF statement generation, and an immutable audit trail.

---

## 🏛️ Architecture & Tech Stack

```
Frontend:            HTML5, Modern CSS3 Design Tokens, Vanilla JavaScript (ES6+)
Charts:              Chart.js 4.4
Backend/API Layer:   Google Apps Script (Web App REST / JSONP Gateway)
Database:            Google Sheets (21 Normalized Sheets with Auto Schema Initializer)
Document Storage:    Google Drive (Base64 file transport & auto folder routing)
Reporting:           Native Print-to-PDF Engine & SheetJS / CSV Ledger Exporter
```

---

## 🚀 Key Modules & Capabilities

1. **Executive Financial Dashboard**:
   - Live KPI cards: Total Inflows, Incurred Expenses, Total Liquidity across Vaults/Banks, and Pending Member Claims.
   - Dynamic charts: Inflows vs Outflows, Category Spend Distribution, and Activity Type Breakdown.
   - Global Search (`/` keybinding) and Quick Add drawers.

2. **Activity-Based Accounting (Events, Health Camps, Projects, Meetings)**:
   - Every transaction is linked to an Activity ID (e.g. `WCC-ACT-2026-000012` for *WCC Free Health Camp – Jhalakathi*).
   - Generates complete **Activity Financial Statements** with category spend breakdowns, payment channel distributions, itemized expense ledgers, and supporting document indices.
   - **Activity Pre-Closing Wizard**: Automatically verifies that no pending reimbursements or unsettled advances exist before locking completed records.

3. **Member Personal Expense & Reimbursement Workflow**:
   - Handles instances where members spend personal money for WCC activities.
   - Automatically generates a reimbursement liability without double-counting organizational expenses upon cash payout.

4. **Member Advance Management & Settlement**:
   - Reconciles field advances against submitted bills.
   - Automatically computes variance: **Refund Due to WCC** vs. **Additional Reimbursement Due to Member**.

5. **21-Sheet Normalized Google Sheets Database**:
   - Automated installer function `initDatabase()` in `Database.gs` builds all 21 sheets with branded Crimson headers and frozen rows.

6. **Dual Mode Capability**:
   - **Demo Simulation Mode**: Pre-loaded with realistic WCC data for offline evaluation and instant client demos.
   - **Live GAS Mode**: Direct real-time sync with Google Sheets & Google Drive.

---

## 📂 Project Structure

```
WCC_Finance_Management_System/
├── index.html                    # Master Single Page Application container
├── css/
│   ├── variables.css             # WCC Logo Palette (#B62A35, #F1AD1A, #1D3557) & Tokens
│   ├── main.css                  # Sidebar, Header, Breadcrumbs, Responsive Grid
│   └── components.css            # Cards, Tables, Badges, Modals, Statements, Dropzones
├── js/
│   ├── config.js                 # Configuration, Enums, Roles & Permissions
│   ├── mockData.js               # Realistic sample dataset across 21 entities
│   ├── state.js                  # Central reactive store & financial calculation engine
│   ├── api.js                    # GAS HTTP/JSONP Client with offline demo fallback
│   ├── auth.js                   # Role-Based Access Control & active user switcher
│   ├── ui.js                     # View router, modal engine, toast alerts, formatters
│   ├── charts.js                 # Chart.js visualization controllers
│   ├── transactions.js           # Central ledger management & filters
│   ├── expenses.js               # Expense module with personal expense linking
│   ├── income.js                 # Income & donation recording
│   ├── activities.js             # Activities & Activity Financial Statements
│   ├── reimbursements.js         # Member claims verification & disbursement
│   ├── advances.js               # Member advances & settlement reconciler
│   ├── reports.js                # Official PDF statement & CSV export engine
│   ├── vendors.js                # Supplier directory & profile ledger
│   ├── accounts.js               # Cash vaults & bank balances
│   ├── audit.js                  # Immutable audit trail
│   ├── settings.js               # System preferences & API endpoint configuration
│   └── app.js                    # Application initializer
├── gas/
│   ├── Code.gs                   # Web App doGet/doPost API Gateway
│   ├── Config.gs                 # Spreadsheet & Drive folder configurations
│   ├── Database.gs               # LockService, auto-ID generator & initDatabase()
│   ├── Expenses.gs               # Expense records & personal expense linking
│   ├── Income.gs                 # Income management
│   ├── Activities.gs             # Activity lifecycle & statement compilation
│   ├── Reimbursements.gs         # Member reimbursement workflows
│   ├── Advances.gs               # Advance management & settlement calculations
│   ├── Files.gs                  # Google Drive upload handler
│   └── Audit.gs                  # Audit logging system
├── docs/
│   ├── DATABASE_SCHEMA.md        # Comprehensive 21-sheet database specification
│   ├── GOOGLE_DRIVE_STRUCTURE.md # Folder hierarchy & file naming protocols
│   ├── DEPLOYMENT_GUIDE.md       # Step-by-step Google Apps Script deployment
│   └── USER_MANUAL.md            # Operations manual for finance officers
└── README.md                     # Project overview & quickstart
```

---

## ⚡ Quickstart

1. Clone or open the project folder.
2. Double-click `index.html` to run in any browser.
3. Test recording expenses, generating activity statements, disbursing reimbursements, and settling advances immediately in **Demo Mode**.
4. To connect to Google Sheets, follow the [Deployment Guide](file:///c:/My%20Projects/WCC_Finance_Management_System/docs/DEPLOYMENT_GUIDE.md).
