const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setupDatabase() {
  let connection;
  
  try {
    // First connect without database to create it if needed
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });
    
    console.log('Connected to MySQL server');
    
    // Create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'logicore'}`);
    console.log('Database created/verified');
    
    await connection.query(`USE ${process.env.DB_NAME || 'logicore'}`);
    
    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role ENUM('admin', 'warehouse_manager', 'supplier', 'driver', 'customer') DEFAULT 'customer',
        warehouse_id INT,
        status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Users table created');
    
    // Check if admin exists
    const [existingUsers] = await connection.query('SELECT COUNT(*) as count FROM users');
    
    if (existingUsers[0].count === 0) {
      // Create demo users
      const password = await bcrypt.hash('Password123!', 10);
      
      const users = [
        ['System Admin', 'admin@logicore.com', password, '+1234567890', 'admin', 'active'],
        ['John Manager', 'manager@logicore.com', password, '+1234567891', 'warehouse_manager', 'active'],
        ['Supplier User', 'supplier@logicore.com', password, '+1234567892', 'supplier', 'active'],
        ['Mike Driver', 'driver@logicore.com', password, '+1234567893', 'driver', 'active'],
        ['Alice Customer', 'customer@logicore.com', password, '+1234567894', 'customer', 'active']
      ];
      
      for (const user of users) {
        await connection.query(
          'INSERT INTO users (name, email, password, phone, role, status) VALUES (?, ?, ?, ?, ?, ?)',
          user
        );
      }
      
      console.log('Demo users created');
    } else {
      console.log('Users already exist, skipping');
    }
    
    // Verify users
    const [users] = await connection.query('SELECT id, name, email, role FROM users');
    console.log('\nCreated users:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - ${user.role}`);
    });
    
    console.log('\nSetup completed successfully!');
    console.log('\nYou can now login with:');
    console.log('Admin: admin@logicore.com / Password123!');
    console.log('Manager: manager@logicore.com / Password123!');
    console.log('Supplier: supplier@logicore.com / Password123!');
    console.log('Driver: driver@logicore.com / Password123!');
    console.log('Customer: customer@logicore.com / Password123!');
    
  } catch (error) {
    console.error('Setup failed:', error.message);
    console.log('\nPlease make sure:');
    console.log('1. MySQL is installed and running');
    console.log('2. Your .env file has correct database credentials');
    console.log('3. Check if MySQL password is correct');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();