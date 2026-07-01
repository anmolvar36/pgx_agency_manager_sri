const db = require('../config/db');

exports.getAgencyDashboard = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Use raw MySQL queries to get metrics for the Agency
        const [agencyRes] = await db.query('SELECT walletBalance, viewers FROM users WHERE id = ?', [userId]);
        const walletBalance = agencyRes[0]?.walletBalance || 0;
        
        const [managersRes] = await db.query('SELECT COUNT(*) as totalManagers FROM users WHERE role = "manager" AND agencyId = ?', [userId]);
        const [creatorsRes] = await db.query('SELECT COUNT(*) as totalCreators FROM users WHERE role = "creator" AND agencyId = ?', [userId]);
        const [liveCreatorsRes] = await db.query('SELECT COUNT(*) as liveCreators FROM users WHERE role = "creator" AND agencyId = ? AND isLive = true', [userId]);

        // Fetch hierarchy: managers
        const [managers] = await db.query('SELECT id, name, role, subtitle, avatar FROM users WHERE role = "manager" AND agencyId = ?', [userId]);
        
        // Fetch all creators for this agency
        const [allCreators] = await db.query('SELECT id, name, managerId, isLive, split_agency, split_creator FROM users WHERE role = "creator" AND agencyId = ?', [userId]);
        
        // Map creators to managers
        const hierarchyManagers = managers.map(m => {
            return {
                ...m,
                creators: allCreators.filter(c => c.managerId === m.id)
            };
        });
        
        const directCreators = allCreators.filter(c => c.managerId === null);

        res.json({
            walletBalance,
            totalManagers: managersRes[0].totalManagers,
            totalCreators: creatorsRes[0].totalCreators,
            liveCreators: liveCreatorsRes[0].liveCreators,
            managers: hierarchyManagers,
            directCreators: directCreators
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching dashboard' });
    }
};

exports.getAgencyManagers = async (req, res) => {
    try {
        const agencyId = req.user.id;
        // Fetch users who have role='manager' and agencyId=agencyId
        const [managers] = await db.query(`
            SELECT id, name, role, subtitle, avatar, walletBalance as wallet
            FROM users 
            WHERE role = 'manager' AND agencyId = ?
        `, [agencyId]);
        
        // For each manager, fetch count of active creators
        for (let m of managers) {
            const [creatorsRes] = await db.query('SELECT COUNT(*) as activeCreators FROM users WHERE role="creator" AND managerId=?', [m.id]);
            m.creatorsCount = creatorsRes[0].activeCreators;
        }
        
        // Fetch pending invites (requests) for managers sent by this agency
        const [pendingRequests] = await db.query(`
            SELECT id, receiverId as id, 'Manager Invite' as name, 'pending' as status
            FROM requests
            WHERE senderId = ? AND status = 'pending' AND type = 'recruit'
        `, [agencyId]);
        
        // Note: Currently pending invites only track the request, so we mock the name if not in users table yet.
        // If receiverId corresponds to a user, we should fetch their details.
        
        const [usersForRequests] = await db.query('SELECT id, name, avatar, subtitle FROM users WHERE id IN (SELECT receiverId FROM requests WHERE senderId = ? AND status = "pending")', [agencyId]);
        
        const formattedPending = pendingRequests.map(pr => {
            const u = usersForRequests.find(usr => usr.id === pr.id);
            return {
                id: pr.id,
                name: u ? u.name : pr.name,
                avatar: u ? u.avatar : null,
                subtitle: u ? u.subtitle : 'Pending Invite',
                status: 'pending',
                creatorsCount: 0,
                wallet: 0
            };
        });
        
        res.json({ managers: [...managers, ...formattedPending] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching managers' });
    }
};

exports.getAgencyDirectCreators = async (req, res) => {
    try {
        const agencyId = req.user.id;
        // Fetch users who have role='creator' and agencyId=agencyId but managerId is NULL
        const [directCreators] = await db.query(`
            SELECT id, name, role, subtitle, avatar, walletBalance as wallet,
                   split_agency, split_creator, isLive, viewers, roomTitle
            FROM users 
            WHERE role = 'creator' AND agencyId = ? AND managerId IS NULL
        `, [agencyId]);
        
        // Format splits for frontend consumption
        const formattedCreators = directCreators.map(c => ({
            ...c,
            wallet: parseFloat(c.wallet) || 0,
            splits: { agency: c.split_agency, creator: c.split_creator }
        }));
        
        res.json({ creators: formattedCreators });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching direct creators' });
    }
};

exports.getLiveCreators = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        
        let query = `
            SELECT id, name, role, subtitle, avatar, walletBalance as wallet,
                   split_agency, split_creator, split_manager, managerId, agencyId, isLive, viewers, roomTitle, thumbnail
            FROM users 
            WHERE role = 'creator' AND isLive = true
        `;
        let params = [];
        
        if (role === 'agency') {
            query += ' AND agencyId = ?';
            params.push(userId);
        } else if (role === 'manager') {
            query += ' AND managerId = ?';
            params.push(userId);
        }
        
        const [liveCreators] = await db.query(query, params);
        
        const formattedCreators = liveCreators.map(c => ({
            ...c,
            wallet: parseFloat(c.wallet) || 0,
            splits: { agency: c.split_agency, manager: c.split_manager, creator: c.split_creator }
        }));
        
        res.json({ creators: formattedCreators });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching live creators' });
    }
};

exports.getManagerDashboard = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const [managerRes] = await db.query('SELECT walletBalance FROM users WHERE id = ?', [userId]);
        const walletBalance = managerRes[0]?.walletBalance || 0;
        
        const [creatorsRes] = await db.query('SELECT COUNT(*) as totalCreators FROM users WHERE role = "creator" AND managerId = ?', [userId]);
        const [liveCreatorsRes] = await db.query('SELECT COUNT(*) as liveCreators FROM users WHERE role = "creator" AND managerId = ? AND isLive = true', [userId]);

        const [myCreators] = await db.query(`
            SELECT id, name, role, subtitle, avatar, walletBalance as wallet,
                   split_agency, split_creator, split_manager, isLive, viewers, roomTitle
            FROM users 
            WHERE role = 'creator' AND managerId = ?
        `, [userId]);
        
        const formattedCreators = myCreators.map(c => ({
            ...c,
            wallet: parseFloat(c.wallet) || 0,
            splits: { agency: c.split_agency, manager: c.split_manager, creator: c.split_creator }
        }));

        res.json({
            walletBalance,
            totalCreators: creatorsRes[0].totalCreators,
            liveCreators: liveCreatorsRes[0].liveCreators,
            myCreators: formattedCreators
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching dashboard' });
    }
};

exports.getCreatorDashboard = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const [creatorRes] = await db.query('SELECT walletBalance, isLive, viewers, split_agency, split_manager, split_creator FROM users WHERE id = ?', [userId]);
        if (creatorRes.length === 0) return res.status(404).json({ message: 'Creator not found' });
        
        res.json({
            walletBalance: creatorRes[0].walletBalance,
            isLive: creatorRes[0].isLive,
            viewers: creatorRes[0].viewers,
            splits: {
                agency: creatorRes[0].split_agency,
                manager: creatorRes[0].split_manager,
                creator: creatorRes[0].split_creator,
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching dashboard' });
    }
};

exports.toggleLive = async (req, res) => {
    try {
        const userId = req.user.id;
        if (req.user.role !== 'creator') {
            return res.status(403).json({ message: 'Only creators can toggle live status' });
        }

        // Get current live status
        const [rows] = await db.query('SELECT isLive, viewers FROM users WHERE id = ?', [userId]);
        if (rows.length === 0) return res.status(404).json({ message: 'Creator not found' });

        const currentlyLive = rows[0].isLive;
        const newLiveStatus = !currentlyLive;
        
        // When going live, set random viewers; when going offline, reset to 0
        const newViewers = newLiveStatus ? Math.floor(Math.random() * 500) + 50 : 0;

        await db.query('UPDATE users SET isLive = ?, viewers = ? WHERE id = ?', [newLiveStatus, newViewers, userId]);

        res.json({ 
            message: newLiveStatus ? 'You are now LIVE!' : 'Stream ended.',
            isLive: newLiveStatus,
            viewers: newViewers
        });
    } catch (error) {
        console.error('toggleLive error:', error);
        res.status(500).json({ message: 'Server error toggling live status' });
    }
};

