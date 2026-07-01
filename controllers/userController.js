const db = require('../config/db');

// Get creators available for recruitment (not in requesting agency)
exports.getUnaffiliatedCreators = async (req, res) => {
    try {
        const requestingAgencyId = req.user.role === 'agency' ? req.user.id : req.user.agencyId;
        
        let query = `
            SELECT id, name, role, subtitle, avatar, walletBalance as wallet,
                   isLive, viewers, roomTitle, thumbnail, agencyId, managerId,
                   split_agency, split_manager, split_creator
            FROM users 
            WHERE role = 'creator'
        `;
        const params = [];
        
        if (requestingAgencyId) {
            // Show creators NOT already in this agency
            query += ' AND (agencyId IS NULL OR agencyId != ?)';
            params.push(requestingAgencyId);
        } else {
            // Fallback: only truly unaffiliated
            query += ' AND agencyId IS NULL';
        }
        
        query += ' ORDER BY name ASC';
        
        const [creators] = await db.query(query, params);
        
        const formattedCreators = creators.map(c => ({
            ...c,
            wallet: parseFloat(c.wallet) || 0,
            isAffiliated: !!c.agencyId, // flag so frontend can show "poach" vs "recruit"
            splits: {
                agency: parseFloat(c.split_agency) || 0,
                manager: parseFloat(c.split_manager) || 0,
                creator: parseFloat(c.split_creator) || 100
            }
        }));
        
        res.json({ creators: formattedCreators });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching creators for recruitment' });
    }
};

// Get completely unaffiliated managers (for inviting)
exports.getUnaffiliatedManagers = async (req, res) => {
    try {
        const requestingAgencyId = req.user.role === 'agency' ? req.user.id : req.user.agencyId;
        
        let query = `
            SELECT id, name, role, subtitle, avatar, walletBalance as wallet, agencyId
            FROM users 
            WHERE role = 'manager'
        `;
        const params = [];
        
        if (requestingAgencyId) {
            query += ' AND (agencyId IS NULL OR agencyId != ?)';
            params.push(requestingAgencyId);
        } else {
            query += ' AND agencyId IS NULL';
        }
        
        query += ' ORDER BY name ASC';
        
        const [managers] = await db.query(query, params);
        
        res.json({ 
            managers: managers.map(m => ({
                ...m,
                wallet: parseFloat(m.wallet) || 0
            }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching managers for recruitment' });
    }
};



// Get other managers in the system (or within agency)
exports.getOtherManagers = async (req, res) => {
    try {
        const agencyId = req.user.role === 'agency' ? req.user.id : req.user.agencyId;
        
        let query = `
            SELECT id, name, role, subtitle, avatar, walletBalance as wallet, agencyId
            FROM users 
            WHERE role = 'manager'
        `;
        let params = [];
        
        // If an agency is requesting, show managers NOT in their agency (for recruiting)
        // or IN their agency (for transferring) based on a query param
        const { filter } = req.query;
        if (filter === 'unaffiliated') {
            query += ' AND agencyId IS NULL';
        } else if (filter === 'agency') {
            query += ' AND agencyId = ? AND id != ?'; // Managers in same agency except self
            params = [agencyId, req.user.id];
        }
        
        const [managers] = await db.query(query, params);
        
        const formattedManagers = managers.map(m => ({
            ...m,
            wallet: parseFloat(m.wallet) || 0,
            creators: [] // we can populate if needed, but usually just id/name is needed for transfers
        }));
        
        res.json({ managers: formattedManagers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching managers' });
    }
};

exports.terminateContract = async (req, res) => {
    try {
        const userId = req.user.id;
        if (req.user.role !== 'creator') {
            return res.status(403).json({ message: 'Only creators can terminate contracts directly this way' });
        }
        
        await db.query(`
            UPDATE users SET 
            agencyId = NULL, 
            managerId = NULL, 
            split_agency = 0, 
            split_manager = 0, 
            split_creator = 100 
            WHERE id = ?
        `, [userId]);
        
        res.json({ message: 'Contract terminated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error terminating contract' });
    }
};
