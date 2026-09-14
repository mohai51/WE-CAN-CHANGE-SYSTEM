# WCC Finance Management System — System Architecture Specification

## Critical Architectural Principle: Storage Independence & Clean Layered Architecture

> **MANDATORY REQUIREMENT:** The Frontend MUST NOT be directly dependent on the Google Sheets database structure.
> Google Sheets is only the current persistence implementation. The entire system is built so that Google Sheets can be replaced with PostgreSQL, MySQL, Supabase, Firebase, or another relational/document database without requiring frontend modifications.

---

## 1. Architectural Layers & Boundaries

```text
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                   │
│          HTML5 + CSS3 + Modular UI JavaScript           │
│    (State, Components, DOM, Modals, Forms, Charts)      │
└────────────────────────────┬────────────────────────────┘
                             │
                             │ Application API (Domain Models Only)
                             ▼
┌─────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                    │
│   Use Cases, Workflow Orchestration, Authorization,     │
│             Input Validation, Versioned Endpoints       │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                      DOMAIN LAYER                       │
│    Financial Calculations, Double-Entry & Net Balances, │
│    Advance Settlements, Reimbursements, Approval Rules  │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                   DATA ACCESS LAYER                     │
│  Repository Interfaces & Storage Schema Mappers         │
│  (TransactionRepo, ExpenseRepo, MemberRepo, AuditRepo)  │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                  STORAGE ADAPTER LAYER                  │
│       Generic StorageAdapter / DocumentStorageAdapter   │
└────────────────────────────┬────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
┌───────────────────────────┐ ┌───────────────────────────┐
│   Google Sheets Adapter   │ │   Google Drive Adapter    │
│    (Current Persistence)  │ │   (Current Doc Storage)   │
└───────────────────────────┘ └───────────────────────────┘
              │                             │
              ▼ (Future Drop-in)            ▼ (Future Drop-in)
┌───────────────────────────┐ ┌───────────────────────────┐
│ PostgreSQL / Supabase     │ │ S3 / Cloud Storage / MinIO│
└───────────────────────────┘ └───────────────────────────┘
```

---

## 2. Strict Boundary Rules

1. **Zero Spreadsheet Leakage to Client:**
   - The Frontend NEVER knows Spreadsheet IDs, Drive Folder IDs, Sheet names, row numbers, or range strings (e.g., `A2:Z100`).
   - The Frontend communicates strictly via typed application API contracts (`api.getDashboard()`, `api.createExpense(data)`, etc.).

2. **Domain Objects vs. Storage Tuples:**
   - Frontend and Application Services only handle normalized JSON domain objects.
   - The backend `Mapper` converts tabular storage rows into rich domain entities before returning responses, and maps domain entities to persistence columns upon write operations.

3. **No Double-Counting Financial Rules:**
   - Handled exclusively on the server/domain layer:
     - Member-paid expense: `Expense (+Expense, +Payable)`
     - Reimbursement settlement: `Reimbursement (-Payable, -Cash/Bank)`
     - Organization total expense is recognized once (no double counting).
     - Advances and Settlements are tracked against balances and reconciled before activity closure.

4. **Authoritative Server-Side Validation:**
   - Client-side validation is strictly for instant UX feedback.
   - All authorization, business invariant checking, ID generation, duplication detection, status transitions, and audit logging are strictly enforced server-side.

5. **Centralized Configuration:**
   - Sheet names, Drive folder names, and storage IDs reside solely in backend configuration (`Config.gs` / environment variables).

---

## 3. Standard API Envelope

All client-server exchanges use a standardized envelope:

### Success Envelope
```json
{
  "success": true,
  "data": { ... },
  "message": "Expense created successfully.",
  "error": null
}
```

### Paginated List Envelope
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "total": 150
  },
  "error": null
}
```

### Error Envelope
```json
{
  "success": false,
  "data": null,
  "message": "Unable to create expense.",
  "error": {
    "code": "EXPENSE_CREATE_FAILED",
    "details": "Activity budget exceeded or invalid category."
  }
}
```

---

## 4. Migration Readiness Roadmap

When migrating from Google Sheets to PostgreSQL or Supabase:

| Component | Google Sheets Implementation | Future PostgreSQL / Supabase Migration |
| :--- | :--- | :--- |
| **Frontend UI & Forms** | `js/components/*.js`, `index.html` | **Zero Changes** |
| **Frontend State & API** | `js/api.js`, `js/state.js` | **Zero Changes** (only change API base URL) |
| **Domain & Business Logic** | `gas/services/*.gs` | **Zero Changes** (can run in Node/Deno/Edge) |
| **Repository Layer** | `gas/repositories/*.gs` | **Zero Changes** (implements interface) |
| **Storage Adapter** | `GoogleSheetsAdapter.gs` | **Replaced** by `PostgresAdapter` / `SupabaseClient` |
| **Document Storage** | `GoogleDriveAdapter.gs` | **Replaced** by S3/Supabase Storage Adapter |

---

*This architecture standard is mandatory and governs all current and future implementations of the WCC Finance Management System.*
