const db = require('../config/db');

exports.inviteManager = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { name, email, commission, notes } = req.body;
        const senderId = req.user.id; // Agency ID
        
        await connection.beginTransaction();
        
        // 1. Create the user in the database (unlinked initially, or linked as pending if we had a status column)
        const newUserId = 'mgr_' + Date.now();
        const defaultPassword = 'manager123';
        const defaultAvatar = null;
        
        await connection.query(`
            INSERT INTO users (id, name, email, password, role, subtitle, avatar, walletBalance, agencyId, split_manager)
            VALUES (?, ?, ?, ?, 'manager', NULL, ?, 0.00, NULL, ?)
        `, [newUserId, name, email, defaultPassword, defaultAvatar, commission]);
        
        // 2. Create the pending recruit request
        const requestId = 'req_' + Date.now();
        await connection.query(`
            INSERT INTO requests (id, senderId, receiverId, status, type, split_agency, split_manager, split_creator, notes)
            VALUES (?, ?, ?, 'pending', 'recruit', ?, ?, ?, ?)
        `, [requestId, senderId, newUserId, (100 - commission), commission, 0, notes]);
        
        await connection.commit();
        res.json({ message: 'Invitation sent successfully', userId: newUserId });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Error sending invitation' });
    } finally {
        connection.release();
    }
};

exports.sendRequest = async (req, res) => {
    try {
        const { receiverId, split_agency, split_manager, split_creator, type, notes, assignedManagerId } = req.body;
        const senderId = req.user.id;
        
        const requestId = 'req_' + Date.now();
        
        await db.query(`
            INSERT INTO requests (id, senderId, receiverId, status, type, split_agency, split_manager, split_creator, notes, assignedManagerId)
            VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)
        `, [requestId, senderId, receiverId, type || 'recruit', split_agency, split_manager, split_creator, notes, assignedManagerId || null]);
        
        res.json({ message: 'Request sent successfully', requestId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error sending request' });
    }
};

exports.getPendingRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const [requests] = await db.query('SELECT * FROM requests WHERE receiverId = ? AND status = "pending"', [userId]);
        res.json({ requests });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching requests' });
    }
};

exports.getAllRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const [requests] = await db.query(`
            SELECT r.*, s.name as senderName, s.role as senderRole, rec.name as receiverName
            FROM requests r
            JOIN users s ON r.senderId = s.id
            JOIN users rec ON r.receiverId = rec.id
            WHERE r.senderId = ? OR r.receiverId = ?
            ORDER BY r.created_at DESC
        `, [userId, userId]);
        
        res.json({ requests });
    } catch (error) {
        console.error('Error fetching all requests:', error);
        res.status(500).json({ message: 'Error fetching all requests' });
    }
};

exports.respondRequest = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { requestId } = req.params;
        const { status } = req.body; // 'accepted' or 'declined'
        const userId = req.user.id;

        await connection.beginTransaction();

        const [reqs] = await connection.query('SELECT * FROM requests WHERE id = ? AND receiverId = ?', [requestId, userId]);
        if (reqs.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Request not found' });
        }
        
        const request = reqs[0];
        
        await connection.query('UPDATE requests SET status = ? WHERE id = ?', [status, requestId]);
        
        if (status === 'accepted') {
            // Update the user's splits and assignments
            let agencyId = null;
            let managerId = null;
            
            // Check sender role to determine assignment
            const [senders] = await connection.query('SELECT role, agencyId FROM users WHERE id = ?', [request.senderId]);
            if (senders.length > 0) {
                const senderRole = senders[0].role;
                if (senderRole === 'agency') agencyId = request.senderId;
                if (senderRole === 'manager') {
                    managerId = request.senderId;
                    agencyId = senders[0].agencyId; // Inherit agency from manager
                }
            }

            await connection.query(`
                UPDATE users SET 
                agencyId = ?, 
                managerId = ?, 
                split_agency = ?, 
                split_manager = ?, 
                split_creator = ? 
                WHERE id = ?
            `, [agencyId, managerId, request.split_agency, request.split_manager, request.split_creator, userId]);
        }

        await connection.commit();
        res.json({ message: `Request ${status} successfully` });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Error processing request' });
    } finally {
        connection.release();
    }
};

exports.cancelRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user.id;
        
        const [result] = await db.query('DELETE FROM requests WHERE id = ? AND senderId = ?', [requestId, userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Request not found or unauthorized' });
        }
        
        res.json({ message: 'Request cancelled successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error cancelling request' });
    }
};
