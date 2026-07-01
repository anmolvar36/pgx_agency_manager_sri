const db = require('../config/db');
const { v4: uuidv4 } = require('uuid'); // assuming we might not have uuid, use Date.now() if needed
// Actually, let's stick to 'msg_' + Date.now() for simplicity and consistency with other controllers

exports.getContacts = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        let query = "";
        let params = [];

        // Fetch contacts based on role
        if (role === 'agency') {
            // Agency can message their managers and creators
            query = "SELECT id, name, role, avatar FROM users WHERE agencyId = ? AND id != ?";
            params = [userId, userId];
        } else if (role === 'manager') {
            // Manager can message their agency and their creators
            query = "SELECT id, name, role, avatar FROM users WHERE (agencyId = (SELECT agencyId FROM users WHERE id = ?) OR managerId = ?) AND id != ?";
            params = [userId, userId, userId];
        } else if (role === 'creator') {
            // Creator can message their manager and agency
            query = "SELECT id, name, role, avatar FROM users WHERE id = (SELECT agencyId FROM users WHERE id = ?) OR id = (SELECT managerId FROM users WHERE id = ?)";
            params = [userId, userId];
        }

        const [contacts] = await db.query(query, params);
        
        // Let's also fetch the latest message for each contact to show in the sidebar
        for (let contact of contacts) {
            const [msgs] = await db.query(`
                SELECT text, created_at FROM messages 
                WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)
                ORDER BY created_at DESC LIMIT 1
            `, [userId, contact.id, contact.id, userId]);
            
            contact.lastMessage = msgs.length > 0 ? msgs[0] : null;
        }

        res.json({ contacts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching contacts' });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const { contactId } = req.params;

        const [messages] = await db.query(`
            SELECT id, senderId, receiverId, text, created_at
            FROM messages
            WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)
            ORDER BY created_at ASC
        `, [userId, contactId, contactId, userId]);

        // Mark as read
        await db.query(`
            UPDATE messages SET isRead = true 
            WHERE senderId = ? AND receiverId = ? AND isRead = false
        `, [contactId, userId]);

        res.json({ messages });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching messages' });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { contactId } = req.params;
        const { text } = req.body;

        if (!text || text.trim() === '') {
            return res.status(400).json({ message: 'Message text is required' });
        }

        const msgId = 'msg_' + Date.now();
        await db.query(`
            INSERT INTO messages (id, senderId, receiverId, text)
            VALUES (?, ?, ?, ?)
        `, [msgId, senderId, contactId, text]);

        res.json({ message: 'Message sent successfully', id: msgId, text: text, senderId: senderId, receiverId: contactId, created_at: new Date() });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error sending message' });
    }
};
