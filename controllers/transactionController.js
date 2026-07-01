const db = require('../config/db');

exports.sendTip = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { creatorId, grossAmount, type } = req.body;

        // 1. Get Creator Details & Splits
        const [users] = await connection.query('SELECT * FROM users WHERE id = ?', [creatorId]);
        if (users.length === 0) return res.status(404).json({ message: 'Creator not found' });
        const creator = users[0];

        // 2. Core Math
        const gross = parseFloat(grossAmount);
        const platformFee = gross * 0.20;
        const net = gross - platformFee;

        const agencyAmount = net * (parseFloat(creator.split_agency) / 100);
        const managerAmount = net * (parseFloat(creator.split_manager) / 100);
        const creatorAmount = net * (parseFloat(creator.split_creator) / 100);

        // 3. Start Transaction
        await connection.beginTransaction();

        // Update Creator Wallet
        await connection.query('UPDATE users SET walletBalance = walletBalance + ? WHERE id = ?', [creatorAmount, creatorId]);

        // Update Manager Wallet (if exists)
        if (creator.managerId) {
            await connection.query('UPDATE users SET walletBalance = walletBalance + ? WHERE id = ?', [managerAmount, creator.managerId]);
        }

        // Update Agency Wallet (if exists)
        if (creator.agencyId) {
            await connection.query('UPDATE users SET walletBalance = walletBalance + ? WHERE id = ?', [agencyAmount, creator.agencyId]);
        }

        // 4. Log Ledger Transaction
        const txId = 'tx_' + Date.now();
        await connection.query(`
            INSERT INTO transactions 
            (id, creatorId, type, grossAmount, platformFee, netAmount, agencyAmount, managerAmount, creatorAmount)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [txId, creatorId, type || 'Tip', gross, platformFee, net, agencyAmount, managerAmount, creatorAmount]);

        // Commit Transaction
        await connection.commit();

        res.json({
            message: 'Tip processed and split successfully',
            transactionId: txId,
            breakdown: { gross, platformFee, net, agencyAmount, managerAmount, creatorAmount }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Transaction error:', error);
        res.status(500).json({ message: 'Server error processing transaction' });
    } finally {
        connection.release();
    }
};

exports.getLedger = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        
        let filter = "";
        let params = [];
        
        if (role === 'agency') {
            filter = "WHERE u.agencyId = ?";
            params = [userId];
        } else if (role === 'manager') {
            filter = "WHERE u.managerId = ?";
            params = [userId];
        } else if (role === 'creator') {
            filter = "WHERE t.creatorId = ?";
            params = [userId];
        }

        const [transactions] = await db.query(`
            SELECT t.*, u.name as creatorName 
            FROM transactions t
            JOIN users u ON t.creatorId = u.id
            ${filter}
            ORDER BY t.created_at DESC 
            LIMIT 50
        `, params);
        
        // Format to match frontend state.ledger expectations
        const formatted = transactions.map(tx => ({
            id: tx.id,
            date: new Date(tx.created_at).toLocaleString('en-US', { 
                year: 'numeric', month: '2-digit', day: '2-digit', 
                hour: '2-digit', minute: '2-digit', hour12: true 
            }),
            creatorName: tx.creatorName,
            creatorId: tx.creatorId,
            type: tx.type,
            gross: parseFloat(tx.grossAmount),
            platformFee: parseFloat(tx.platformFee),
            net: parseFloat(tx.netAmount),
            splits: {
                agency: parseFloat(tx.agencyAmount),
                manager: parseFloat(tx.managerAmount),
                creator: parseFloat(tx.creatorAmount)
            }
        }));
        
        res.json({ transactions: formatted });
    } catch (error) {
        console.error('Error fetching ledger:', error);
        res.status(500).json({ message: 'Server error fetching ledger' });
    }
};
