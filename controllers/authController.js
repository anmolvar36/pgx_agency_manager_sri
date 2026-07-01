const db = require('../config/db');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, role: user.role, name: user.name },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '1d' }
    );
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const [rows] = await db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
        
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const user = rows[0];
        const token = generateToken(user);
        
        // Remove password from response
        delete user.password;
        
        res.json({ token, user });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

exports.register = async (req, res) => {
    try {
        const { name, email, password, role, roomTitle } = req.body;
        
        // Check if email exists
        const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Email already registered' });
        }
        
        const idPrefix = role === 'agency' ? 'agency' : (role === 'manager' ? 'mgr' : 'crt');
        const id = `${idPrefix}_${Date.now()}`;
        
        let subtitle = null;
        let avatar = null;
        
        await db.query(`
            INSERT INTO users 
            (id, email, password, name, role, subtitle, avatar, roomTitle, isLive, viewers, walletBalance) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [id, email, password, name, role, subtitle, avatar, roomTitle || null, false, 0, 0]);
        
        res.status(201).json({ message: 'User registered successfully', userId: id });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

exports.quickLogin = async (req, res) => {
    try {
        const { role } = req.body;
        
        let query = 'SELECT * FROM users WHERE role = ? LIMIT 1';
        let params = [role];

        if (role === 'manager') {
            query = 'SELECT * FROM users WHERE role = ? AND name = ? LIMIT 1';
            params = [role, 'Mike Manager'];
        } else if (role === 'creator') {
            query = 'SELECT * FROM users WHERE role = ? AND name = ? LIMIT 1';
            params = [role, 'Bella Creator'];
        } else if (role === 'agency') {
            query = 'SELECT * FROM users WHERE role = ? AND name = ? LIMIT 1';
            params = [role, 'Diamond Agency'];
        }
        
        let [rows] = await db.query(query, params);
        
        // Fallback to first available if the specific named user is deleted
        if (rows.length === 0) {
            [rows] = await db.query('SELECT * FROM users WHERE role = ? LIMIT 1', [role]);
        }
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'No user found for this role' });
        }
        
        const user = rows[0];
        const token = generateToken(user);
        
        delete user.password;
        
        res.json({ token, user });
    } catch (error) {
        console.error('Quick login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getMe = async (req, res) => {
    try {
        // req.user is set by authMiddleware
        const [rows] = await db.query(`
            SELECT u.*, 
                   a.name as agencyName, 
                   m.name as managerName 
            FROM users u
            LEFT JOIN users a ON u.agencyId = a.id
            LEFT JOIN users m ON u.managerId = m.id
            WHERE u.id = ?
        `, [req.user.id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const user = rows[0];
        delete user.password;
        
        res.json({ user });
    } catch (error) {
        console.error('getMe error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const { split_agency, split_manager, split_creator } = req.body;
        const userId = req.user.id;

        await db.query(
            'UPDATE users SET split_agency = ?, split_manager = ?, split_creator = ? WHERE id = ?',
            [split_agency, split_manager, split_creator, userId]
        );

        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ message: 'Server error updating settings' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, subtitle, avatar, password } = req.body;
        const userId = req.user.id;

        if (password) {
            await db.query(
                'UPDATE users SET name = ?, subtitle = ?, avatar = ?, password = ? WHERE id = ?',
                [name, subtitle, avatar, password, userId]
            );
        } else {
            await db.query(
                'UPDATE users SET name = ?, subtitle = ?, avatar = ? WHERE id = ?',
                [name, subtitle, avatar, userId]
            );
        }

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error updating profile' });
    }
};
