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
    // Already formatted
  } else if (clean.startsWith('0') && clean.length === 11) {
    clean = '91' + clean.slice(1);
  }
  return clean;
};

/**
 * Core function: Sends your approved Meta Template (Bypasses 24-hr restriction!)
 */
const sendWhatsAppTemplate = (toPhone, templateName = 'store_update', languageCode = 'en_US', parameters = []) => {
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
            text: String(val ?? '')
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
 * Universal helper that sends your notification via the approved 'store_update' template
 * {{1}} = Customer Name
 * {{2}} = Main Header / Title
 * {{3}} = Details / Bill / OTP / Tracking
 */
const sendStoreNotification = (phone, customerName, mainUpdate, details) => {
  return sendWhatsAppTemplate(
    phone,
    'store_update',
    'en_US',
    [
      customerName || 'Valued Customer',
      mainUpdate,
      details
    ]
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

  const header = `Your order #${order.id} has been confirmed! Total Amount: ₹${order.totalAmount} (${order.paymentStatus === 'PAID' ? 'Paid Online' : 'COD'}).`;
  const details = order.deliveryType === 'store-pickup'
    ? `🏬 Showroom Pickup: Poyanil Building, Kozhencherry. 🔐 Pickup OTP: ${order.pickupOtp || '4819'}`
    : `🚚 Courier Delivery to ${order.customer?.city || 'Kerala'} - PIN: ${order.customer?.pincode || ''}`;

  return sendStoreNotification(order.customer.phone, order.customer?.name, header, details);
};

/**
 * 2. Order Dispatched
 */
const sendOrderDispatchedWhatsApp = async (order, courierPartner, awb) => {
  if (!order || !order.customer?.phone) return;

  const rawPartner = courierPartner || order.courierPartner || 'DTDC Express';
  const trackingNumber = awb || order.awb || 'Assigned at Hub';
  const courierInfo = resolveCourierTracking(rawPartner, trackingNumber);

  const header = `Your order #${order.id} has been packed & dispatched from our Kozhencherry store!`;
  const details = `📦 Courier: ${courierInfo.name} | AWB: ${trackingNumber}\n🔗 Track: ${courierInfo.trackingUrl}`;

  return sendStoreNotification(order.customer.phone, order.customer?.name, header, details);
};

/**
 * 3. Pickup Ready with OTP
 */
const sendPickupReadyWhatsApp = async (order) => {
  if (!order || !order.customer?.phone) return;

  const header = `Your power tools for order #${order.id} are tested, packed, and waiting at our showroom counter!`;
  const details = `🏢 Poyanil Building, Kozhencherry.\n🔐 YOUR SECRET HANDOVER OTP: ${order.pickupOtp || '4819'}`;

  return sendStoreNotification(order.customer.phone, order.customer?.name, header, details);
};

/**
 * 4. Order Cancelled
 */
const sendOrderCancelledWhatsApp = async (order, reason) => {
  if (!order || !order.customer?.phone) return;

  const header = `Your order #${order.id} has been cancelled. Reason: ${reason || 'Customer request'}.`;
  const details = order.paymentStatus === 'REFUNDED'
    ? `💳 Refund of ₹${order.totalAmount} initiated to your account.`
    : `If this was an error, please contact our helpdesk.`;

  return sendStoreNotification(order.customer.phone, order.customer?.name, header, details);
};

/**
 * 5. Order Completed
 */
const sendOrderCompletedWhatsApp = async (order) => {
  if (!order || !order.customer?.phone) return;

  const header = `Your order #${order.id} has been successfully completed and received!`;
  const details = `Total: ₹${order.totalAmount}. Thank you for choosing Variathu Power Tools!`;

  return sendStoreNotification(order.customer.phone, order.customer?.name, header, details);
};

/**
 * 6. Repair Ticket Created
 */
const sendRepairTicketCreatedWhatsApp = async (job) => {
  if (!job || !job.customerPhone) return;

  const brandModel = (job.toolBrand ? `${job.toolBrand} ` : '') + (job.toolModel || 'Equipment');
  const header = `Repair ticket logged for your machine: ${brandModel} (Ticket: ${job.jobId}).`;
  const details = `Issue: ${job.issueDescription || 'Inspection'}. Estimated Cost: ₹${job.estimatedCost || 0}. Technician inspecting now.`;

  return sendStoreNotification(job.customerPhone, job.customerName, header, details);
};

/**
 * 7. Repair Ready with OTP
 */
const sendRepairReadyWhatsApp = async (job) => {
  if (!job || !job.customerPhone) return;

  const brandModel = (job.toolBrand ? `${job.toolBrand} ` : '') + (job.toolModel || 'Equipment');
  const finalBill = Number(job.finalCost || job.estimatedCost || 0);

  const header = `Great news! Your ${brandModel} (Ticket: ${job.jobId}) is repaired and ready for pickup!`;
  const details = `💰 Bill: ₹${finalBill.toLocaleString('en-IN')}.\n🔐 YOUR COUNTER COLLECTION OTP: ${job.handoverOtp || '4819'}. Show this at the counter.`;

  return sendStoreNotification(job.customerPhone, job.customerName, header, details);
};

/**
 * 8. Repair Completed / Delivered
 */
const sendRepairDeliveredWhatsApp = async (job) => {
  if (!job || !job.customerPhone) return;

  const brandModel = (job.toolBrand ? `${job.toolBrand} ` : '') + (job.toolModel || 'Equipment');
  const header = `Service receipt: Your machine ${brandModel} (Ticket: ${job.jobId}) was handed over!`;
  const details = `Bill settled in full. All replaced parts carry our workshop guarantee. Thank you!`;

  return sendStoreNotification(job.customerPhone, job.customerName, header, details);
};

/**
 * 9. Repair Estimate Updated
 */
const sendRepairEstimateUpdatedWhatsApp = async (job, prevCost) => {
  if (!job || !job.customerPhone) return;

  const brandModel = (job.toolBrand ? `${job.toolBrand} ` : '') + (job.toolModel || 'Equipment');
  const header = `Technical diagnosis update for ${brandModel} (Ticket: ${job.jobId}).`;
  const details = `Revised Estimate: ₹${job.finalCost || job.estimatedCost || 0}. Work: ${job.technicianNotes || 'Parts update'}.`;

  return sendStoreNotification(job.customerPhone, job.customerName, header, details);
};

/**
 * Fallback raw sender
 */
const sendWhatsAppMessage = (toPhone, messageBody) => {
  return sendStoreNotification(toPhone, 'Customer', 'Important Notice from Variathu Power Tools', messageBody);
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
  sendRepairEstimateUpdatedWhatsApp
};
