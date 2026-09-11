# Variathu Power Tools (toolsshop)

A modern full-stack web application for **Variathu Power Tools**, Kozhencherry, Pathanamthitta, Kerala. Features an interactive equipment storefront, real-time MongoDB Atlas inventory, customer account portal with order tracking, single-use coupon validation, store pickup OTP verification, and integrated payment flows.

---

## 🛠️ Tech Stack

### Frontend (`/client`)
* **Framework:** React 19 + Vite
* **Styling:** Custom Vanilla CSS Design System with mobile-first responsive layout
* **Routing:** React Router v7
* **Icons & FX:** Lucide React, Canvas Confetti
* **Payment Integration:** Razorpay Checkout JS

### Backend (`/server`)
* **Runtime:** Node.js & Express
* **Database:** MongoDB Atlas (with Mongoose) + local JSON resilient fallback mode
* **Integrations:** Razorpay Node SDK, Multi-Courier Logistics Hub (DTDC, The Professional Couriers, Alleppey Parcel Service & Delhivery)

---

## 🚀 Getting Started

### 1. Prerequisites
* Node.js (v18+)
* npm (v9+)

### 2. Setup Environment Variables

Copy the `.env.example` templates to `.env`:

**In `/server`:**
```bash
cp server/.env.example server/.env
```
Fill in your `MONGODB_URI`, `RAZORPAY_KEY_ID`, and `RAZORPAY_KEY_SECRET`.

**In `/client`:**
```bash
cp client/.env.example client/.env
```
Set `VITE_RAZORPAY_KEY_ID`.

---

### 3. Install Dependencies

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd ../client
npm install
```

---

### 4. Run the Application

**Start the Backend Server (Port 5000):**
```bash
cd server
npm run dev
```

**Start the Frontend Dev Server (Port 3000):**
```bash
cd client
npm run dev
```

Access the app in your browser at `http://localhost:3000`.

---

## 🌟 Key Features

* **Equipment Catalog:** Browse power tools (grinders, cutters, rotary hammers, drills) by brand, power rating, and specifications.
* **Shopping Cart & Checkout:** Real-time stock limits, store pickup (Kozhencherry counter handover) and courier delivery options.
* **Single-Use Coupons:** Dynamic coupon engine validated by customer mobile number with anti-abuse protection.
* **Store Counter Pickup Pass:** 4-digit pickup OTP generation and verification system for counter staff.
* **GST Invoice Generator:** Automated printable tax invoices for customer equipment orders.
* **Store Management Portal:** Admin dashboard for live inventory updates, order status dispatch, and customer management.
