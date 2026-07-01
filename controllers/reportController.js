const db = require('../config/db');

exports.getAgencyReports = async (req, res) => {
    try {
        const agencyId = req.user.id;
        const role = req.user.role;

        let agencyFilter = "";
        let params = [];
        if (role === 'agency') {
            agencyFilter = "WHERE u.agencyId = ?";
            params = [agencyId];
        } else if (role === 'manager') {
            agencyFilter = "WHERE u.managerId = ?";
            params = [agencyId]; // agencyId variable here holds the user.id
        } else if (role === 'creator') {
            agencyFilter = "WHERE u.id = ?";
            params = [agencyId];
        }

        // 1. Revenue Distribution (Sum of splits)
        const [revenueRows] = await db.query(`
            SELECT 
                SUM(t.creatorAmount) as totalCreatorShare,
                SUM(t.managerAmount) as totalManagerShare,
                SUM(t.agencyAmount) as totalAgencyShare,
                SUM(t.netAmount) as totalNet
            FROM transactions t
            LEFT JOIN users u ON t.creatorId = u.id
            ${agencyFilter}
        `, params);

        const rev = revenueRows[0];
        const totalCreator = parseFloat(rev.totalCreatorShare) || 0;
        const totalManager = parseFloat(rev.totalManagerShare) || 0;
        const totalAgency = parseFloat(rev.totalAgencyShare) || 0;
        const totalNet = (totalCreator + totalManager + totalAgency) || 1; // avoid div by 0

        const dist = {
            creator: { amount: totalCreator, pct: Math.round((totalCreator / totalNet) * 100) || 0 },
            manager: { amount: totalManager, pct: Math.round((totalManager / totalNet) * 100) || 0 },
            agency: { amount: totalAgency, pct: Math.round((totalAgency / totalNet) * 100) || 0 }
        };

        // 2. Leaderboard: Top Creators
        const [topCreators] = await db.query(`
            SELECT u.id, u.name, u.avatar, u.subtitle, 
                   SUM(t.creatorAmount) as earnings, 
                   SUM(t.grossAmount) as gross, 
                   SUM(t.agencyAmount) as agencySplit
            FROM transactions t
            JOIN users u ON t.creatorId = u.id
            ${agencyFilter}
            GROUP BY u.id
            ORDER BY earnings DESC
            LIMIT 5
        `, params);

        // 3. Leaderboard: Top Managers
        let managerFilter = "";
        let mgrParams = [];
        if (role === 'agency') {
            managerFilter = "WHERE u.role = 'manager' AND u.agencyId = ?";
            mgrParams = [agencyId];
        } else if (role === 'manager') {
            managerFilter = "WHERE u.id = ?";
            mgrParams = [agencyId];
        }

        const [topManagers] = await db.query(`
            SELECT u.id, u.name, u.avatar, u.subtitle, SUM(t.managerAmount) as commission
            FROM transactions t
            JOIN users c ON t.creatorId = c.id
            JOIN users u ON c.managerId = u.id
            ${managerFilter.replace('u.role', 'u.role').replace('u.agencyId', 'u.agencyId')}
            GROUP BY u.id
            ORDER BY commission DESC
            LIMIT 5
        `, mgrParams);

        // 4. Monthly Growth & Revenue Trend
        let trendFilter = "";
        let trendParams = [];
        if (role === 'agency') {
            trendFilter = "WHERE u.agencyId = ? AND t.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
            trendParams = [agencyId];
        } else if (role === 'manager') {
            trendFilter = "WHERE u.managerId = ? AND t.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
            trendParams = [agencyId]; // manager id
        } else {
            trendFilter = "WHERE t.creatorId = ? AND t.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
            trendParams = [agencyId]; // creator id
        }

        const [trendData] = await db.query(`
            SELECT DATE(t.created_at) as date, 
                   SUM(t.agencyAmount) as agencyRevenue,
                   SUM(t.managerAmount) as managerRevenue,
                   SUM(t.creatorAmount) as creatorRevenue
            FROM transactions t
            JOIN users u ON t.creatorId = u.id
            ${trendFilter}
            GROUP BY DATE(t.created_at)
            ORDER BY date ASC
        `, trendParams);

        const monthlyGrowth = "+12% MoM"; // Static for now unless we calculate 30 days vs previous 30 days

        
        // 5. Avg Live Hours (mock logic)
        const avgLiveHours = "0 hrs/week";
        
        const topRecruiterCommission = topManagers.length > 0 ? parseFloat(topManagers[0].commission) : 0;
        const topRecruiterName = topManagers.length > 0 ? topManagers[0].name : 'N/A';

        res.json({
            distribution: dist,
            leaderboard: {
                creators: topCreators,
                managers: topManagers
            },
            stats: {
                growth: monthlyGrowth,
                liveHours: avgLiveHours,
                topRecruiterCommission,
                topRecruiterName
            },
            trendData: trendData
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching reports' });
    }
};
