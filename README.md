# ⚡ Variathu Power Tools — Next-Gen Commerce & Workshop Management Platform

An end-to-end, bespoke digital commerce and service workshop hub designed and engineered from the ground up for **Variathu Power Tools** (*Poyanil Junction, Kozhencherry, Kerala • Est. 2005*).

This platform combines a high-performance industrial equipment storefront with an authorized service workshop tracking engine, real-time inventory management, Kerala GST-compliant invoicing, dual WhatsApp & Email communications, and a discrete store administration system.

---

## 🌟 Core Systems & Key Features

### 1. 📱 Interactive Customer Storefront & Catalog
* **App-Style Mobile Navigation:** Native app-like bottom navigation on mobile devices (`Home`, `Shop`, `Orders`, `Account`), keeping primary actions within thumb reach.
* **Instant Search & Multi-Filters:** Real-time search with multi-parameter filtering across brands (iBELL, Bosch, Makita, Dewalt, Stanley), categories, cordless/corded variants, and price ranges.
* **Live Stock Verification:** Real-time inventory counters and low-stock indicators that sync state instantly to prevent overselling.
* **Buy Now & Flexible Cart:** Quick one-click "Buy Now" checkout alongside an interactive Cart Drawer and dedicated Cart Page with responsive pricing breakdowns.

### 2. 🚚 Dual Delivery & Transparent Kerala Shipping
* **Express Courier Delivery (Kerala):** Automated per-item courier fee calculation supporting door-step delivery via **Delhivery** and nearest-hub collection via **APS (Alleppey Parcel Service), DTDC, and The Professional Couriers**.
* **Store Counter Pickup:** Customers can choose instant collection at the Kozhencherry showroom with zero delivery fees and counter verification passes.
* **Dynamic Courier Rate Aggregation:** Real-time fee recalculation ensuring exact per-item rates are preserved while store pickup remains completely free.

### 3. 💳 Kerala GST Compliance & Digital Payments
* **Razorpay Gateway Integration:** Seamless payments supporting UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, NetBanking, and Wallets with verified server-side HMAC signatures.
* **Statutory Kerala GST Invoicing:** Automatic calculation of CGST (9%) and SGST (9%), financial year sequence billing (e.g. `VPT/26-27/...`), statutory HSN/SAC codes, and dispatch serial numbers.
* **Official A4 Printable Invoices:** High-resolution, clean print layout tailored for physical A4 printing, GST billing, and transport waybills.

### 4. 🛠️ Authorized Equipment Workshop & Repair Engine
A purpose-built lifecycle management system designed specifically for industrial tool repair shops:
* **Dual Job Tracking:** Every tool is assigned a unique Repair ID (e.g. `VPT-REP-8021`) and a Workshop Job Card Number (e.g. `JC-1042`).
* **Live Status Stages:** Customers and technicians track equipment progress across:
  - 📥 `Received`
  - 🔍 `Diagnosing`
  - ⚙️ `Waiting for Spares`
  - ⏳ `Repair in Progress (Not Ready)`
  - ✅ `Repaired & Ready`
  - 🤝 `Handed Over`
* **Printable Job Card Customer Slip:** Formal A4 customer receipt with store branding, GST identification, customer details, barcode, QR verification, and statutory service terms.
* **OTP-Secured Tool Release:** Equipment can only be handed over after verifying a dynamic 4-digit Handover OTP sent to the registered customer, preventing tool misplacement.
* **Workshop Revenue & Accounts Statement:** Dedicated accounts tab in the admin dashboard tracking total billed repairs, advance collected, and pending balances with an isolated A4 printable financial statement.

### 5. 🔐 Frictionless Unified Authentication
* **Single Adaptive Input:** Customers sign in using either their **10-digit mobile number** or **registered email address** with automatic Indian flag (`+91`) detection.
* **Passwordless OTP:** Cryptographically generated 6-digit numeric OTPs (`crypto.randomInt`) dispatched across SMS, WhatsApp, and Email.
* **Discrete Store Staff & Admin Login:** Normal visitors see no administrative links. Entering authorized staff credentials seamlessly triggers secure password verification.

### 6. 🛡️ Discrete Store Administration Hub (`/admin`)
An isolated, high-productivity control center accessible exclusively by authenticated store staff:
* **Interactive Guided Tours:** Integrated **Driver.js** step-by-step walkthroughs for Overview, Orders, Inventory, Repairs, Cancellations, Customers, and Coupons.
* **10-per-Page Performance Pagination:** Smooth previous/next paginated navigation for Customer Orders and Workshop Repairs to maintain optimal loading speeds.
* **Mobile-Optimized Add/Edit Equipment Modal:** 
  - Responsive 1-column layout on mobile devices.
  - Direct Cloudinary CDN photo uploads with automatic compression and deletion garbage collection.
  - Statutory HSN/SAC code selector, per-tool coupon assignment, and custom warranty builder.
  - Outside-click protection to prevent accidental data loss.
* **Staff Access Management:** Multi-tier staff role assignment (Admin, Technician, Billing, Sales) with automated WhatsApp onboarding messages containing credentials.
* **Order Pipeline & Courier AWB Tracking:** One-click order status progression, courier partner assignment, and live tracking links.
* **Cancellation & Restock Manager:** Structured 2-column cancellation review with instant stock replenishment rollback and customer notifications.
* **CRM Customer Directory:** Quick customer lookups with purchase history, active repair tickets, and direct WhatsApp chat launchers.

### 7. 📡 Automated Dual-Channel Communication Engine
* **Meta WhatsApp Cloud API (`v22.0`):** Rich transactional updates for order placements, dispatches, repair stages, handover OTPs, and staff onboarding alerts.
* **Resend Transactional Email:** Branded, responsive HTML emails for welcome messages, order confirmations, and official GST tax invoices.

---

## 🏗️ Technical Stack

```
┌────────────────────────────────────────────────────────────────────────┐
│                               FRONTEND                                 │
│  React 19 • Vite 8 • React Router v7 • Vanilla CSS Design System       │
│  Lucide React • Driver.js • JsBarcode • Vercel Analytics & Speed       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ REST API / JSON
┌───────────────────────────────────▼────────────────────────────────────┐
│                                BACKEND                                 │
│  Node.js (v18+) • Express • Mongoose • Cloudinary • Crypto Security   │
└─────────────┬─────────────────────┬─────────────────────┬──────────────┘
              │                     │                     │
    ┌─────────▼────────┐  ┌─────────▼────────┐  ┌─────────▼────────┐
    │  MongoDB Atlas   │  │  Resend Email    │  │  Meta WhatsApp   │
    │  Mumbai Cluster  │  │  Transactional   │  │    Cloud API     │
    └──────────────────┘  └──────────────────┘  └──────────────────┘
```

### Frontend (`/client`)
| Layer | Technology |
| :--- | :--- |
| **Framework & Build** | React 19 + Vite 8 |
| **Design System** | Custom Vanilla CSS with tokenized variables & responsive mobile layouts |
| **Routing** | React Router v7 |
| **Icons & UI Utilities** | Lucide React, HugeIcons, Canvas Confetti |
| **Guided Tours** | Driver.js |
| **Barcodes** | JsBarcode |
| **Telemetry** | `@vercel/analytics`, `@vercel/speed-insights` |
| **Payments** | Razorpay Standard Checkout SDK |

### Backend (`/server`)
| Layer | Technology |
| :--- | :--- |
| **Runtime & Framework** | Node.js (v18+) + Express |
| **Database & ODM** | MongoDB Atlas (`ap-south-1` Mumbai) via Mongoose |
| **Image CDN & Storage** | Cloudinary SDK (Direct optimization & auto-purging) |
| **Security & Auth** | JWT (`jsonwebtoken`), in-memory rate-limited OTP vaults, crypto random generation |
| **Email Service** | Resend Node SDK |
| **Messaging Service** | Meta WhatsApp Cloud API |
| **Payment Gateway** | Razorpay Node.js SDK |

---

## 📁 Repository Structure

```
├── client/                              # Frontend Web Application
│   ├── public/                          # Static assets & Store Logo
│   ├── src/
│   │   ├── components/                  # Reusable UI components
│   │   │   ├── AddEquipmentModal.jsx    # Mobile-responsive add/edit product modal
│   │   │   ├── CartDrawer.jsx           # Slide-out cart drawer
│   │   │   ├── GstInvoiceModal.jsx      # Official A4 GST tax invoice generator
│   │   │   ├── JobCardPrintModal.jsx    # Printable workshop job card slip
│   │   │   ├── Navbar.jsx               # Desktop header & mobile bottom navigation
│   │   │   ├── ProductCard.jsx          # Catalog item card with live preview
│   │   │   └── ...
│   │   ├── context/                     # Global Auth, Cart & Confirmation state
│   │   ├── pages/                       # Primary views
│   │   │   ├── StoreDashboardPage.jsx   # Full-featured staff & admin control center
│   │   │   ├── CheckoutPage.jsx         # 3-step checkout with Kerala delivery & pickup
│   │   │   ├── CustomerAccountPage.jsx  # Customer order history, repairs & cancellations
│   │   │   ├── HomePage.jsx             # Showcase landing page
│   │   │   ├── ShopPage.jsx             # Searchable equipment catalog
│   │   │   └── TrackingPage.jsx         # Live courier & workshop tracker
│   │   ├── services/                    # API client (`api.js`) & Guided tours (`tourService.js`)
│   │   └── utils/                       # Courier partner resolvers & image optimizers
│   └── vite.config.js
│
├── server/                              # Backend API Server
│   ├── routes/                          # Express controllers
│   │   ├── authRoutes.js                # Unified customer OTP & staff login
│   │   ├── orderRoutes.js               # Order placement, updates & cancellations
│   │   ├── paymentRoutes.js             # Razorpay order generation & signature validation
│   │   ├── productRoutes.js             # Inventory CRUD & Cloudinary uploads
│   │   ├── repairRoutes.js              # Workshop repair jobs, Job Cards & OTP handovers
│   │   └── staffRoutes.js               # Staff accounts, roles & WhatsApp onboarding
│   ├── services/
│   │   ├── emailService.js              # Resend email templates & tax invoices
│   │   └── whatsappService.js           # Meta WhatsApp Cloud API dispatcher
│   ├── utils/
│   │   └── db.js                        # MongoDB Atlas connection & Mongoose schemas
│   └── server.js                        # Server entrypoint, CORS & error handlers
│
└── package.json                         # Root workspace runner (concurrently)
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **MongoDB Atlas** account or local MongoDB instance

### 2. Clone Repository & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/Majorshot/toolsshop.git
cd toolsshop

# Install all dependencies (root, server, and client)
npm install
npm --prefix server install
npm --prefix client install
```

### 3. Configure Environment Variables

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
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Create `.env` in `/client`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### 4. Run Locally

Start both the backend server and frontend client concurrently with a single command from the project root:

```bash
npm run dev
```

* **Frontend:** `http://localhost:3000`
* **Backend API:** `http://localhost:5000`
* **Admin Dashboard:** `http://localhost:3000/admin`

To build the client bundle for production:
```bash
npm run build
```

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
