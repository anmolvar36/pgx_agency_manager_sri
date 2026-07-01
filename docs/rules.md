# Business Rules & Validation Logic

This document outlines the strict business logic that the backend API must enforce at all times to ensure data integrity and correct financial calculations.

## 1. Revenue Split Rules
*   **Total Percentage Check:** Whenever a partnership proposal is created or updated, the sum of the Agency Share, Manager Share, and Creator Share MUST exactly equal `100%`.
    *   *Formula:* `Agency% + Manager% + Creator% === 100`
*   **Platform Fee Priority:** Before any revenue is distributed, the fixed PlayGroundX platform fee must be deducted from the gross amount.
    *   *Default Platform Fee:* `20%`
    *   *Net Amount Formula:* `Gross - (Gross * 0.20)`
*   **Distribution Calculation:** The split percentages are applied to the **Net Amount**, not the Gross Amount.
    *   *Agency Wallet Increment:* `Net Amount * (Agency% / 100)`
    *   *Manager Wallet Increment:* `Net Amount * (Manager% / 100)`
    *   *Creator Wallet Increment:* `Net Amount * (Creator% / 100)`

## 2. Hierarchy & Relationship Rules
*   **Direct vs. Managed Creators:**
    *   A Creator can be "Direct" to an Agency. In this case, the `Manager%` must be `0`, and the `ManagerId` is `null`.
    *   A Creator can be "Managed" by a Manager. The Manager must belong to an Agency.
*   **Exclusivity:** A Creator can only have ONE active Agency and ONE active Manager at any given time.
*   **Manager Constraints:** A Manager can only belong to ONE Agency. They cannot operate independently.

## 3. Recruitment & Proposals
*   **Pending State:** When an Agency or Manager sends a recruitment proposal, its status is `pending`. The splits are NOT applied until the receiving user explicitly accepts.
*   **Agency vs. Manager Recruitment Limits:**
    *   An Agency can recruit both Managers and Creators.
    *   A Manager can ONLY recruit Creators. A Manager cannot recruit another Manager.
*   **Manager Split Lock:** When a Manager recruits a creator, the Agency's preset percentage (e.g., 10%) is locked and cannot be negotiated down by the Manager. The Manager can only negotiate their own cut vs. the Creator's cut out of the remaining 90%.

## 4. Wallet & Payout Rules
*   **No Negative Balances:** Wallets can only increase through transactions. Deductions (like manual payouts) cannot exceed the current wallet balance.
*   **Immutability of Ledger:** Once a transaction (tip, sub, etc.) is processed and split, it is written to the `Transactions` ledger and CANNOT be modified or deleted. Reversals or refunds must be logged as new, negative transactions.

## 5. Security & Access Control
*   **Data Isolation:**
    *   A Manager can only query the API for data related to Creators in their own `creators` array.
    *   An Agency can query data for all Managers and Creators mapped under their `agencyId`.
    *   Creators can only access their own profile, wallet, and ledger data.
