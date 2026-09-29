import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

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

  if (!force && localStorage.getItem('vpt_tour_overview_seen') === 'true') {
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
      localStorage.setItem('vpt_tour_overview_seen', 'true');
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

  if (!force && localStorage.getItem('vpt_tour_orders_seen') === 'true') {
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
      localStorage.setItem('vpt_tour_orders_seen', 'true');
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

  if (!force && localStorage.getItem('vpt_tour_inventory_seen') === 'true') {
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
      localStorage.setItem('vpt_tour_inventory_seen', 'true');
    }
  });

  driverObj.drive();
  return driverObj;
};


