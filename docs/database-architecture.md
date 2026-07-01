# Database Architecture (MongoDB / Mongoose)

This document outlines the proposed MongoDB schema structures required to support the PlayGroundX hierarchy and revenue split engine.

## 1. Users Collection
Stores all account types (Agency, Manager, Creator) in a unified collection to easily reference IDs, with roles dictating specific schema requirements.

```javascript
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['agency', 'manager', 'creator'], required: true },
    subtitle: { type: String },
    avatarUrl: { type: String },
    
    // Financial
    walletBalance: { type: Number, default: 0.00 },

    // Hierarchy Relationships (Null if not applicable)
    agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // Active Revenue Splits (For Creators Only)
    splits: {
        agency: { type: Number, min: 0, max: 100 },
        manager: { type: Number, min: 0, max: 100 },
        creator: { type: Number, min: 0, max: 100 }
    },

    // Live Streaming Metadata (For Creators Only)
    isLive: { type: Boolean, default: false },
    viewers: { type: Number, default: 0 },
    roomTitle: { type: String },
    thumbnailUrl: { type: String }
}, { timestamps: true });
```

## 2. Requests Collection
Tracks invitations and partnership proposals between users.

```javascript
const requestSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
    
    // The proposed splits for this contract
    proposedSplits: {
        agency: { type: Number, required: true },
        manager: { type: Number, required: true },
        creator: { type: Number, required: true }
    },
    notes: { type: String }
}, { timestamps: true });
```

## 3. Transactions Collection (Ledger)
The immutable ledger that logs every single tip, gift, and revenue split calculation.

```javascript
const transactionSchema = new mongoose.Schema({
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['Tip', 'Subscription', 'Gift', 'PPV'], required: true },
    
    // Math Breakdown
    grossAmount: { type: Number, required: true },
    platformFee: { type: Number, required: true },
    netAmount: { type: Number, required: true },
    
    // Split distribution logged at the exact time of transaction
    // (We store hard values, not percentages, to maintain history even if percentages change later)
    splitsApplied: {
        agencyAmount: { type: Number, default: 0 },
        managerAmount: { type: Number, default: 0 },
        creatorAmount: { type: Number, required: true }
    },
    
    // Related IDs at the time of transaction
    agencyIdAtTime: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    managerIdAtTime: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
```

## 4. Messages Collection
Stores chat histories.

```javascript
const messageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    isRead: { type: Boolean, default: false }
}, { timestamps: true });
```
