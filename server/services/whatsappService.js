require('dotenv').config();
const https = require('https');

const getPhoneNumberId = () => process.env.WHATSAPP_PHONE_NUMBER_ID || '1352812074573960';
const getAccessToken = () => process.env.WHATSAPP_ACCESS_TOKEN;

/**
 * Clean and format Indian phone number to international E.164 without '+'
 * e.g., '6238270613' -> '916238270613'
 * e.g., '+91 94473 05613' -> '919447305613'
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return null;
  let clean = String(phone).replace(/[^0-9]/g, '');
  if (clean.length === 10) {
    clean = '91' + clean;
  } else if (clean.length === 12 && clean.startsWith('91')) {
    // Already good
  } else if (clean.startsWith('0') && clean.length === 11) {
    clean = '91' + clean.slice(1);
  }
  return clean;
};

/**
 * Send a WhatsApp message via Meta Cloud API
 */
const sendWhatsAppMessage = (toPhone, messageBody) => {
  return new Promise((resolve, reject) => {
    const formattedPhone = formatPhoneNumber(toPhone);
    if (!formattedPhone) {
      return reject(new Error('Invalid phone number'));
    }

    const token = getAccessToken();
    const phoneId = getPhoneNumberId();

    if (!token) {
      console.warn('[WhatsApp Service] WHATSAPP_ACCESS_TOKEN is missing. Skipping message dispatch.');
      return resolve({ skipped: true, reason: 'Token missing' });
    }

    const payload = JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'text',
      text: {
        preview_url: false,
        body: messageBody
      }
    });

    const req = https.request({
      hostname: 'graph.facebook.com',
      path: `/v22.0/${phoneId}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`[WhatsApp Service] ✅ Message sent to ${formattedPhone} (Message ID: ${parsed.messages?.[0]?.id || 'N/A'})`);
            resolve(parsed);
          } else {
            console.warn(`[WhatsApp Service] ⚠️ Meta API notice (${res.statusCode}):`, parsed.error?.message || data);
            resolve({ error: parsed.error || data });
          }
        } catch (err) {
          console.warn('[WhatsApp Service] Parse error:', err.message);
          resolve({ raw: data });
        }
      });
    });

    req.on('error', (err) => {
      console.error('[WhatsApp Service] Request error:', err.message);
      reject(err);
    });

    req.write(payload);
    req.end();
  });
};

/**
 * 1. Send Order Confirmation WhatsApp
 */
const sendOrderConfirmationWhatsApp = async (order) => {
  if (!order || !order.customer?.phone) return;

  const itemsList = (order.items || [])
    .map((item, idx) => `${idx + 1}. *${item.name || item.title}* (Qty: ${item.quantity || 1}) - ₹${item.price}`)
    .join('\n');

  const deliveryNotice = order.deliveryType === 'store-pickup'
    ? `🏬 *Pickup Location:* Poyanil Building, Kozhencherry\n🔐 *Your Pickup OTP:* *${order.pickupOtp || '4819'}*\n_Please present this 4-digit code at the store counter to collect your tools._`
    : `🚚 *Delivery Method:* Courier Express Delivery\n📍 *Deliver To:* ${order.customer?.address || ''}, ${order.customer?.city || order.customer?.district || 'Kerala'}`;

  const message = `🛠️ *VARIATHU POWER TOOLS*
*Order Confirmed!*

Dear *${order.customer?.name || 'Valued Customer'}*,
Thank you for your order with Variathu Power Tools, Kozhencherry.

📋 *Order ID:* *${order.id}*
💰 *Total Amount:* *₹${order.totalAmount}* (${order.paymentStatus === 'PAID' ? '✅ Paid Online' : '💵 Cash on Delivery'})

📦 *Ordered Items:*
${itemsList}

${deliveryNotice}

📞 Need assistance? Call our showroom at *+91 94473 05613*.
🌐 Visit: https://variathupowertools.com`;

  return sendWhatsAppMessage(order.customer.phone, message);
};

/**
 * 2. Send Order Dispatched via Courier WhatsApp
 */
const sendOrderDispatchedWhatsApp = async (order, courierPartner, awb) => {
  if (!order || !order.customer?.phone) return;

  const carrier = courierPartner || order.courierPartner || 'Courier Express';
  const trackingNumber = awb || order.awb || 'Assigned at Hub';

  const message = `🚚 *VARIATHU POWER TOOLS*
*Your Order is on the Way!*

Dear *${order.customer?.name || 'Customer'}*,
Great news! Your order *${order.id}* has been packed and dispatched from our Kozhencherry store.

📦 *Carrier:* *${carrier}*
🔖 *Tracking / AWB No:* *${trackingNumber}*
📍 *Destination:* ${order.customer?.city || order.customer?.district || 'Kerala'} - PIN: ${order.customer?.pincode || '689641'}

You will receive your package soon. Thank you for choosing Variathu Power Tools!

📞 Showroom Hotline: *+91 94473 05613*`;

  return sendWhatsAppMessage(order.customer.phone, message);
};

/**
 * 3. Send Ready for Store Pickup WhatsApp
 */
const sendPickupReadyWhatsApp = async (order) => {
  if (!order || !order.customer?.phone) return;

  const message = `🏬 *VARIATHU POWER TOOLS*
*Ready for Counter Collection!*

Dear *${order.customer?.name || 'Customer'}*,
Your power tools for order *${order.id}* are tested, packed, and waiting for you at our showroom counter!

🏢 *Collection Address:*
Variathu Power Tools
Poyanil Building, Kozhencherry, Pathanamthitta, Kerala

🔐 *Your Counter Handover OTP:* *${order.pickupOtp || '4819'}*
_Show this 4-digit code to our store executive to collect your tools._

⏱️ *Store Timings:* 9:00 AM - 7:30 PM (Mon - Sat)
📞 Helpdesk: *+91 94473 05613*`;

  return sendWhatsAppMessage(order.customer.phone, message);
};

/**
 * 4. Send Order Cancelled & Refunded WhatsApp
 */
const sendOrderCancelledWhatsApp = async (order, reason) => {
  if (!order || !order.customer?.phone) return;

  const isRefunded = order.paymentStatus === 'REFUNDED';

  const message = `❌ *VARIATHU POWER TOOLS*
*Order Cancellation Notice*

Dear *${order.customer?.name || 'Customer'}*,
Your order *${order.id}* has been cancelled.

📝 *Reason:* ${reason || 'Customer request'}
${isRefunded ? `💳 *Refund Status:* *₹${order.totalAmount}* has been refunded back to your original payment account (${order.refundId || 'UPI'}). It will reflect in your bank account in 1-3 business days.` : ''}

If you have any questions or this was done in error, please call our support desk at *+91 94473 05613*.`;

  return sendWhatsAppMessage(order.customer.phone, message);
};

module.exports = {
  sendWhatsAppMessage,
  sendOrderConfirmationWhatsApp,
  sendOrderDispatchedWhatsApp,
  sendPickupReadyWhatsApp,
  sendOrderCancelledWhatsApp
};
