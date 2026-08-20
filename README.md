# LogiCore - Supply Chain Management System

A comprehensive supply chain management system built with React, Node.js, Express, and MySQL.

## Features

- 🔐 **Authentication & Authorization** - JWT-based auth with role-based access control
- 📦 **Product Management** - Full CRUD with categories, suppliers, and inventory tracking
- 🏭 **Supplier Management** - Supplier profiles, performance tracking, and purchase orders
- 🏬 **Warehouse Management** - Multi-warehouse support with capacity tracking
- 📊 **Inventory Management** - Real-time stock tracking, transfers, and adjustments
- 📋 **Purchase Orders** - Complete PO workflow from draft to received
- 🛒 **Customer Orders** - Order management with inventory reservation
- 🚚 **Shipment Management** - Shipment tracking with driver assignment
- 📈 **Dashboard & Reports** - Real-time analytics and comprehensive reports
- 🔔 **Notifications** - Real-time notifications for important events
- 📝 **Audit Logging** - Complete activity tracking for compliance

## Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router
- Axios
- React Hook Form
- Recharts
- React Hot Toast

### Backend
- Node.js
- Express.js
- Sequelize ORM
- MySQL
- JWT Authentication
- bcrypt
- express-validator

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@logicore.com | Password123! |
| Warehouse Manager | manager@logicore.com | Password123! |
| Supplier | supplier@logicore.com | Password123! |
| Driver | driver@logicore.com | Password123! |
| Customer | customer@logicore.com | Password123! |

## Installation

### Prerequisites
- Node.js 18+
- MySQL 8+
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Update .env with your database credentials
npx sequelize-cli db:create
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
npm run dev