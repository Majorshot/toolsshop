import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { safeLocalStorage } from '../utils/safeStorage';

/**
 * Driver.js Interactive Guided Tours for Variathu Power Tools Store Manager
 */

const baseDriverConfig = {
  animate: true,
  smoothScroll: true,
  allowClose: true,
  showProgress: true,
  stagePadding: 8,
  stageRadius: 12,
  popoverClass: 'vpt-driver-popover',
  nextBtnText: 'Next →',
  prevBtnText: '← Back',
  doneBtnText: 'Finish Tour 🎉',
  progressText: 'Step {{current}} of {{total}}'
};

/**
 * 1. Overview Page Interactive Tour
 * @param {boolean} force - Force start even if previously completed
 */
export const startOverviewTour = (force = false) => {
  if (typeof window === 'undefined') return;

  if (!force && safeLocalStorage.getItem('vpt_tour_overview_seen') === 'true') {
    return;
  }

  // All steps for the Store Manager Overview Dashboard
  const rawSteps = [
    {
      element: '#store-portal-header',
      popover: {
        title: '🏪 Store Owner Command Center',
        description: 'Welcome to your digital showroom dashboard for Variathu Power Tools, Poyanil Building, Kozhencherry! From here, you have complete visibility over daily revenue, online orders, store pickup OTP handovers, inventory stock, and workshop clinic repairs.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '.dashboard-sidebar-nav',
      popover: {
        title: '🧭 Navigation & Store Departments',
        description: 'Switch instantly between all departments: Customer Orders, Inventory & Equipment Catalog, Cancellation Requests, Customer CRM Directory, Coupons & Discounts, and Workshop Repairs.',
        side: 'right',
        align: 'start'
      }
    },
    {
      element: '#store-daily-action-banner',
      popover: {
        title: '⚡ Daily Action Center',
        description: 'Your morning operational checklist! Gives you 1-click shortcut badges to jump straight to orders needing courier dispatch, tools awaiting counter pickup, cancellation review requests, or low-inventory restocks.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#store-audio-sync-controls',
      popover: {
        title: '🔔 Real-Time Audio Chime & 30s Cloud Sync',
        description: 'Never miss an order! An audible chime plays whenever a customer books equipment anywhere in Kerala. The portal also auto-syncs with MongoDB Atlas every 30 seconds.',
        side: 'bottom',
        align: 'end'
      }
    },
    {
      element: '.store-analytics-header',
      popover: {
        title: '📊 Financial Reports & Timeframes',
        description: 'Analyze store performance across Today, This Week, This Month, or All Time. View revenue trends, sales volume, and payment channels in real time.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#btn-export-orders-csv',
      popover: {
        title: '📥 1-Click Excel / Tally CSV Export',
        description: 'Export all customer orders, itemized machinery, customer GSTIN, HSN codes, and CGST/SGST 9% tax breakdown directly into an Excel CSV file for accounting and GST filing.',
        side: 'bottom',
        align: 'end'
      }
    },
    {
      element: '.store-analytics-grid',
      popover: {
        title: '📈 Department Performance Metrics',
        description: 'Instant overview of your business metrics: Online UPI vs Counter Cash split, Store Counter Pickup vs Courier Express fulfillment, and active workshop servicing tickets.',
        side: 'top',
        align: 'center'
      }
    },
    {
      element: '#hub-card-orders',
      popover: {
        title: '📦 Customer Orders & Fast OTP',
        description: 'Fulfill orders, generate DTDC/TPC courier tracking AWBs, print official Kerala GST tax invoices, and verify 4-digit customer pickup codes before handing over machinery.',
        side: 'top',
        align: 'start'
      }
    },
    {
      element: '#hub-card-inventory',
      popover: {
        title: '⚙️ Equipment Catalog & Stock Control',
        description: 'Add new power tools, manage Bosch/Makita/DeWalt brands, update live stock levels, adjust prices, and print physical barcode labels for your showroom shelves.',
        side: 'top',
        align: 'start'
      }
    },
    {
      element: '#hub-card-repairs',
      popover: {
        title: '🔧 Workshop Servicing Clinic',
        description: 'Log inward broken tools, update spare parts and repair costs with automated WhatsApp updates to customers, and verify secret 4-digit handover OTPs.',
        side: 'top',
        align: 'start'
      }
    },
    {
      element: '#btn-start-overview-tour',
      popover: {
        title: '🎉 You\'re Ready to Run Your Store!',
        description: 'You can replay this interactive walkthrough anytime by clicking "Take Tour" in the top bar. Click "Finish Tour" to get started!',
        side: 'bottom',
        align: 'end'
      }
    }
  ];

  // Only include steps whose DOM elements actually exist in current view
  const validSteps = rawSteps.filter(step => {
    const el = document.querySelector(step.element);
    return el && el.offsetParent !== null; // Element is visible in layout
  });

  if (validSteps.length === 0) return null;

  const driverObj = driver({
    ...baseDriverConfig,
    steps: validSteps,
    onDestroyed: () => {
      safeLocalStorage.setItem('vpt_tour_overview_seen', 'true');
    }
  });

  driverObj.drive();
  return driverObj;
};

/**
 * 2. Customer Orders Management Interactive Tour
 * @param {boolean} force - Force start even if previously completed
 */
export const startOrdersTour = (force = false) => {
  if (typeof window === 'undefined') return;

  if (!force && safeLocalStorage.getItem('vpt_tour_orders_seen') === 'true') {
    return;
  }

  const rawSteps = [
    {
      element: '#orders-section-header',
      popover: {
        title: '📦 Customer Orders Management Center',
        description: 'Welcome to your Orders Hub! Monitor incoming online purchases and counter pickups across Kozhencherry and Kerala in real time. Changes made here instantly update the customer\'s live order screen.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '.store-order-status-chips-wrap',
      popover: {
        title: '🏷️ Quick Status Filtering & Action Counts',
        description: 'Filter orders by progress stage: All, Today\'s Orders, Undispatched (needs packing & AWB), Dispatched (in transit), Counter Pickup (awaiting store collection), Completed, and Cancelled. Drag horizontally or use arrow buttons to scroll.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#input-order-search',
      popover: {
        title: '🔍 Fast Multi-Attribute Search',
        description: 'Instantly find any order by typing an Order ID (e.g. VPT-ORD-510246), customer name, 10-digit phone number, town/district, courier AWB tracking number, or equipment name.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#input-fast-otp-lookup',
      popover: {
        title: '⚡ Fast 4-Digit Pickup OTP Verification',
        description: 'When a customer visits your showroom in Kozhencherry to collect their power tool, simply type their 4-digit secret OTP here. The system instantly pulls up the order for immediate 1-click handover verification!',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '.store-orders-filter-grid',
      popover: {
        title: '🎛️ Advanced Filtering & Sorting',
        description: 'Filter orders with precision using dropdown selectors for Date range (Today, 7 Days, Month), Delivery Method (Courier Express vs Counter Pickup), Payment Channel (Online UPI vs Pay at Counter), and Sort order.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#btn-view-cards',
      popover: {
        title: '🎴 Cards vs Compact Table Views',
        description: 'Choose your preferred working view: Visual Cards (expanded packing photos and full customer details) or Compact Table (high-density rows for rapid scanning of dozens of orders).',
        side: 'bottom',
        align: 'end'
      }
    },
    {
      element: '.store-order-card:first-of-type',
      popover: {
        title: '📋 Order Anatomy & Customer Contact',
        description: 'Each order card displays order status badges, customer name, delivery address, and total amount. Click the phone number to call, or click WhatsApp to start an instant pre-filled chat with the customer.',
        side: 'top',
        align: 'start'
      }
    },
    {
      element: '.store-order-card:first-of-type .store-order-items-box',
      popover: {
        title: '⚙️ Packing List & Equipment Items',
        description: 'Displays verified equipment images, manufacturer brands (Honda, Bosch, Makita, DeWalt, Stihl), quantities, and unit prices so store staff can pack the exact tools and accessories ordered.',
        side: 'top',
        align: 'start'
      }
    },
    {
      element: '.store-order-card:first-of-type button[id^="btn-print-label-"], .store-order-card:first-of-type button[id^="btn-dispatch-order-"]',
      popover: {
        title: '🚚 Courier Dispatch & 4x6 Shipping Labels',
        description: 'Book consignments with DTDC, The Professional Couriers (TPC), or India Post Speed Post. Generate ready-to-print 4x6 thermal barcode shipping labels with sender & recipient addresses to affix to shipping boxes.',
        side: 'top',
        align: 'end'
      }
    },
    {
      element: '.store-order-card:first-of-type button[id^="btn-print-invoice-"]',
      popover: {
        title: '🧾 Kerala GST Tax Invoice (18% CGST/SGST)',
        description: 'Generate and print an official, legally compliant GST tax invoice featuring Variathu Power Tools\' GSTIN, Kerala state code 32, itemized HSN codes, 9% CGST + 9% SGST breakdown, and store seal.',
        side: 'top',
        align: 'end'
      }
    },
    {
      element: '.store-order-card:first-of-type button[id^="btn-cancel-order-"]',
      popover: {
        title: '❌ Order Cancellation & 1-Click Online Refund',
        description: 'Cancel an order with a recorded reason. If the customer paid online via Razorpay UPI/Cards, an automatic 100% refund is initiated back to their original bank account instantly.',
        side: 'top',
        align: 'end'
      }
    },
    {
      element: '#btn-start-orders-tour',
      popover: {
        title: '🎉 You\'re Ready to Manage Orders!',
        description: 'You can replay this interactive tour anytime by clicking \'Take Tour\'. Real-time audio chimes and 30-second background sync ensure you never miss a new booking!',
        side: 'bottom',
        align: 'end'
      }
    }
  ];

  const validSteps = rawSteps.filter(step => {
    const el = document.querySelector(step.element);
    return el && el.offsetParent !== null;
  });

  if (validSteps.length === 0) return null;

  const driverObj = driver({
    ...baseDriverConfig,
    steps: validSteps,
    onDestroyed: () => {
      safeLocalStorage.setItem('vpt_tour_orders_seen', 'true');
    }
  });

  driverObj.drive();
  return driverObj;
};

/**
 * 3. Inventory & Equipment Management Interactive Tour
 * @param {boolean} force - Force start even if previously completed
 */
export const startInventoryTour = (force = false) => {
  if (typeof window === 'undefined') return;

  if (!force && safeLocalStorage.getItem('vpt_tour_inventory_seen') === 'true') {
    return;
  }

  const rawSteps = [
    {
      element: '#inventory-section-header',
      popover: {
        title: '⚙️ Inventory & Equipment Control',
        description: 'Complete control over your power tools showroom! Add new machinery, adjust live stock levels, modify selling prices, and manage brands like Honda, Bosch, Makita, and DeWalt.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#btn-add-tool-modal',
      popover: {
        title: '➕ Add New Machinery to Storefront',
        description: 'List a new power tool or spare part in seconds. Upload equipment photos, configure technical specifications (voltage, wattage, warranty), set showroom selling price, and specify warehouse stock.',
        side: 'bottom',
        align: 'end'
      }
    },
    {
      element: '#input-inventory-search',
      popover: {
        title: '🔍 Instant Catalog Search',
        description: 'Quickly find tools by name (e.g. Brushcutter, Chainsaw), manufacturer brand, category, or SKU code with instant real-time filtering as you type.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '.store-inv-filter-brand-wrap',
      popover: {
        title: '🏷️ Filter by Manufacturer Brand',
        description: 'Filter equipment models by manufacturer—including Bosch, DeWalt, Makita, Honda, Stihl, and iBell—complete with live product counts for each brand.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '.store-inv-filter-category-wrap',
      popover: {
        title: '📂 Filter by Tool Category',
        description: 'Drill down into specific machinery categories: Grass Cutters, Cordless Drills, Chainsaws, Demolition Hammers, Angle Grinders, or Welding Machines.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#btn-filter-low-stock',
      popover: {
        title: '⚠️ 1-Click Low Stock Alert Filter',
        description: 'Instantly filters the list to show tools with 3 or fewer units remaining in showroom inventory, helping you prevent stockouts before customer orders fail.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#btn-reorder-whatsapp',
      popover: {
        title: '📲 1-Click WhatsApp Distributor Reorder',
        description: 'Automatically compiles a structured Purchase Order of all low-stock machinery grouped by manufacturer brand with recommended reorder quantities and opens WhatsApp to message your distributor representative immediately!',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '.store-product-item-card:first-of-type',
      popover: {
        title: '📋 Equipment Item Overview',
        description: 'Shows the tool thumbnail, brand, category, title, stock indicator, and price. Click the external link icon next to the tool name to view its live public page on the customer storefront.',
        side: 'top',
        align: 'start'
      }
    },
    {
      element: '.store-product-item-card:first-of-type .store-stock-stepper',
      popover: {
        title: '⚡ Quick Inline Stock Stepper (− / +)',
        description: 'Increment or decrement stock with 1 click directly from the list without opening modals. Changes sync instantly across all store devices and reflect live on customer checkout screens.',
        side: 'top',
        align: 'start'
      }
    },
    {
      element: '.store-product-item-card:first-of-type .store-product-price-section',
      popover: {
        title: '✏️ 1-Click Inline Price Quick Edit',
        description: 'Click directly on any price to quickly change the selling price. Hit Enter to save immediately without opening the full editor modal.',
        side: 'top',
        align: 'end'
      }
    },
    {
      element: '.store-product-item-card:first-of-type .store-btn-edit',
      popover: {
        title: '📝 Full Product Editor & Specifications',
        description: 'Open the comprehensive product modal to update high-res photo URLs, technical specifications, cordless battery options, warranty details, and customer descriptions.',
        side: 'top',
        align: 'end'
      }
    },
    {
      element: '#btn-start-inventory-tour',
      popover: {
        title: '🎉 You\'re Ready to Manage Inventory!',
        description: 'You can replay this interactive guide at any time by clicking \'Take Tour\'. Keep your stock updated so customers always see accurate showroom availability!',
        side: 'bottom',
        align: 'end'
      }
    }
  ];

  const validSteps = rawSteps.filter(step => {
    const el = document.querySelector(step.element);
    return el && el.offsetParent !== null;
  });

  if (validSteps.length === 0) return null;

  const driverObj = driver({
    ...baseDriverConfig,
    steps: validSteps,
    onDestroyed: () => {
      safeLocalStorage.setItem('vpt_tour_inventory_seen', 'true');
    }
  });

  driverObj.drive();
  return driverObj;
};

/**
 * 4. Workshop Servicing & Tool Repairs Interactive Tour
 * @param {boolean} force - Force start even if previously completed
 */
export const startRepairsTour = (force = false) => {
  if (typeof window === 'undefined') return;

  if (!force && safeLocalStorage.getItem('vpt_tour_repairs_seen') === 'true') {
    return;
  }

  const rawSteps = [
    {
      element: '#repairs-section-header',
      popover: {
        title: '🔧 Workshop Servicing & Repairs Tracker',
        description: 'Track and manage broken power tools (armatures, field coils, carbon brushes, gearboxes, chainsaws) brought into your Poyanil Building workshop.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#btn-new-repair-modal',
      popover: {
        title: '📝 Log Inward Machinery Ticket',
        description: 'Create a new repair job in seconds! Enter customer details, tool brand & model, serial number, reported fault, initial estimate, and advance paid. Automatically sends a WhatsApp receipt to the customer.',
        side: 'bottom',
        align: 'end'
      }
    },
    {
      element: '#input-search-repairs',
      popover: {
        title: '🔍 Real-Time Job Ticket Search',
        description: 'Instantly find any repair job by customer name, 10-digit mobile number, tool model, brand, or Ticket ID (e.g. VPT-REP-2433).',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: 'div[id^="repair-row-"]:first-of-type, .store-tab-content-card',
      popover: {
        title: '🛠️ Service Ticket Anatomy',
        description: 'Displays the Ticket ID, machinery model, customer contact, reported symptoms, technician diagnosis, and live billing balances (Estimate, Advance Paid, Balance Due).',
        side: 'top',
        align: 'start'
      }
    },
    {
      element: 'button[id^="btn-edit-repair-"]:first-of-type',
      popover: {
        title: '⚙️ Update Bill & Parts Fitted',
        description: 'Need to add a spare part (e.g. armature or switch) and adjust the bill? Update the estimate and diagnosis here with 1-click automated WhatsApp message dispatch.',
        side: 'top',
        align: 'end'
      }
    },
    {
      element: '#btn-start-repairs-tour',
      popover: {
        title: '🎉 You\'re Ready to Run the Workshop!',
        description: 'Click "Take Tour" anytime to review this walkthrough. Always verify the customer\'s secret 4-digit OTP before releasing repaired equipment at the counter!',
        side: 'bottom',
        align: 'end'
      }
    }
  ];

  const validSteps = rawSteps.filter(step => {
    const el = document.querySelector(step.element);
    return el && el.offsetParent !== null;
  });

  if (validSteps.length === 0) return null;

  const driverObj = driver({
    ...baseDriverConfig,
    steps: validSteps,
    onDestroyed: () => {
      safeLocalStorage.setItem('vpt_tour_repairs_seen', 'true');
    }
  });

  driverObj.drive();
  return driverObj;
};

/**
 * 5. Customer Cancellation Requests Interactive Tour
 * @param {boolean} force - Force start even if previously completed
 */
export const startCancellationsTour = (force = false) => {
  if (typeof window === 'undefined') return;

  if (!force && safeLocalStorage.getItem('vpt_tour_cancellations_seen') === 'true') {
    return;
  }

  const rawSteps = [
    {
      element: '#cancellations-section-header',
      popover: {
        title: '⚠️ Cancellation Requests Hub',
        description: 'Review and approve/reject cancellation requests submitted by customers for online orders in real time.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: 'div[id^="cancel-request-"]:first-of-type, .store-tab-content-card',
      popover: {
        title: '📋 Review Customer Request & Reason',
        description: 'Inspect the customer\'s cancellation reason, order details, courier status, and payment method (Online UPI/Cards vs Cash on Delivery).',
        side: 'top',
        align: 'start'
      }
    },
    {
      element: '#btn-start-cancellations-tour',
      popover: {
        title: '⚡ Instant 1-Click Online Refunds',
        description: 'Approving a paid order automatically executes a 100% refund via Razorpay straight back to the customer\'s UPI or bank account.',
        side: 'bottom',
        align: 'end'
      }
    }
  ];

  const validSteps = rawSteps.filter(step => {
    const el = document.querySelector(step.element);
    return el && el.offsetParent !== null;
  });

  if (validSteps.length === 0) return null;

  const driverObj = driver({
    ...baseDriverConfig,
    steps: validSteps,
    onDestroyed: () => {
      safeLocalStorage.setItem('vpt_tour_cancellations_seen', 'true');
    }
  });

  driverObj.drive();
  return driverObj;
};

/**
 * 6. Customer Directory & CRM Interactive Tour
 * @param {boolean} force - Force start even if previously completed
 */
export const startCustomersTour = (force = false) => {
  if (typeof window === 'undefined') return;

  if (!force && safeLocalStorage.getItem('vpt_tour_customers_seen') === 'true') {
    return;
  }

  const rawSteps = [
    {
      element: '#customers-section-header',
      popover: {
        title: '👥 Customer Directory & CRM',
        description: 'Your central database of customer profiles across Kerala. View complete purchase histories, workshop repair records, and direct contact options.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '.store-crm-kpi-grid',
      popover: {
        title: '📊 Customer Intelligence Metrics',
        description: 'Track high-level metrics: total registered clients, cumulative customer revenue, repeat buyer loyalty percentage, and average order value.',
        side: 'bottom',
        align: 'center'
      }
    },
    {
      element: '#input-customer-search',
      popover: {
        title: '🔍 Search Customer Records',
        description: 'Find any client instantly by searching their name, 10-digit mobile number, town, district, or postal PIN code.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '.store-customer-row:first-of-type, .store-tab-content-card',
      popover: {
        title: '👤 Customer Profile & VIP Badges',
        description: 'Identifies repeat buyers and high-value VIP accounts (★ VIP badge for ₹20k+ spend or 3+ orders), verified shipping address, and lifetime spend.',
        side: 'top',
        align: 'start'
      }
    },
    {
      element: '.store-customer-row:first-of-type .store-customer-col-actions',
      popover: {
        title: '💬 Instant WhatsApp & Complete History',
        description: 'Launch a direct WhatsApp message to check on spares or view a customer\'s entire history of machinery purchases and workshop repair tickets.',
        side: 'top',
        align: 'end'
      }
    },
    {
      element: '#btn-start-customers-tour',
      popover: {
        title: '🎉 You\'re Ready with Customer CRM!',
        description: 'Click "Take Tour" anytime to replay this walkthrough.',
        side: 'bottom',
        align: 'end'
      }
    }
  ];

  const validSteps = rawSteps.filter(step => {
    const el = document.querySelector(step.element);
    return el && el.offsetParent !== null;
  });

  if (validSteps.length === 0) return null;

  const driverObj = driver({
    ...baseDriverConfig,
    steps: validSteps,
    onDestroyed: () => {
      safeLocalStorage.setItem('vpt_tour_customers_seen', 'true');
    }
  });

  driverObj.drive();
  return driverObj;
};

/**
 * 7. Promotional Coupons & Discounts Interactive Tour
 * @param {boolean} force - Force start even if previously completed
 */
export const startCouponsTour = (force = false) => {
  if (typeof window === 'undefined') return;

  if (!force && safeLocalStorage.getItem('vpt_tour_coupons_seen') === 'true') {
    return;
  }

  const rawSteps = [
    {
      element: '#coupons-section-header',
      popover: {
        title: '🏷️ Promotional Coupons & Discounts',
        description: 'Manage promotional coupon codes to offer festival discounts, new customer incentives, or exclusive tool discounts at checkout.',
        side: 'bottom',
        align: 'start'
      }
    },
    {
      element: '#btn-new-coupon-modal',
      popover: {
        title: '➕ Create New Promotional Code',
        description: 'Set custom promo codes (e.g. ONAM2026, FESTIVE500) with percentage or flat ₹ discounts, minimum cart value, and 1-per-user limits.',
        side: 'bottom',
        align: 'end'
      }
    },
    {
      element: 'div[id^="coupon-card-"]:first-of-type, .store-tab-content-card',
      popover: {
        title: '🎟️ Coupon Controls & Live Redemption',
        description: 'Monitor total redemptions, pause/activate promo codes with 1 click, or delete expired campaign codes.',
        side: 'top',
        align: 'start'
      }
    },
    {
      element: '#btn-start-coupons-tour',
      popover: {
        title: '🎉 You\'re Ready with Promotions!',
        description: 'Click "Take Tour" anytime to replay this walkthrough.',
        side: 'bottom',
        align: 'end'
      }
    }
  ];

  const validSteps = rawSteps.filter(step => {
    const el = document.querySelector(step.element);
    return el && el.offsetParent !== null;
  });

  if (validSteps.length === 0) return null;

  const driverObj = driver({
    ...baseDriverConfig,
    steps: validSteps,
    onDestroyed: () => {
      safeLocalStorage.setItem('vpt_tour_coupons_seen', 'true');
    }
  });

  driverObj.drive();
  return driverObj;
};



