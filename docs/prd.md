# Product Requirements Document (PRD)
**Project:** PlayGroundX Agency & Manager System (Backend API)
**Version:** 1.1 (Updated to match exact UI Menus)

## 1. Product Overview
PlayGroundX Agency & Manager System is a platform designed to facilitate the hierarchical management of content creators. It automates the distribution of livestream revenue (tips, subscriptions, PPV) among Agencies, Managers, and Creators according to customizable percentage splits.

## 2. Target Audience & Roles

### 2.1 Agency (Master Node)
*   **Permissions:** Highest level of access.
*   **Capabilities:** Can recruit Managers, recruit Direct Creators, view aggregate earnings of the entire downline network, manage payout settings, and access system-wide reports.
*   **Dashboard Features:** Total Managers, Total Creators, Live Creators, Monthly Revenue, Agency Network Hierarchy Map, Top Earners Widget.
*   **Exact Sidebar Menus:**
    *   Dashboard
    *   Managers
    *   Direct Creators
    *   Live Now
    *   Earnings
    *   Requests
    *   Reports
    *   Messages
    *   Payouts
    *   Settings

### 2.2 Manager (Sub-node)
*   **Permissions:** Intermediate level access. Works under a specific Agency.
*   **Capabilities:** Can recruit Creators under their supervision, view earnings generated only by their roster, manage creators, and view their specific revenue splits.
*   **Dashboard Features:** My Roster (Total Creators), Live Roster (Live Creators), Monthly Earnings, Assigned Roster list, Live Activity monitor.
*   **Exact Sidebar Menus:**
    *   Dashboard
    *   My Creators
    *   Live Now
    *   Earnings
    *   Requests
    *   Messages
    *   Payouts
    *   Reports
    *   Settings

### 2.3 Creator (Leaf Node)
*   **Permissions:** Lowest level access in this portal.
*   **Capabilities:** Can review their active management agreements, accept/decline partnership requests, request removal/transfer, and view their split ledger.
*   **Dashboard Features:** Active listeners / viewers, My Wallet Net Share, Overall Split Earnings, Current Partnership Agreement widget.
*   **Exact Sidebar Menus:**
    *   Overview
    *   Management Split
    *   Invites & requests
    *   Earnings Split Ledger

## 3. Key Modals & Buttons

### 3.1 Buttons
*   **`[+ Recruit Talent]`**: (Agency Dashboard) Opens modal to recruit either a Manager or a Direct Creator.
*   **`[+ Recruit Creator]`**: (Manager Dashboard) Opens modal to propose a partnership to a creator, setting custom or default revenue splits.
*   **`[Manage Agreements]`**: (Creator Overview) Access configuration for current contracts.
*   **`[Start Tip Simulator]`**: (Creator Overview) Opens the Live Stream Simulator to test the split engine.

### 3.2 Live Stream Simulator
*   A testing environment to send a mock Tip/Gift.
*   Triggers the core split engine to divide the gross amount (minus platform fee) into Agency, Manager, and Creator wallets in real time.

### 3.3 Quick Login Shortcuts
*   The login page (`/login`) includes shortcut buttons to instantly bypass authentication as an Agency, Manager, or Creator for testing purposes.
