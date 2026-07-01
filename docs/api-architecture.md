# API Architecture (RESTful Endpoints)

This document outlines the proposed Express.js API endpoints required to power the PlayGroundX frontend prototype, mapped directly to the exact menus and buttons in the UI. All protected routes require a valid JWT Bearer token in the `Authorization` header.

## 1. Authentication & Session (`/api/auth`)
*   **`POST /api/auth/login`** (Login Form)
    *   *Payload:* `{ email, password }`
    *   *Returns:* `{ token, user: { id, name, role, avatar } }`
*   **`POST /api/auth/signup`** (Sign Up Form)
    *   *Payload:* `{ name, email, password, role, roomTitle }`
*   **`POST /api/auth/quick-login`** (Quick Login Shortcuts)
    *   *Payload:* `{ role: 'agency' | 'manager' | 'creator' }`
    *   *Returns:* Auto-generated token for testing.

## 2. Dashboards & Overviews (`/api/dashboard`)
*   **`GET /api/dashboard/agency`** (Agency: Dashboard Menu)
    *   *Returns:* Metrics (Total Managers, Total Creators, Live Creators, Monthly Revenue), Top Earners List, Network Hierarchy Map structure.
*   **`GET /api/dashboard/manager`** (Manager: Dashboard Menu)
    *   *Returns:* Metrics (My Roster, Live Roster, Monthly Earnings), Assigned Roster status list, Live Activity monitor.
*   **`GET /api/dashboard/creator`** (Creator: Overview Menu)
    *   *Returns:* Metrics (Active Listeners, My Wallet Net Share, Overall Split Earnings), Current Partnership Agreement widget details.

## 3. Roster Management (`/api/roster`)
*   **`GET /api/roster/managers`** (Agency: Managers Menu)
*   **`GET /api/roster/direct-creators`** (Agency: Direct Creators Menu)
*   **`GET /api/roster/my-creators`** (Manager: My Creators Menu)
*   **`GET /api/roster/management-split`** (Creator: Management Split Menu)
    *   *Returns:* Detailed view of current splits and connected agency/manager.
*   **`GET /api/roster/live-now`** (Live Now Menu)
    *   *Returns:* Grid of all live creators in the user's downline/upline.

## 4. Recruitment & Requests (`/api/requests`)
*   **`POST /api/requests/recruit`** (`[+ Recruit Talent]` & `[+ Recruit Creator]` buttons)
    *   *Payload:* `{ targetUserId, targetRole, type: 'direct' | 'assign', splits: { agency, manager, creator }, notes }`
*   **`GET /api/requests/pending`** (Agency/Manager: Requests Menu)
*   **`GET /api/requests/invites`** (Creator: Invites & requests Menu)
*   **`PUT /api/requests/:requestId/respond`** (Accept/Decline buttons)
    *   *Payload:* `{ status: 'accepted' | 'declined' }`

## 5. Ledger & Financials (`/api/financials`)
*   **`GET /api/financials/earnings`** (Agency/Manager: Earnings Menu)
    *   *Returns:* Monthly revenue trends and charts.
*   **`GET /api/financials/payouts`** (Agency/Manager: Payouts Menu)
    *   *Returns:* Log of platform payouts to external wallets.
*   **`GET /api/financials/earnings-split-ledger`** (Creator: Earnings Split Ledger Menu)
    *   *Returns:* Detailed immutable transaction log of all splits for this creator.
*   **`POST /api/financials/simulator/tip`** (`[Start Tip Simulator]` -> `[Send Tip]`)
    *   *Payload:* `{ creatorId, grossAmount, type: 'Tip' | 'Subscription' }`
    *   *Action:* Calculates the 20% platform fee, splits the remaining 80% based on active contract, updates wallets, and writes to the ledger.

## 6. Miscellaneous 
*   **`GET /api/messages/threads`** (Messages Menu)
*   **`GET /api/reports/generate`** (Reports Menu)
*   **`PUT /api/settings/profile`** (Settings Menu)
