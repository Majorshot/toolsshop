# ⚡ Variathu Power Tools — Next-Gen Commerce & Workshop Management Platform

An end-to-end, bespoke digital commerce and service workshop hub designed and engineered from the ground up for **Variathu Power Tools** (*Poyanil Junction, Kozhencherry, Kerala • Est. 2005*).

This platform combines a high-performance equipment storefront with an integrated authorized service workshop tracking engine, real-time inventory management, dual WhatsApp & Email communications, and a discrete store administration system.

---

## 🌟 Architectural Highlights & Core Systems

### 1. 📱 Mobile-First Interactive Storefront
* **App-Style Bottom Navigation:** Engineered with a native app-like bottom bar on mobile devices (`Home`, `Shop`, `Orders`, `Account`), keeping all primary actions easily within thumb reach.
* **Instant Equipment Catalog:** Real-time search with multi-parameter filtering across brands (Bosch, Makita, Dewalt, Stanley), tool categories, voltage ratings, and price bands.
* **Live Stock Verification:** Dynamic inventory counters that prevent overselling and sync state instantly across concurrent customer sessions.

### 2. 🔐 Frictionless Unified Authentication
* **Single Smart Input:** Customers sign in using either their **10-digit mobile number** or **registered email address** via a single adaptive input.
* **Dynamic Iconography:** The input intelligently shifts its visual badge between the Indian flag (`+91`) and an email icon based on input character patterns.
* **Smart Tab Routing:** Entering an unregistered email automatically maps it to the Email Address field when switching to *New Customer* registration, eliminating re-typing.
* **One-Time Passwords (OTP):** High-entropy 6-digit numeric codes generated with cryptographic security (`crypto.randomInt`), dispatched simultaneously across SMS, WhatsApp, and Email.
* **Zero Public Admin Footprint:** Normal visitors see no administrative links or staff toggles. The platform dynamically detects store administrator credentials and shifts to password verification seamlessly.

### 3. 🛠️ Integrated Equipment Workshop & Repair Tracker
A purpose-built lifecycle management system designed specifically for industrial tool repair workshops:
* **Unique Job Identification:** Every tool brought to the Kozhencherry counter receives a tracking ID (e.g. `VPT-REP-8021`).
* **Live Repair Stages:** Customers can monitor equipment progress online across distinct phases:
  - 📥 `Received`
  - 🔍 `Diagnosing`
  - ⚙️ `Waiting for Spares`
  - ✅ `Repaired & Ready`
  - 🤝 `Handed Over`
* **OTP-Secured Handover:** Tools can only be released upon verifying a dynamic 4-digit Handover OTP generated for the registered customer, ensuring zero tool misplacement.

### 4. 💳 Frictionless Checkout & Kerala GST Compliance
* **Payment Flexibility:** Integrated with **Razorpay** for digital payments (UPI, Cards, NetBanking, Wallets) along with Cash on Delivery (COD) and Store Pickup Handover.
* **Tax Invoicing:** Automatic calculation of CGST (9%) and SGST (9%) compliant with Kerala state tax standards.
* **Store Counter Pickup Pass:** Customers choosing local pickup at Kozhencherry receive a digital pickup pass with counter verification codes.

### 5. 🎨 Dynamic Visual Order Pipeline
Orders are presented in status cards using a dedicated pastel color-coding taxonomy for instant visual recognition:
* 🔵 **Ordered:** `#eff6ff` (Soft Blue) — Order acknowledged and queued for processing.
* 🟠 **Dispatched:** `#fff7ed` (Soft Orange) — Packed with courier partner and AWB tracking details.
* 🟢 **Completed:** `#f0fdf4` (Soft Green) — Delivered or collected at the workshop counter.
* 🔴 **Cancelled:** `#fef2f2` (Soft Red) — Cancelled with automated stock rollback.

### 6. 📡 Automated Dual-Channel Communication Engine
* **WhatsApp Cloud API:** Dispatches rich transaction receipts, delivery notices, and security codes directly to the customer's WhatsApp chat from the official business profile.
* **Resend Transactional Email:** Generates branded, responsive HTML tax invoices, order receipts, and welcome digests.
* **Resilient Sandbox Fallback:** Automatically intercepts and reroutes test messages during development without failing transactions.

### 7. 🛡️ Discrete Store Administration Hub (`/admin`)
An isolated, high-productivity control center accessible exclusively by authenticated store staff:
* **Real-Time Revenue Telemetry:** Gross sales, pending orders, and active repair metrics.
* **Inventory Control:** Live stock adjustments, low-stock alerts, and pricing updates.
* **Order Fulfillment Pipeline:** One-click status transitions, courier partner assignment, and AWB tracking number injection.
* **Workshop Workbench:** Technician diagnostic notes, cost estimation, advance payment logging, and final billing.
* **Promotions Engine:** Single-use and multi-use coupon code generation with per-user limits and validity expiration.

---

## 🏗️ Technical Stack

```
┌────────────────────────────────────────────────────────┐
│                      FRONTEND                          │
│  React 19 • Vite • React Router v7 • Vanilla CSS      │
│  Lucide React • Canvas Confetti • Responsive Viewports │
└──────────────────────────┬─────────────────────────────┘
                           │ REST API / JSON
┌──────────────────────────▼─────────────────────────────┐
│                       BACKEND                          │
│  Node.js • Express • Mongoose • Crypto Random Security │
└────────────┬─────────────┬─────────────┬───────────────┘
             │             │             │
   ┌─────────▼──────┐ ┌────▼───────┐ ┌───▼────────────┐
   │ MongoDB Atlas  │ │  Resend    │ │ Meta WhatsApp  │
   │  Mumbai Cloud  │ │ Transaction│ │   Cloud API    │
   │    Cluster     │ │   Emails   │ │  Notifications │
   └────────────────┘ └────────────┘ └────────────────┘
```

### Frontend (`/client`)
| Layer | Technology |
| :--- | :--- |
| **Core Framework** | React 19 + Vite |
| **Design System** | Custom Vanilla CSS with tokenized variables (Dark/Light harmony) |
| **Client Routing** | React Router v7 |
| **Icons & Micro-Interactions** | Lucide React, Canvas Confetti |
| **Gateway Client** | Razorpay Standard Checkout JS SDK |

### Backend (`/server`)
| Layer | Technology |
| :--- | :--- |
| **Runtime & Server** | Node.js (v18+) with Express |
| **Primary Database** | MongoDB Atlas (Hosted in Mumbai AWS `ap-south-1`) via Mongoose |
| **Security & Auth** | JWT (`jsonwebtoken`), Constant-time credential comparison, Rate-limited in-memory OTP vaults |
| **Transactional Email** | Resend Node SDK |
| **Messaging Engine** | Meta WhatsApp Cloud API (`v22.0`) |
| **Payment Gateway** | Razorpay Node.js SDK |

---

## 📁 Repository Structure

```
├── client/                      # Frontend Application
│   ├── public/                  # Static assets & Store Logo
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── AnimatedContent.jsx
│   │   │   ├── CheckoutModal.jsx
│   │   │   ├── CodeSlots.jsx    # Custom 6-digit OTP slot inputs
│   │   │   ├── Navbar.jsx       # Adaptive desktop header & mobile nav
│   │   │   └── ...
│   │   ├── context/             # Global Auth, Cart & Store state providers
│   │   ├── pages/               # Application Views
│   │   │   ├── AdminDashboard.jsx # Store Owner Administration Portal
│   │   │   ├── CheckoutPage.jsx # Multi-step checkout pipeline
│   │   │   ├── HomePage.jsx     # Landing showcase & featured equipment
│   │   │   ├── LoginPage.jsx    # Unified Phone/Email customer & admin sign-in
│   │   │   ├── ShopPage.jsx     # Searchable product catalog
│   │   │   └── TrackingPage.jsx # Workshop repair & courier delivery tracker
│   │   ├── services/            # Client HTTP API client (`api.js`)
│   │   └── index.css            # Custom Design System
│   └── vite.config.js
│
└── server/                      # Backend API Engine
    ├── routes/                  # Express route controllers
    │   ├── authRoutes.js        # Phone/Email OTP, registration & secure admin login
    │   ├── orderRoutes.js       # Order creation, verification & status management
    │   ├── paymentRoutes.js     # Razorpay order generation & HMAC signature verification
    │   ├── productRoutes.js     # Equipment catalog & category management
    │   └── repairRoutes.js      # Workshop repair jobs & OTP handover verification
    ├── services/
    │   ├── emailService.js      # Resend automated tax invoices & templates
    │   └── whatsappService.js   # Meta WhatsApp Cloud API messaging
    ├── utils/
    │   └── db.js                # MongoDB Atlas connection & resilient data layer
    └── server.js                # Express app entrypoint & middleware
```

---

## 🚀 Local Development Setup

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/Majorshot/toolsshop.git
cd toolsshop

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment Variables

Create `.env` in `/server`:
```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
STORE_ADMIN_EMAIL=admin@variathupowertools.com
STORE_ADMIN_PASSWORD=your_secure_password
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=Variathu Power Tools <orders@yourdomain.com>
WHATSAPP_PHONE_NUMBER_ID=your_meta_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_meta_system_user_token
```

Create `.env` in `/client`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### 3. Launch the Application

```bash
# Terminal 1: Launch Backend API Server (Port 5000)
cd server
npm run dev

# Terminal 2: Launch Frontend Dev Server (Port 3000)
cd client
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 📍 Store Profile & Workshop Details

* **Business:** Variathu Power Tools
* **Showroom & Workshop:** Poyanil Junction, Kozhencherry, Pathanamthitta District, Kerala — 689641
* **Store Hours:** Monday – Saturday: `8:00 AM – 8:00 PM` (Closed Sundays)
* **Helpline & WhatsApp Support:** `+91 94475 59333`
* **Google Maps Location:** [Directions to Workshop](https://maps.app.goo.gl/YXTeLEdnMQkeNWjK8)

---

## 📄 License

Proprietary Software — Built specifically for **Variathu Power Tools**. All rights reserved.
