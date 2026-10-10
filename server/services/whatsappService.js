require('dotenv').config();
const https = require('https');

const getPhoneNumberId = () => process.env.WHATSAPP_PHONE_NUMBER_ID || '1352812074573960';
const getAccessToken = () => process.env.WHATSAPP_ACCESS_TOKEN;

/**
 * Format Indian phone number to international E.164 without '+'
 * e.g., '6238270613' -> '916238270613'
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return null;
  let clean = String(phone).replace(/[^0-9]/g, '');
  if (clean.length === 10) {
    clean = '91' + clean;
  } else if (clean.length === 12 && clean.startsWith('91')) {
    // Already formatted with 91 prefix
  } else if (clean.startsWith('0') && clean.length === 11) {
    clean = '91' + clean.slice(1);
  } else {
    // Invalid phone number length (e.g. less than 10 digits)
    return null;
  }
  return clean;
};

/**
 * Core function: Sends your approved Meta Template (Bypasses 24-hr restriction!)
 */
const sendWhatsAppTemplate = (toPhone, templateName = 'order_repair', languageCode = 'en', parameters = []) => {
  return new Promise((resolve, reject) => {
    const formattedPhone = formatPhoneNumber(toPhone);
    if (!formattedPhone) {
      return reject(new Error('Invalid phone number'));
    }

    const token = getAccessToken();
    const phoneId = getPhoneNumberId();

    if (!token) {
      console.warn('[WhatsApp Service] WHATSAPP_ACCESS_TOKEN is missing.');
      return resolve({ skipped: true, reason: 'Token missing' });
    }

    const templateObj = {
      name: templateName,
      language: { code: languageCode }
    };

    if (Array.isArray(parameters) && parameters.length > 0) {
      templateObj.components = [
        {
          type: 'body',
          parameters: parameters.map((val) => ({
            type: 'text',
            // Sanitize text to remove line breaks and extra whitespace that trigger #132018
            text: String(val ?? '').replace(/[\r\n]+/g, ' ').trim()
          }))
        }
      ];
    }

    const payload = JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'template',
      template: templateObj
    });

    const req = https.request(
      {
        hostname: 'graph.facebook.com',
        path: `/v22.0/${phoneId}/messages`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              console.log(`[WhatsApp Service] ✅ Notification sent to ${formattedPhone} (ID: ${parsed.messages?.[0]?.id || 'N/A'})`);
              resolve(parsed);
            } else {
              console.warn(`[WhatsApp Service] ⚠️ Meta API Error (${res.statusCode}):`, parsed.error?.message || data);
              resolve({ error: parsed.error || data });
            }
          } catch (err) {
            console.warn('[WhatsApp Service] Parse error:', err.message);
            resolve({ raw: data });
          }
        });
      }
    );

    req.on('error', (err) => {
      console.error('[WhatsApp Service] Request error:', err.message);
      reject(err);
    });

    req.write(payload);
    req.end();
  });
};

/**
 * Universal helper that sends your notification via the approved 'order_repair' template
 * {{1}} = Customer Name
 * {{2}} = Order/Ticket ID
 * {{3}} = Status & Details
 */
const sendStoreNotification = (phone, customerName, identifier, statusDetails) => {
  const cleanName = String(customerName || 'Valued Customer').replace(/[\r\n]+/g, ' ').trim();
  const cleanId = String(identifier || 'N/A').replace(/[\r\n]+/g, ' ').trim();
  const cleanStatus = String(statusDetails || 'Updated').replace(/[\r\n]+/g, ' ').trim();

  return sendWhatsAppTemplate(
    phone,
    'order_repair',
    'en',
    [cleanName, cleanId, cleanStatus]
  );
};

const resolveCourierTracking = (courierName = '', awb = '') => {
  const c = String(courierName || '').toLowerCase();
  const cleanAwb = String(awb || '').trim();

  if (c.includes('delh')) {
    return { name: 'Delhivery', trackingUrl: cleanAwb ? `https://www.delhivery.com/tracking?tracking_id=${encodeURIComponent(cleanAwb)}` : 'https://www.delhivery.com/' };
  }
  if (c.includes('alep') || c.includes('allep') || c.includes('aps')) {
    return { name: 'Alleppey Parcel Service (APS Cargo)', trackingUrl: 'https://www.apscargo.com/index' };
  }
  if (c.includes('prof') || c.includes('tpc')) {
    return { name: 'The Professional Couriers', trackingUrl: 'https://www.tpcindia.com/' };
  }
  return { name: 'DTDC Express', trackingUrl: 'https://www.dtdc.com/track-your-shipment/' };
};

/**
 * 1. Order Confirmed
 */
const sendOrderConfirmationWhatsApp = async (order) => {
  if (!order || !order.customer?.phone) return;

  const statusText = order.deliveryType === 'store-pickup'
    ? `Confirmed! Total: ₹${order.totalAmount} (${order.paymentStatus === 'PAID' ? 'Paid' : 'COD'}). Showroom Pickup: Poyanil Building, Kozhencherry. Pickup OTP: ${order.pickupOtp || '4819'}`
    : `Confirmed! Total: ₹${order.totalAmount} (${order.paymentStatus === 'PAID' ? 'Paid' : 'COD'}). Processing delivery to ${order.customer?.city || 'Kerala'} - PIN: ${order.customer?.pincode || ''}`;

  return sendStoreNotification(order.customer.phone, order.customer?.name, order.id, statusText);
};

/**
 * 2. Order Dispatched
 */
const sendOrderDispatchedWhatsApp = async (order, courierPartner, awb) => {
  if (!order || !order.customer?.phone) return;

  const rawPartner = courierPartner || order.courierPartner || 'DTDC Express';
  const trackingNumber = awb || order.awb || 'Assigned at Hub';
  const courierInfo = resolveCourierTracking(rawPartner, trackingNumber);
  const statusText = `Dispatched via ${courierInfo.name}. AWB: ${trackingNumber}. Tracking: ${courierInfo.trackingUrl}`;

  return sendStoreNotification(order.customer.phone, order.customer?.name, order.id, statusText);
};

/**
 * 3. Pickup Ready with OTP
 */
const sendPickupReadyWhatsApp = async (order) => {
  if (!order || !order.customer?.phone) return;

  const statusText = `Ready for counter pickup at Poyanil Building, Kozhencherry. Handover OTP: ${order.pickupOtp || '4819'}`;
  return sendStoreNotification(order.customer.phone, order.customer?.name, order.id, statusText);
};

/**
 * 4. Order Cancelled
 */
const sendOrderCancelledWhatsApp = async (order, reason) => {
  if (!order || !order.customer?.phone) return;

  const statusText = `Cancelled (${reason || 'Customer request'}). ${order.paymentStatus === 'REFUNDED' ? `Refund of ₹${order.totalAmount} initiated.` : ''}`;
  return sendStoreNotification(order.customer.phone, order.customer?.name, order.id, statusText);
};

/**
 * 5. Order Completed
 */
const sendOrderCompletedWhatsApp = async (order) => {
  if (!order || !order.customer?.phone) return;

  const statusText = `Completed and handed over. Total: ₹${order.totalAmount}. Thank you for choosing us!`;
  return sendStoreNotification(order.customer.phone, order.customer?.name, order.id, statusText);
};

/**
 * 6. Repair Ticket Created
 */
const sendRepairTicketCreatedWhatsApp = async (job) => {
  if (!job || !job.customerPhone) return;

  const brandModel = (job.toolBrand ? `${job.toolBrand} ` : '') + (job.toolModel || 'Tool');
  const statusText = `Logged for service (${brandModel}). Issue: ${job.issueDescription || 'Inspection'}. Est. Cost: ₹${job.estimatedCost || 0}. Under inspection.`;

  return sendStoreNotification(job.customerPhone, job.customerName, job.jobId, statusText);
};

/**
 * 7. Repair Ready with OTP
 */
const sendRepairReadyWhatsApp = async (job) => {
  if (!job || !job.customerPhone) return;

  const brandModel = (job.toolBrand ? `${job.toolBrand} ` : '') + (job.toolModel || 'Tool');
  const finalBill = Number(job.finalCost || job.estimatedCost || 0);
  const statusText = `Repaired & ready for collection (${brandModel})! Bill: ₹${finalBill.toLocaleString('en-IN')}. Counter Collection OTP: ${job.handoverOtp || '4819'}`;

  return sendStoreNotification(job.customerPhone, job.customerName, job.jobId, statusText);
};

/**
 * 8. Repair Completed / Delivered
 */
const sendRepairDeliveredWhatsApp = async (job) => {
  if (!job || !job.customerPhone) return;

  const brandModel = (job.toolBrand ? `${job.toolBrand} ` : '') + (job.toolModel || 'Tool');
  const statusText = `Delivered and settled in full (${brandModel}). Thank you!`;

  return sendStoreNotification(job.customerPhone, job.customerName, job.jobId, statusText);
};

/**
 * 9. Repair Estimate Updated
 */
const sendRepairEstimateUpdatedWhatsApp = async (job, prevCost) => {
  if (!job || !job.customerPhone) return;

  const brandModel = (job.toolBrand ? `${job.toolBrand} ` : '') + (job.toolModel || 'Tool');
  const statusText = `Technical estimate updated for ${brandModel}. Revised Cost: ₹${job.finalCost || job.estimatedCost || 0}. Notes: ${job.technicianNotes || 'Parts update'}`;

  return sendStoreNotification(job.customerPhone, job.customerName, job.jobId, statusText);
};

/**
 * Helper to normalize staff arguments whether passed as { staff, password, clientUrl } or (staff, password, clientUrl)
 */
const normalizeStaffArgs = (staffOrOptions, maybePassword, maybeClientUrl) => {
  let staff = staffOrOptions;
  let password = maybePassword;
  let clientUrl = maybeClientUrl;

  if (staffOrOptions && typeof staffOrOptions === 'object' && staffOrOptions.staff && typeof staffOrOptions.staff === 'object') {
    staff = staffOrOptions.staff;
    password = staffOrOptions.password ?? maybePassword;
    clientUrl = staffOrOptions.clientUrl ?? maybeClientUrl;
  }
  return {
    staff: staff || null,
    password: password ? String(password).trim() : '',
    clientUrl: clientUrl ? String(clientUrl).trim() : ''
  };
};

/**
 * 10. Staff Welcome Text Generator
 */
const getStaffWelcomeWhatsAppText = (staffOrOptions, maybePassword, maybeClientUrl) => {
  const { staff, password, clientUrl } = normalizeStaffArgs(staffOrOptions, maybePassword, maybeClientUrl);
  if (!staff) return '';

  const role = String(staff.role || 'technician').toLowerCase();
  const baseUrl = (clientUrl || process.env.CLIENT_URL || 'https://www.variathupowertools.in').replace(/\/$/, '');

  if (role === 'technician') {
    return `Registered as Workshop Floor Technician. Inward equipment repair tickets will be tracked under your profile. Showroom & Workshop: Poyanil Building, Kozhencherry.`;
  }

  const roleTitle = role === 'workshop_manager' ? 'Workshop Manager' : 'Store Manager';
  let text = `Registered as ${roleTitle}. Login Portal: ${baseUrl}/login. Email: ${staff.email || 'N/A'}.`;
  if (password) {
    text += ` Temp Password: ${password}.`;
  }
  text += ` Showroom & Workshop: Poyanil Building, Kozhencherry.`;
  return text;
};

/**
 * 11. Staff Welcome / Credentials Notification
 * Formatted identically to order and repair notifications using the approved Meta template 'order_repair'
 * {{1}} = Staff Name
 * {{2}} = Staff / Ticket Reference Code (e.g. STAFF-TECH-0613)
 * {{3}} = Status Details
 */
const sendStaffWelcomeWhatsApp = async (staffOrOptions, maybePassword, maybeClientUrl) => {
  const { staff, password, clientUrl } = normalizeStaffArgs(staffOrOptions, maybePassword, maybeClientUrl);
  if (!staff || !staff.phone) {
    console.warn('[Staff WhatsApp] Missing staff details or phone number:', staff);
    return { skipped: true, reason: 'Missing phone number' };
  }

  const role = String(staff.role || 'technician').toLowerCase();
  const phoneDigits = String(staff.phone).replace(/[^0-9]/g, '').slice(-4) || '01';
  const identifier = staff.employeeId || `STAFF-${role === 'technician' ? 'TECH' : 'MGR'}-${phoneDigits}`;
  const statusText = getStaffWelcomeWhatsAppText(staff, password, clientUrl);

  console.log(`[Staff WhatsApp] Dispatching welcome notification to ${staff.name} (${staff.phone}) using approved Meta template 'order_repair'...`);
  return sendStoreNotification(staff.phone, staff.name, identifier, statusText);
};

/**
 * Fallback raw sender
 */
const sendWhatsAppMessage = (toPhone, messageBody) => {
  return sendStoreNotification(toPhone, 'Customer', 'General Update', messageBody);
};

module.exports = {
  formatPhoneNumber,
  sendWhatsAppTemplate,
  sendStoreNotification,
  sendWhatsAppMessage,
  sendOrderConfirmationWhatsApp,
  sendOrderDispatchedWhatsApp,
  sendPickupReadyWhatsApp,
  sendOrderCancelledWhatsApp,
  sendOrderCompletedWhatsApp,
  sendRepairTicketCreatedWhatsApp,
  sendRepairReadyWhatsApp,
  sendRepairDeliveredWhatsApp,
  sendRepairEstimateUpdatedWhatsApp,
  getStaffWelcomeWhatsAppText,
  sendStaffWelcomeWhatsApp
};
