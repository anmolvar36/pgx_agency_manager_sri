# Workflow & System Overviews

This document illustrates the step-by-step logic flows for the two most critical paths in the PlayGroundX system: The Recruitment Flow and the Live Revenue Split Flow.

## 1. Recruitment Workflow (Partnership Proposal)

This flow outlines what happens when an Agency or Manager clicks the `[+ Recruit Creator]` button in the frontend.

1.  **Frontend Form Validation:** User selects a Creator, defines splits, and the frontend ensures `A% + M% + C% = 100%`.
2.  **API Request:** Frontend POSTs to `/api/requests/invite` with the payload.
3.  **Backend Validation:**
    *   Express middleware verifies JWT token.
    *   Backend re-verifies the 100% split rule.
    *   Backend checks if the targeted Creator is already locked into an exclusive contract.
4.  **Database Write:** A new document is created in the `Requests` collection with status `pending`.
5.  **Notification:** Socket.io emits a 'new_request' event to the targeted Creator if they are online, updating their notification bell.
6.  **Creator Action:** Creator views the proposal in their Dashboard -> Requests menu.
    *   If **Declined**: Request status changes to `declined`. End of flow.
    *   If **Accepted**: 
        *   Request status changes to `accepted`.
        *   The `Users` collection is updated for the Creator: `agencyId`, `managerId`, and `splits` fields are permanently updated to match the proposal.

## 2. Live Revenue Split Engine Workflow (The Simulator)

This flow outlines what happens during a live stream when a fan clicks `[Send Tip]`.

1.  **Incoming Trigger:** A fan sends a $100 tip. Frontend POSTs to `/api/transactions/tip`.
2.  **State Retrieval:** Backend queries the `Users` collection for the `creatorId` to find their active `splits` configuration and their assigned `agencyId` and `managerId`.
    *   *Example State:* Agency (10%), Manager (20%), Creator (70%).
3.  **Core Math Calculation:**
    *   `Gross Amount:` $100.00
    *   `Platform Fee (20%):` $20.00
    *   `Net Amount:` $80.00
    *   `Creator Cut:` $80.00 * 0.70 = $56.00
    *   `Manager Cut:` $80.00 * 0.20 = $16.00
    *   `Agency Cut:` $80.00 * 0.10 = $8.00
4.  **Atomic Database Update (MongoDB Session):**
    *   Increment Creator's Wallet by $56.00.
    *   Increment Manager's Wallet by $16.00.
    *   Increment Agency's Wallet by $8.00.
    *   *If any wallet update fails, the entire transaction is rolled back.*
5.  **Ledger Logging:** A new document is written to the `Transactions` collection logging the exact amounts and IDs involved for historical reporting.
6.  **Real-time UI Update:** Socket.io emits a 'wallet_update' event to the Agency, Manager, and Creator so their top-bar Wallet Pill updates instantly without refreshing the page.
