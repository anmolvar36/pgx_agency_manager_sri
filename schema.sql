CREATE DATABASE IF NOT EXISTS playgroundx_db;
USE playgroundx_db;

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('agency', 'manager', 'creator') NOT NULL,
    subtitle VARCHAR(100),
    avatar VARCHAR(255),
    walletBalance DECIMAL(10,2) DEFAULT 0.00,
    agencyId VARCHAR(50) DEFAULT NULL,
    managerId VARCHAR(50) DEFAULT NULL,
    split_agency DECIMAL(5,2) DEFAULT 0.00,
    split_manager DECIMAL(5,2) DEFAULT 0.00,
    split_creator DECIMAL(5,2) DEFAULT 100.00,
    isLive BOOLEAN DEFAULT FALSE,
    viewers INT DEFAULT 0,
    roomTitle VARCHAR(255),
    thumbnail VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agencyId) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (managerId) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS requests (
    id VARCHAR(50) PRIMARY KEY,
    senderId VARCHAR(50) NOT NULL,
    receiverId VARCHAR(50) NOT NULL,
    assignedManagerId VARCHAR(50) DEFAULT NULL,
    status ENUM('pending', 'accepted', 'declined') DEFAULT 'pending',
    type ENUM('recruit', 'transfer', 'removal') DEFAULT 'recruit',
    split_agency DECIMAL(5,2) NOT NULL,
    split_manager DECIMAL(5,2) NOT NULL,
    split_creator DECIMAL(5,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiverId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assignedManagerId) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(50) PRIMARY KEY,
    creatorId VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    grossAmount DECIMAL(10,2) NOT NULL,
    platformFee DECIMAL(10,2) NOT NULL,
    netAmount DECIMAL(10,2) NOT NULL,
    agencyAmount DECIMAL(10,2) DEFAULT 0.00,
    managerAmount DECIMAL(10,2) DEFAULT 0.00,
    creatorAmount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creatorId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(50) PRIMARY KEY,
    senderId VARCHAR(50) NOT NULL,
    receiverId VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    isRead BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiverId) REFERENCES users(id) ON DELETE CASCADE
);
