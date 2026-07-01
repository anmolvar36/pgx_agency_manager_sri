const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDB() {
    try {
        console.log('Connecting to MySQL server...');
        // Connect without database selected first to create it
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true // Essential for running multiple queries from file
        });

        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('Executing schema.sql...');
        await connection.query(schema);
        
        console.log('✅ Database and Tables initialized successfully!');
        
        // Seed initial mock users from app.js state
        await connection.query('USE playgroundx_db;');
        
        // Agency
        await connection.query(`
            INSERT IGNORE INTO users (id, name, email, password, role, subtitle, avatar, walletBalance, isLive, viewers, roomTitle)
            VALUES ('agency_diamond', 'Diamond Agency', 'agency@playgroundx.com', 'agency123', 'agency', 'Premium Talent Network', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150', 1540.00, false, 0, '')
        `);
        
        // Manager
        await connection.query(`
            INSERT IGNORE INTO users (id, name, email, password, role, subtitle, avatar, walletBalance, agencyId, isLive)
            VALUES ('mgr_mike', 'Mike Manager', 'manager@playgroundx.com', 'manager123', 'manager', 'Senior Recruiter', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150', 640.00, 'agency_diamond', false)
        `);
        
        // Creator
        await connection.query(`
            INSERT IGNORE INTO users (id, name, email, password, role, subtitle, avatar, walletBalance, agencyId, managerId, split_agency, split_manager, split_creator, isLive, viewers, roomTitle, thumbnail)
            VALUES ('crt_bella', 'Bella Creator', 'creator@playgroundx.com', 'creator123', 'creator', 'Gaming & Vibe Streamer', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150', 2890.00, 'agency_diamond', 'mgr_mike', 10, 20, 70, true, 1240, 'Chatting & Chill morning! ☕ Ask me anything!', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600')
        `);

        // Additional creators for testing
        await connection.query(`
            INSERT IGNORE INTO users (id, name, email, password, role, avatar, walletBalance, agencyId, managerId, split_agency, split_manager, split_creator, isLive, viewers)
            VALUES 
            ('crt_max', 'Max Gamer', 'max@playgroundx.com', 'pass123', 'creator', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=150', 420, 'agency_diamond', 'mgr_mike', 10, 20, 70, true, 420),
            ('crt_stella', 'Stella Star', 'stella@playgroundx.com', 'pass123', 'creator', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150', 850, 'agency_diamond', 'mgr_mike', 10, 20, 70, false, 0),
            ('crt_solo', 'Solo Creator', 'solo@playgroundx.com', 'pass123', 'creator', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150', 1100, 'agency_diamond', null, 10, 0, 90, false, 0)
        `);

        console.log('✅ Seed data inserted successfully!');
        
        await connection.end();
    } catch (error) {
        console.error('❌ Error initializing database:', error);
    }
}

initDB();
