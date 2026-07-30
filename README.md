# Khalid ERP — Candle Manufacturing Cloud ERP System

Production-ready enterprise ERP system replacing Google Sheets workflows for candle manufacturing companies with automated calculations, role-based access control, real-time inventory tracking, and analytics.

---

## 🌟 Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router) + React 19
- **Language**: TypeScript
- **Styling**: TailwindCSS + Next-Themes (Dark Mode)
- **Icons & Motion**: Lucide React + Framer Motion
- **Data Visualizations**: Recharts
- **Notifications**: Sonner

### Backend
- **Runtime**: Node.js (Next.js API Routes)
- **Language**: TypeScript
- **Database & ORM**: PostgreSQL + Prisma ORM
- **Security & Auth**: JWT + Refresh Token Rotation, Bcrypt (12 rounds), Helmet, Rate Limiting, CORS

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v20+ or v24+
- **Docker Desktop** (Optional for local PostgreSQL)

### 2. Setup Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Database & Seeds
Start PostgreSQL container (or use local/Supabase database):
```bash
docker-compose up -d
```

Push Prisma schema and seed database with initial records:
```bash
cd backend
npx prisma db push
npx tsx prisma/seed.ts
```

### 4. Run Backend API
```bash
cd backend
npm run dev
# Running at http://localhost:5000/api
```

### 5. Run Frontend Application
```bash
cd frontend
npm run dev
# Running at http://localhost:3000
```

---

## 🔐 Seeded Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@khaliderp.com` | `Admin@123` |
| **Production Manager** | `production@khaliderp.com` | `Admin@123` |
| **Sales Executive** | `sales@khaliderp.com` | `Admin@123` |
| **Warehouse** | `warehouse@khaliderp.com` | `Admin@123` |
| **Accountant** | `accounts@khaliderp.com` | `Admin@123` |

---

## 📊 Modules & Automated Workflows

1. **Dashboard**: 16 KPI Cards + Recharts Sales Trend & Top Customer charts
2. **Customer CRM**: Retailers, Wholesalers, Distributors with Google Maps & WhatsApp quick links
3. **Sales & Orders**: Automated GST calculations, Invoice Generation, Payment Tracking
4. **Production**: Automated Raw Material Deductions (Wax, Dyes, Oils) & Finished Goods Stock increment
5. **Batch Tracking**: Produced vs Sold vs Remaining stock tracking & Profit per batch
6. **Inventory**: Finished goods & Raw materials stock monitoring with Reorder Alerts
7. **Expense Module**: Expense logging & Approval workflow
8. **Employee HR**: Staff master & Daily Attendance logging
9. **Reports & Analytics**: ABC Inventory Analysis, RFM Customer Segmentation, Sales Forecasting
10. **Settings**: GST configuration, Invoice Prefix, RBAC matrix & DB Backup
