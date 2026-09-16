const { Resend } = require('resend');
const mongoose = require('mongoose');

// Initialize Resend client
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 're_your_resend_api_key_here') {
    return null;
  }
  return new Resend(apiKey.trim());
};

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Variathu Power Tools <onboarding@resend.dev>';
const REAL_LOGO_URL = 'https://raw.githubusercontent.com/Majorshot/toolsshop/main/client/public/Logo.jpeg';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// ─── Helper: Resolve customer email from order or MongoDB CustomerModel ───────
async function resolveCustomerEmail(order) {
  let email = (order?.customer?.email || '').trim();
  if (email && email.includes('@')) return email;

  try {
    const db = require('../utils/db');
    if (order?.customerId && db.CustomerModel) {
      const cust = await db.CustomerModel.findById(order.customerId).lean();
      if (cust?.email && cust.email.includes('@')) {
        return cust.email.trim();
      }
    }
    const phone = order?.customer?.phone;
    if (phone && db.CustomerModel) {
      const cleanPhone = String(phone).replace(/[^0-9]/g, '').slice(-10);
      if (cleanPhone.length >= 7) {
        const cust = await db.CustomerModel.findOne({ phone: { $regex: cleanPhone } }).lean();
        if (cust?.email && cust.email.includes('@')) {
          return cust.email.trim();
        }
      }
    }
  } catch (err) {
    console.warn('[emailService] Notice: Could not lookup customer email from DB:', err.message);
  }

  return null;
}

// ─── Helper: Send email with automatic Resend sandbox fallback ─────────────────
async function sendEmailSafely(resend, { to, subject, html }) {
  try {
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html
    });

    if (response.error) {
      const errMsg = response.error.message || '';
      console.warn(`[Resend Email] Initial send error for <${to}>:`, errMsg);

      // Handle Resend unverified domain sandbox constraint:
      // "You can only send testing emails to your own email address (xyz@gmail.com)..."
      const match = errMsg.match(/only send testing emails to your own email address \(([^)]+)\)/i);
      const testRecipient = match ? match[1] : (process.env.RESEND_TEST_EMAIL || 'homekzhy@gmail.com');

      if (testRecipient && testRecipient.toLowerCase() !== String(to).toLowerCase()) {
        console.log(`[Resend Email] Sandbox fallback: Rerouting test email originally to <${to}> -> verified account <${testRecipient}>`);
        const fallbackResponse = await resend.emails.send({
          from: FROM_EMAIL,
          to: [testRecipient],
          subject: `[Test For: ${to}] ${subject}`,
          html: `
            <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; margin-bottom: 16px; font-family: sans-serif; font-size: 12px; color: #92400e;">
              <strong>Resend Sandbox Notice:</strong> This email was originally targeted to <strong>${to}</strong>. Delivered to sandbox owner <strong>${testRecipient}</strong> because your Resend custom domain is in test mode.
            </div>
            ${html}
          `
        });

        if (fallbackResponse.error) {
          console.warn(`[Resend Email] Sandbox fallback error:`, fallbackResponse.error.message);
          return { success: false, error: fallbackResponse.error.message };
        }

        console.log(`[Resend Email] ✅ Test email delivered via sandbox to ${testRecipient}. ID: ${fallbackResponse.data?.id}`);
        return { success: true, messageId: fallbackResponse.data?.id, rerouted: true };
      }

      return { success: false, error: errMsg };
    }

    console.log(`[Resend Email] ✅ Email delivered to ${to}. ID: ${response.data?.id}`);
    return { success: true, messageId: response.data?.id };
  } catch (err) {
    console.warn(`[Resend Email] Exception sending email:`, err.message);
    return { success: false, error: err.message };
  }
}

// ─── Shared Email Layout Wrapper with Official Logo ────────────────────────────
function emailWrapper(title, bodyContent) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px 12px; color: #0f172a; -webkit-font-smoothing: antialiased;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto;">
          <tr>
            <td>
              <div style="background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05);">
                
                <!-- Brand Header with Real Logo Image -->
                <div style="background: #ffffff; padding: 28px 20px 22px; text-align: center; border-bottom: 2px solid #f1f5f9;">
                  <a href="${CLIENT_URL}" target="_blank" style="text-decoration: none; display: inline-block;">
                    <img src="${REAL_LOGO_URL}" alt="Variathu Power Tools" width="260" style="max-width: 260px; height: auto; display: block; margin: 0 auto; border: 0;" />
                  </a>
                  <div style="font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #64748b; font-weight: 700; margin-top: 10px;">
                    Authorized Equipment Clinic &amp; Machinery Sales &bull; Kozhencherry, Kerala
                  </div>
                </div>

                <!-- Main Body Content -->
                ${bodyContent}

                <!-- Trust Badges Strip -->
                <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 20px; text-align: center;">
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="text-align: center; font-size: 11px; color: #475569; font-weight: 600; padding: 0 6px;">
                        🔒 100% Genuine Tools
                      </td>
                      <td style="text-align: center; font-size: 11px; color: #475569; font-weight: 600; padding: 0 6px; border-left: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1;">
                        🧾 Kerala GST Compliant
                      </td>
                      <td style="text-align: center; font-size: 11px; color: #475569; font-weight: 600; padding: 0 6px;">
                        🛠️ Certified Service Hub
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- Footer with Kerala Store Statutory Credentials -->
                <div style="background: #0f172a; padding: 22px 20px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.6;">
                  <div style="color: #ffffff; font-weight: 700; font-size: 12px; margin-bottom: 6px;">
                    VARIATHU POWER TOOLS
                  </div>
                  Poyanil Building, Near St Thomas HSS Ground, Poyanil Junction, Kozhencherry, Kerala - 689641<br>
                  <strong>GSTIN:</strong> 32AABCV4921E1Z8 &bull; <strong>Phone / Helpline:</strong> +91 94471 23456<br>
                  <div style="margin-top: 10px; color: #64748b; font-size: 10px;">
                    &copy; ${new Date().getFullYear()} Variathu Power Tools. All rights reserved.
                  </div>
                </div>

              </div>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

// ─── Helper: Build items table HTML ────────────────────────────────────────────
function buildItemsTable(items) {
  const list = Array.isArray(items) && items.length > 0 ? items : [{ name: 'Equipment / Power Tool', quantity: 1, price: 0 }];
  const rows = list.map(it => `
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 12px 10px; font-size: 13px; color: #0f172a; vertical-align: middle;">
        <strong style="color: #0f172a; display: block;">${it.name || 'Power Equipment'}</strong>
        ${it.brand ? `<span style="font-size: 11px; color: #ea580c; font-weight: 600; text-transform: uppercase;">Brand: ${it.brand}</span>` : ''}
      </td>
      <td style="padding: 12px 10px; text-align: center; font-size: 13px; color: #475569; vertical-align: middle; white-space: nowrap;">
        ${it.quantity || 1} NOS
      </td>
      <td style="padding: 12px 10px; text-align: right; font-size: 13px; font-weight: 700; color: #0f172a; vertical-align: middle; white-space: nowrap;">
        ₹${Number(it.price || 0).toLocaleString('en-IN')}
      </td>
    </tr>
  `).join('');

  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin-bottom: 16px; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
      <thead>
        <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
          <th style="padding: 10px 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; text-align: left;">Item Description</th>
          <th style="padding: 10px 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; text-align: center;">Qty</th>
          <th style="padding: 10px 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// ─── Helper: Build totals breakdown ────────────────────────────────────────────
function buildTotalsBlock(order) {
  const grandTotal = Number(order.totalAmount || 0);
  const itemsSubtotal = (order.items || []).reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
  const rawDiscount = Number(order.discountAmount || order.discount || (itemsSubtotal > grandTotal ? itemsSubtotal - grandTotal : 0));
  const discountAmount = Math.max(0, rawDiscount);
  const couponCode = order.couponCode || (order.coupon && typeof order.coupon === 'string' ? order.coupon : order.coupon?.code);

  // Delivery fee is an additional charge and MUST NOT be included in product GST calculations
  const rawDeliveryFee = Number(order.deliveryFee !== undefined ? order.deliveryFee : (order.deliveryType && !order.deliveryType.toLowerCase().includes('pickup') && grandTotal > (itemsSubtotal - discountAmount) ? grandTotal - (itemsSubtotal - discountAmount) : 0));
  const deliveryFee = Math.max(0, rawDeliveryFee);

  // The actual product price after discount (GST applies ONLY to products)
  const productNetTotal = Math.max(0, itemsSubtotal - discountAmount);
  const taxableTotal = Math.round(productNetTotal / 1.18);
  const gstTotal = productNetTotal - taxableTotal;

  return `
    <div style="background: #f8fafc; border-radius: 10px; padding: 16px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        ${itemsSubtotal > 0 && discountAmount > 0 ? `
          <tr>
            <td style="font-size: 12px; color: #64748b; padding-bottom: 6px;">Total Equipment Value:</td>
            <td style="font-size: 12px; font-weight: 600; color: #0f172a; text-align: right; padding-bottom: 6px;">₹${itemsSubtotal.toLocaleString('en-IN')}</td>
          </tr>
        ` : ''}
        ${discountAmount > 0 ? `
          <tr>
            <td style="font-size: 12px; color: #16a34a; font-weight: 700; padding-bottom: 6px;">
              Coupon Discount ${couponCode ? `(${couponCode.toUpperCase()})` : ''}:
            </td>
            <td style="font-size: 12px; font-weight: 700; color: #16a34a; text-align: right; padding-bottom: 6px;">
              -₹${discountAmount.toLocaleString('en-IN')}
            </td>
          </tr>
        ` : ''}
        <tr>
          <td style="font-size: 12px; color: #64748b; padding-bottom: 6px;">Product Taxable Base Value (Excl. GST):</td>
          <td style="font-size: 12px; font-weight: 600; color: #0f172a; text-align: right; padding-bottom: 6px;">₹${taxableTotal.toLocaleString('en-IN')}</td>
        </tr>
        <tr>
          <td style="font-size: 12px; color: #64748b; padding-bottom: 6px;">Kerala GST on Tools (CGST 9% + SGST 9%):</td>
          <td style="font-size: 12px; font-weight: 600; color: #0f172a; text-align: right; padding-bottom: 6px;">₹${gstTotal.toLocaleString('en-IN')}</td>
        </tr>
        ${deliveryFee > 0 ? `
          <tr>
            <td style="font-size: 12px; color: #64748b; padding-bottom: 6px;">Courier Delivery Charge (Additional):</td>
            <td style="font-size: 12px; font-weight: 600; color: #0f172a; text-align: right; padding-bottom: 6px;">₹${deliveryFee.toLocaleString('en-IN')}</td>
          </tr>
        ` : ''}
        <tr style="border-top: 1.5px solid #cbd5e1;">
          <td style="font-size: 15px; font-weight: 800; color: #0f172a; padding-top: 10px;">Grand Total:</td>
          <td style="font-size: 17px; font-weight: 800; color: #dc2626; text-align: right; padding-top: 10px;">₹${grandTotal.toLocaleString('en-IN')}</td>
        </tr>
      </table>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. ORDER CONFIRMATION EMAIL (When Order is Placed)
// ═══════════════════════════════════════════════════════════════════════════════
async function sendOrderConfirmationEmail(order) {
  try {
    const customerEmail = await resolveCustomerEmail(order);
    if (!customerEmail) {
      console.log(`[Resend Email] Notice: No recipient email found for order #${order?.id}`);
      return { success: false, reason: 'no_email' };
    }

    const resend = getResendClient();
    if (!resend) {
      console.log(`[Resend Email Simulation] API key not configured. Simulated confirmation for order #${order.id} to ${customerEmail}`);
      return { success: true, simulated: true };
    }

    const customerName = order.customer?.name || 'Valued Customer';
    const isPickup = (order.deliveryType || '').toLowerCase().includes('pickup') || order.deliveryType === 'store-pickup';

    const bodyContent = `
      <!-- Confirmation Pill & Heading -->
      <div style="padding: 28px 24px 20px; text-align: center; border-bottom: 1px solid #f1f5f9;">
        <div style="display: inline-block; background: #dcfce7; color: #15803d; font-weight: 700; font-size: 12px; padding: 6px 16px; border-radius: 20px; letter-spacing: 0.05em; margin-bottom: 12px; border: 1px solid #bbf7d0;">
          ✓ ORDER CONFIRMED &bull; READY FOR PROCESSING
        </div>
        <h2 style="font-size: 22px; font-weight: 800; margin: 0 0 8px; color: #0f172a;">
          Thank you for your order, ${customerName}!
        </h2>
        <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;">
          Order <strong style="color: #0f172a; font-family: monospace; font-size: 15px;">#${order.id}</strong> has been confirmed. Our Kozhencherry workshop and dispatch team is getting your equipment ready.
        </p>
      </div>

      <!-- Ordered Items & Financials -->
      <div style="padding: 24px 24px 10px;">
        <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin: 0 0 12px; font-weight: 700;">
          Ordered Equipment &amp; Machinery
        </h3>
        ${buildItemsTable(order.items)}
        ${buildTotalsBlock(order)}
      </div>

      <!-- Fulfillment / Delivery Information -->
      <div style="background: #f8fafc; padding: 20px 24px; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
        <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #475569; margin: 0 0 10px; font-weight: 700;">
          ${isPickup ? '🏢 Store Counter Pickup Details' : '🚚 Doorstep Courier Delivery'}
        </h3>
        ${isPickup ? `
          <p style="font-size: 13px; color: #0f172a; margin: 0 0 8px; line-height: 1.5;">
            <strong>Pickup Location:</strong> Variathu Power Tools Counter, Poyanil Building, Poyanil Junction, Kozhencherry, Kerala - 689641
          </p>
          ${order.pickupOtp ? `
            <div style="display: inline-block; background: #ea580c; color: #ffffff; padding: 6px 14px; border-radius: 6px; font-weight: 800; font-size: 13px; letter-spacing: 0.1em; margin-top: 4px;">
              PICKUP OTP: ${order.pickupOtp}
            </div>
          ` : ''}
        ` : `
          <p style="font-size: 13px; color: #0f172a; margin: 0; line-height: 1.5;">
            <strong>Recipient:</strong> ${order.customer?.recipientName || customerName}<br>
            ${order.customer?.address || 'Customer Delivery Address'}<br>
            ${order.customer?.district || 'Pathanamthitta'}, Kerala - ${order.customer?.pincode || '689641'}<br>
            <strong>Delivery Contact:</strong> ${order.customer?.recipientPhone || order.customer?.phone || ''}
          </p>
        `}
      </div>

      <!-- Call to Action -->
      <div style="padding: 28px 24px; text-align: center;">
        <p style="font-size: 13px; color: #64748b; margin: 0 0 16px; line-height: 1.5;">
          Download your statutory Kerala GST Tax Invoice or track live order milestones anytime from your customer account.
        </p>
        <a href="${CLIENT_URL}/account" style="display: inline-block; background: #dc2626; color: #ffffff; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-weight: 700; font-size: 13px; letter-spacing: 0.02em; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);">
          View Order &amp; GST Invoice &rarr;
        </a>
      </div>
    `;

    return await sendEmailSafely(resend, {
      to: customerEmail,
      subject: `Order Confirmed #${order.id} - Variathu Power Tools`,
      html: emailWrapper(`Order Confirmation #${order.id}`, bodyContent)
    });
  } catch (err) {
    console.warn(`[Resend Email] Error sending order confirmation:`, err.message);
    return { success: false, error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. ORDER COMPLETED / DELIVERED EMAIL (When Store Marks Delivered / Completed)
// ═══════════════════════════════════════════════════════════════════════════════
async function sendOrderCompletedEmail(order) {
  try {
    const customerEmail = await resolveCustomerEmail(order);
    if (!customerEmail) return { success: false, reason: 'no_email' };

    const resend = getResendClient();
    if (!resend) {
      console.log(`[Resend Email Simulation] Order completed simulated for #${order.id}`);
      return { success: true, simulated: true };
    }

    const customerName = order.customer?.name || 'Valued Customer';
    const isPickup = (order.deliveryType || '').toLowerCase().includes('pickup') || order.deliveryType === 'store-pickup';

    const bodyContent = `
      <!-- Status Pill -->
      <div style="padding: 28px 24px 20px; text-align: center; border-bottom: 1px solid #f1f5f9;">
        <div style="display: inline-block; background: #dcfce7; color: #15803d; font-weight: 700; font-size: 12px; padding: 6px 16px; border-radius: 20px; letter-spacing: 0.05em; margin-bottom: 12px; border: 1px solid #bbf7d0;">
          📦 ORDER ${isPickup ? 'COLLECTED & COMPLETED' : 'DELIVERED & COMPLETED'}
        </div>
        <h2 style="font-size: 22px; font-weight: 800; margin: 0 0 8px; color: #0f172a;">
          Your order has been completed!
        </h2>
        <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;">
          Hi ${customerName}, your equipment order <strong style="color: #0f172a;">#${order.id}</strong> is now marked as complete. Thank you for choosing Variathu Power Tools!
        </p>
      </div>

      <!-- Items Summary -->
      <div style="padding: 24px 24px 10px;">
        <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin: 0 0 12px; font-weight: 700;">
          Fulfilled Equipment
        </h3>
        ${buildItemsTable(order.items)}
      </div>

      <!-- Warranty & Maintenance Notice -->
      <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; margin: 0 24px 20px; padding: 16px;">
        <h4 style="font-size: 13px; color: #1e40af; margin: 0 0 8px; font-weight: 700;">
          🛠️ Authorized Service &amp; Spare Support
        </h4>
        <p style="font-size: 13px; color: #1e3a5f; margin: 0; line-height: 1.5;">
          All machinery purchased from Variathu Power Tools is supported by our certified Kozhencherry repair clinic. Bring your GST invoice for standard manufacturer warranty assistance.
        </p>
      </div>

      <!-- Action Button -->
      <div style="padding: 20px 24px 28px; text-align: center;">
        <a href="${CLIENT_URL}/account" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-weight: 700; font-size: 13px;">
          Download GST Invoice &rarr;
        </a>
      </div>
    `;

    return await sendEmailSafely(resend, {
      to: customerEmail,
      subject: `Order Completed #${order.id} - Variathu Power Tools`,
      html: emailWrapper(`Order Completed #${order.id}`, bodyContent)
    });
  } catch (err) {
    console.warn(`[Resend Email] Error sending completed email:`, err.message);
    return { success: false, error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. ORDER DISPATCHED / COURIER EMAIL (When Handed to Courier)
// ═══════════════════════════════════════════════════════════════════════════════
async function sendOrderDispatchedEmail(order, courierPartner, awb) {
  try {
    const customerEmail = await resolveCustomerEmail(order);
    if (!customerEmail) return { success: false, reason: 'no_email' };

    const resend = getResendClient();
    if (!resend) {
      console.log(`[Resend Email Simulation] Dispatched email simulated for order #${order.id}`);
      return { success: true, simulated: true };
    }

    const customerName = order.customer?.name || 'Valued Customer';
    const partner = courierPartner || order.courierPartner || 'Kerala Express Courier';
    const awbNum = awb || order.awb || 'In Transit';

    const bodyContent = `
      <!-- Status Pill -->
      <div style="padding: 28px 24px 20px; text-align: center; border-bottom: 1px solid #f1f5f9;">
        <div style="display: inline-block; background: #dbeafe; color: #1d4ed8; font-weight: 700; font-size: 12px; padding: 6px 16px; border-radius: 20px; letter-spacing: 0.05em; margin-bottom: 12px; border: 1px solid #bfdbfe;">
          🚚 DISPATCHED VIA COURIER
        </div>
        <h2 style="font-size: 22px; font-weight: 800; margin: 0 0 8px; color: #0f172a;">
          Your tools are on the way!
        </h2>
        <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;">
          Hi ${customerName}, order <strong style="color: #0f172a;">#${order.id}</strong> has been safely packaged and handed over to our courier partner.
        </p>
      </div>

      <!-- Courier & Tracking Card -->
      <div style="padding: 24px 24px 10px;">
        <div style="background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
          <h4 style="font-size: 12px; color: #1e40af; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700;">
            📦 Live Courier Details
          </h4>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="font-size: 13px; color: #475569; padding-bottom: 8px;">Courier Service:</td>
              <td style="font-size: 13px; font-weight: 700; color: #1e3a5f; text-align: right; padding-bottom: 8px;">${partner}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #475569; padding-bottom: 8px;">AWB / Tracking Number:</td>
              <td style="text-align: right; padding-bottom: 8px;">
                <span style="font-family: monospace; background: #ffffff; padding: 3px 8px; border-radius: 6px; border: 1px solid #93c5fd; font-weight: 800; color: #1d4ed8; font-size: 13px;">
                  ${awbNum}
                </span>
              </td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #475569;">Payment Method:</td>
              <td style="font-size: 13px; font-weight: 600; color: #1e3a5f; text-align: right;">${(order.paymentMethod || 'COD').toUpperCase()}</td>
            </tr>
          </table>
        </div>

        <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin: 0 0 12px; font-weight: 700;">
          Items in this Shipment
        </h3>
        ${buildItemsTable(order.items)}
      </div>

      <!-- Shipping Address -->
      <div style="background: #f8fafc; padding: 18px 24px; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
        <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #475569; margin: 0 0 8px; font-weight: 700;">
          📍 Delivery Destination
        </h3>
        <p style="font-size: 13px; color: #0f172a; margin: 0; line-height: 1.5;">
          <strong>Consignee / Recipient:</strong> ${order.customer?.recipientName || customerName}<br>
          ${order.customer?.address || ''}<br>
          ${order.customer?.district || 'Pathanamthitta'}, ${order.customer?.state || 'Kerala'} - ${order.customer?.pincode || '689641'}<br>
          <strong>Delivery Phone:</strong> ${order.customer?.recipientPhone || order.customer?.phone || ''}
        </p>
      </div>

      <!-- Action Button -->
      <div style="padding: 28px 24px; text-align: center;">
        <a href="${CLIENT_URL}/account" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-weight: 700; font-size: 13px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">
          Track Shipment &amp; Status &rarr;
        </a>
      </div>
    `;

    return await sendEmailSafely(resend, {
      to: customerEmail,
      subject: `Order Dispatched 🚚 #${order.id} (${partner}) - Variathu Power Tools`,
      html: emailWrapper(`Order Dispatched #${order.id}`, bodyContent)
    });
  } catch (err) {
    console.warn(`[Resend Email] Error sending dispatched email:`, err.message);
    return { success: false, error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. CANCELLATION REQUEST EMAIL (Customer requested cancel for dispatched order)
// ═══════════════════════════════════════════════════════════════════════════════
async function sendCancellationRequestEmail(order, reason) {
  try {
    const customerEmail = await resolveCustomerEmail(order);
    if (!customerEmail) return { success: false, reason: 'no_email' };

    const resend = getResendClient();
    if (!resend) {
      console.log(`[Resend Email Simulation] Cancellation request simulated for order #${order.id}`);
      return { success: true, simulated: true };
    }

    const customerName = order.customer?.name || 'Valued Customer';
    const displayReason = (reason && String(reason).trim()) || order.cancellationRequestReason || order.cancellationReason || 'Customer requested cancellation from account dashboard';

    const bodyContent = `
      <!-- Status Pill -->
      <div style="padding: 28px 24px 20px; text-align: center; border-bottom: 1px solid #f1f5f9;">
        <div style="display: inline-block; background: #fef3c7; color: #b45309; font-weight: 700; font-size: 12px; padding: 6px 16px; border-radius: 20px; letter-spacing: 0.05em; margin-bottom: 12px; border: 1px solid #fde68a;">
          ⏳ CANCELLATION REQUEST SUBMITTED
        </div>
        <h2 style="font-size: 22px; font-weight: 800; margin: 0 0 8px; color: #0f172a;">
          Cancellation Request Received
        </h2>
        <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;">
          Hi ${customerName}, we have received your cancellation request for order <strong style="color: #0f172a;">#${order.id}</strong>.
        </p>
      </div>

      <!-- Request Card -->
      <div style="padding: 24px 24px 10px;">
        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 18px; margin-bottom: 16px;">
          <h4 style="font-size: 12px; color: #92400e; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700;">
            Request Overview
          </h4>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="font-size: 13px; color: #78350f; padding-bottom: 6px;">Order ID:</td>
              <td style="font-size: 13px; font-weight: 700; color: #78350f; text-align: right; padding-bottom: 6px;">#${order.id}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #78350f; padding-bottom: 6px;">Order Total:</td>
              <td style="font-size: 13px; font-weight: 700; color: #dc2626; text-align: right; padding-bottom: 6px;">₹${Number(order.totalAmount || 0).toLocaleString('en-IN')}</td>
            </tr>
          </table>

          <!-- Prominent Cancellation Reason Box -->
          <div style="margin-top: 12px; background: #ffffff; border: 1.5px solid #fcd34d; border-radius: 8px; padding: 12px 14px;">
            <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #b45309; display: block; marginBottom: 4px;">
              Reason for Cancellation:
            </span>
            <div style="font-size: 14px; font-weight: 700; color: #78350f; font-style: italic; line-height: 1.4;">
              "${displayReason}"
            </div>
          </div>
        </div>

        <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin: 0 0 12px; font-weight: 700;">
          Items under review
        </h3>
        ${buildItemsTable(order.items)}
      </div>

      <!-- What happens next -->
      <div style="background: #f8fafc; padding: 18px 24px; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
        <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #475569; margin: 0 0 8px; font-weight: 700;">
          📋 What Happens Next?
        </h3>
        <ul style="font-size: 13px; color: #334155; margin: 0; padding-left: 18px; line-height: 1.7;">
          <li>Our store manager will review courier transit status within 24 hours.</li>
          <li>Once approved, a confirmation email with full refund details will be sent immediately.</li>
          <li>For urgent inquiries, call our shop helpline at <strong>+91 94471 23456</strong>.</li>
        </ul>
      </div>

      <!-- Action Button -->
      <div style="padding: 28px 24px; text-align: center;">
        <a href="${CLIENT_URL}/account" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-weight: 700; font-size: 13px;">
          View Request in Account &rarr;
        </a>
      </div>
    `;

    // 1. Send confirmation to Customer
    const customerSendResult = await sendEmailSafely(resend, {
      to: customerEmail,
      subject: `Cancellation Request Received #${order.id} - Variathu Power Tools`,
      html: emailWrapper(`Cancellation Request #${order.id}`, bodyContent)
    });

    // 2. Also send real-time notification to Store Owner / Manager
    const adminEmail = process.env.STORE_ADMIN_EMAIL || process.env.RESEND_TEST_EMAIL || 'homekzhy@gmail.com';
    if (adminEmail) {
      const adminHtml = emailWrapper(`⚠️ New Cancellation Request #${order.id}`, `
        <div style="padding: 24px;">
          <div style="background: #fef3c7; border: 1.5px solid #fde68a; color: #92400e; padding: 10px 14px; border-radius: 8px; font-weight: 800; font-size: 13px; margin-bottom: 16px;">
            ⚠️ ACTION REQUIRED: CUSTOMER CANCELLATION REQUEST
          </div>
          <h2 style="margin: 0 0 10px; font-size: 20px; color: #0f172a;">
            Cancellation Requested for Order #${order.id}
          </h2>
          <div style="background: #ffffff; border: 2px solid #f59e0b; border-radius: 10px; padding: 16px; margin-bottom: 18px;">
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #b45309; margin-bottom: 4px;">
              Customer's Cancellation Reason:
            </div>
            <div style="font-size: 15px; font-weight: 700; color: #78350f; font-style: italic;">
              "${displayReason}"
            </div>
          </div>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px; margin-bottom: 16px;">
            <tr><td style="color: #64748b; padding: 4px 0;">Customer Name:</td><td style="font-weight: 700; color: #0f172a; text-align: right;">${customerName}</td></tr>
            <tr><td style="color: #64748b; padding: 4px 0;">Customer Phone:</td><td style="font-weight: 700; color: #0f172a; text-align: right;">${order.customer?.phone || 'N/A'}</td></tr>
            <tr><td style="color: #64748b; padding: 4px 0;">Order Total:</td><td style="font-weight: 800; color: #dc2626; text-align: right;">₹${Number(order.totalAmount || 0).toLocaleString('en-IN')}</td></tr>
            <tr><td style="color: #64748b; padding: 4px 0;">Courier Partner:</td><td style="font-weight: 700; color: #0369a1; text-align: right;">${order.courierPartner || 'Courier'}</td></tr>
            <tr><td style="color: #64748b; padding: 4px 0;">AWB Number:</td><td style="font-family: monospace; font-weight: 700; color: #1e3a5f; text-align: right;">${order.awb || 'N/A'}</td></tr>
          </table>
          <div style="text-align: center; margin-top: 20px;">
            <a href="${CLIENT_URL}/admin" style="display: inline-block; background: #dc2626; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 800; font-size: 13px;">
              Open Store Dashboard & Review Request &rarr;
            </a>
          </div>
        </div>
      `);

      sendEmailSafely(resend, {
        to: adminEmail,
        subject: `⚠️ Cancellation Request #${order.id} (${customerName}) - Reason: ${displayReason.slice(0, 40)}`,
        html: adminHtml
      }).catch(err => console.warn('[Resend Email] Admin cancellation alert error:', err.message));
    }

    return customerSendResult;
  } catch (err) {
    console.warn(`[Resend Email] Error sending cancellation request email:`, err.message);
    return { success: false, error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. ORDER CANCELLED & REFUND EMAIL
// ═══════════════════════════════════════════════════════════════════════════════
async function sendOrderCancelledEmail(order, reason, cancelledBy) {
  try {
    const customerEmail = await resolveCustomerEmail(order);
    if (!customerEmail) return { success: false, reason: 'no_email' };

    const resend = getResendClient();
    if (!resend) {
      console.log(`[Resend Email Simulation] Order cancelled email simulated for #${order.id}`);
      return { success: true, simulated: true };
    }

    const customerName = order.customer?.name || 'Valued Customer';
    const isByStore = cancelledBy === 'store';
    const displayReason = (reason && String(reason).trim()) || order.cancellationReason || order.cancellationRequestReason || order.cancelReason || 'Order cancelled';

    const bodyContent = `
      <!-- Status Pill -->
      <div style="padding: 28px 24px 20px; text-align: center; border-bottom: 1px solid #f1f5f9;">
        <div style="display: inline-block; background: #fee2e2; color: #b91c1c; font-weight: 700; font-size: 12px; padding: 6px 16px; border-radius: 20px; letter-spacing: 0.05em; margin-bottom: 12px; border: 1px solid #fecaca;">
          ✕ ORDER CANCELLED
        </div>
        <h2 style="font-size: 22px; font-weight: 800; margin: 0 0 8px; color: #0f172a;">
          Order #${order.id} has been cancelled
        </h2>
        <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;">
          Hi ${customerName}, your order has been ${isByStore ? 'cancelled by the store' : 'successfully cancelled as requested'}.
        </p>
      </div>

      <!-- Cancellation Breakdown -->
      <div style="padding: 24px 24px 10px;">
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 18px; margin-bottom: 20px;">
          <h4 style="font-size: 12px; color: #991b1b; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700;">
            Cancellation &amp; Refund Summary
          </h4>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="font-size: 13px; color: #7f1d1d; padding-bottom: 6px;">Order ID:</td>
              <td style="font-size: 13px; font-weight: 700; color: #7f1d1d; text-align: right; padding-bottom: 6px;">#${order.id}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #7f1d1d; padding-bottom: 6px;">Refund Amount:</td>
              <td style="font-size: 14px; font-weight: 800; color: #16a34a; text-align: right; padding-bottom: 6px;">₹${Number(order.totalAmount || 0).toLocaleString('en-IN')}</td>
            </tr>
            ${order.refundId ? `
              <tr>
                <td style="font-size: 13px; color: #7f1d1d; padding-bottom: 6px;">Refund Transaction ID:</td>
                <td style="font-size: 12px; font-family: monospace; font-weight: 700; color: #7f1d1d; text-align: right; padding-bottom: 6px;">${order.refundId}</td>
              </tr>
            ` : ''}
          </table>

          <!-- Reason Callout Box -->
          <div style="margin-top: 12px; background: #ffffff; border: 1.5px solid #fca5a5; border-radius: 8px; padding: 12px 14px;">
            <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #dc2626; display: block; margin-bottom: 4px;">
              Cancellation Reason:
            </span>
            <div style="font-size: 14px; font-weight: 700; color: #991b1b; font-style: italic; line-height: 1.4;">
              "${displayReason}"
            </div>
          </div>
        </div>

        <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin: 0 0 12px; font-weight: 700;">
          Cancelled Items
        </h3>
        ${buildItemsTable(order.items)}
      </div>

      <!-- Refund Instructions -->
      <div style="background: #f8fafc; padding: 18px 24px; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
        <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #475569; margin: 0 0 8px; font-weight: 700;">
          💰 Refund Settlement Process
        </h3>
        <ul style="font-size: 13px; color: #334155; margin: 0; padding-left: 18px; line-height: 1.7;">
          <li>For online UPI / card payments, the full amount is auto-refunded to your original bank / payment account.</li>
          <li>UPI refunds typically credit within 24-48 hours; bank cards may take 5-7 business days.</li>
          <li>For Cash on Delivery orders, no payment was collected, hence no refund is due.</li>
        </ul>
      </div>

      <!-- Action Button -->
      <div style="padding: 28px 24px; text-align: center;">
        <a href="${CLIENT_URL}/shop" style="display: inline-block; background: #dc2626; color: #ffffff; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-weight: 700; font-size: 13px;">
          Browse Our Power Tools Catalog &rarr;
        </a>
      </div>
    `;

    return await sendEmailSafely(resend, {
      to: customerEmail,
      subject: `Order Cancelled #${order.id} - Variathu Power Tools`,
      html: emailWrapper(`Order Cancelled #${order.id}`, bodyContent)
    });
  } catch (err) {
    console.warn(`[Resend Email] Error sending cancelled email:`, err.message);
    return { success: false, error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. WELCOME EMAIL (New Customer Registration)
// ═══════════════════════════════════════════════════════════════════════════════
async function sendWelcomeEmail(customer) {
  try {
    const email = (customer?.email || '').trim();
    if (!email || !email.includes('@')) return { success: false, reason: 'no_email' };

    const resend = getResendClient();
    if (!resend) {
      console.log(`[Resend Email Simulation] Welcome email simulated for ${email}`);
      return { success: true, simulated: true };
    }

    const customerName = customer?.name || 'Valued Customer';
    const customerPhone = customer?.phone || '';

    const bodyContent = `
      <!-- Welcome Badge -->
      <div style="padding: 28px 24px 20px; text-align: center; border-bottom: 1px solid #f1f5f9;">
        <div style="display: inline-block; background: #ede9fe; color: #6d28d9; font-weight: 700; font-size: 12px; padding: 6px 16px; border-radius: 20px; letter-spacing: 0.05em; margin-bottom: 12px; border: 1px solid #ddd6fe;">
          ✨ WELCOME TO VARIATHU POWER TOOLS
        </div>
        <h2 style="font-size: 22px; font-weight: 800; margin: 0 0 8px; color: #0f172a;">
          Welcome aboard, ${customerName}!
        </h2>
        <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;">
          Your customer account linked to mobile number <strong style="color: #0f172a;">${customerPhone}</strong> is now verified and active.
        </p>
      </div>

      <!-- Member Benefits -->
      <div style="padding: 24px 24px 10px;">
        <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin: 0 0 14px; font-weight: 700;">
          Your Account Privileges
        </h3>
        
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
          <tr>
            <td style="padding-bottom: 12px; vertical-align: top; width: 32px;">
              <div style="background: #fee2e2; color: #dc2626; width: 26px; height: 26px; border-radius: 50%; text-align: center; line-height: 26px; font-size: 12px; font-weight: 800;">✓</div>
            </td>
            <td style="padding-bottom: 12px; padding-left: 8px; vertical-align: middle;">
              <strong style="font-size: 13px; color: #0f172a;">Instant GST Tax Invoices:</strong>
              <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Download compliant Kerala GST tax invoices anytime for tax credit and accounting.</div>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 12px; vertical-align: top; width: 32px;">
              <div style="background: #dbeafe; color: #2563eb; width: 26px; height: 26px; border-radius: 50%; text-align: center; line-height: 26px; font-size: 12px; font-weight: 800;">✓</div>
            </td>
            <td style="padding-bottom: 12px; padding-left: 8px; vertical-align: middle;">
              <strong style="font-size: 13px; color: #0f172a;">Live Courier &amp; Counter Pickup Tracking:</strong>
              <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Track delivery milestones with live courier AWB or pickup OTP codes.</div>
            </td>
          </tr>
          <tr>
            <td style="vertical-align: top; width: 32px;">
              <div style="background: #fef3c7; color: #d97706; width: 26px; height: 26px; border-radius: 50%; text-align: center; line-height: 26px; font-size: 12px; font-weight: 800;">✓</div>
            </td>
            <td style="padding-left: 8px; vertical-align: middle;">
              <strong style="font-size: 13px; color: #0f172a;">Exclusive Shop Offers &amp; Workshop Booking:</strong>
              <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Special customer discount coupons and priority service queue at our Kozhencherry clinic.</div>
            </td>
          </tr>
        </table>
      </div>

      <!-- Action Button -->
      <div style="padding: 20px 24px 28px; text-align: center; border-top: 1px solid #f1f5f9;">
        <a href="${CLIENT_URL}/shop" style="display: inline-block; background: #dc2626; color: #ffffff; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-weight: 700; font-size: 13px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);">
          Start Shopping Power Tools &rarr;
        </a>
      </div>
    `;

    return await sendEmailSafely(resend, {
      to: email,
      subject: `Welcome to Variathu Power Tools, ${customerName}!`,
      html: emailWrapper(`Welcome to Variathu Power Tools`, bodyContent)
    });
  } catch (err) {
    console.warn("[Resend Email] Error sending welcome email:", err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendOrderConfirmationEmail,
  sendOrderCompletedEmail,
  sendOrderDispatchedEmail,
  sendCancellationRequestEmail,
  sendOrderCancelledEmail,
  sendWelcomeEmail
};
