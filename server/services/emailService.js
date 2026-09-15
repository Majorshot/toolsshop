const { Resend } = require('resend');

// Initialize Resend client
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 're_your_resend_api_key_here') {
    return null;
  }
  return new Resend(apiKey.trim());
};

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Variathu Power Tools <onboarding@resend.dev>';

/**
 * Send official HTML order confirmation email to customer via Resend
 */
async function sendOrderConfirmationEmail(order) {
  try {
    const customerEmail = order.customer?.email?.trim();
    if (!customerEmail || !customerEmail.includes('@')) {
      console.log(`[Resend Email] Skipped: No valid recipient email for order #${order.id}`);
      return { success: false, reason: 'no_email' };
    }

    const resend = getResendClient();
    if (!resend) {
      console.log(`[Resend Email Simulation] API key not configured. Simulated dispatch for order #${order.id} to ${customerEmail}`);
      return { success: true, simulated: true };
    }

    const customerName = order.customer?.name || 'Valued Customer';
    const isPickup = (order.deliveryType || '').toLowerCase().includes('pickup') || order.deliveryType === 'store-pickup';
    const items = Array.isArray(order.items) ? order.items : [];

    const itemsHtml = items.map((it, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 8px; font-size: 13px; color: #0f172a;">
          <strong>${it.name || 'Equipment'}</strong>
          ${it.brand ? `<div style="font-size: 11px; color: #64748b;">Brand: ${it.brand}</div>` : ''}
        </td>
        <td style="padding: 10px 8px; text-align: center; font-size: 13px; color: #475569;">${it.quantity || 1} NOS</td>
        <td style="padding: 10px 8px; text-align: right; font-size: 13px; font-weight: 600; color: #0f172a;">₹${Number(it.price || 0).toLocaleString('en-IN')}</td>
      </tr>
    `).join('');

    const grandTotal = Number(order.totalAmount || 0);
    const taxableTotal = Math.round(grandTotal / 1.18);
    const gstTotal = grandTotal - taxableTotal;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation - Variathu Power Tools</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <!-- Header -->
            <div style="background: #0f172a; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 0.05em; text-transform: uppercase;">
                VARIATHU POWER TOOLS
              </h1>
              <p style="color: #94a3b8; margin: 4px 0 0; font-size: 12px;">
                Authorized Equipment Clinic & Sales • Kozhencherry, Kerala
              </p>
            </div>

            <!-- Confirmation Badge -->
            <div style="padding: 24px; border-bottom: 1px solid #f1f5f9; text-align: center;">
              <div style="display: inline-block; background: #dcfce7; color: #16a34a; font-weight: 700; font-size: 13px; padding: 6px 14px; border-radius: 20px; margin-bottom: 12px;">
                ✓ ORDER CONFIRMED & VERIFIED
              </div>
              <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 6px; color: #0f172a;">
                Thank you for your order, ${customerName}!
              </h2>
              <p style="color: #64748b; font-size: 13px; margin: 0;">
                Your order <strong style="color: #0f172a;">#${order.id}</strong> has been received and is being processed by our shop team.
              </p>
            </div>

            <!-- Order Items -->
            <div style="padding: 24px;">
              <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin: 0 0 12px;">
                Ordered Equipment & Machinery
              </h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
                <thead>
                  <tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1; text-align: left;">
                    <th style="padding: 8px; font-size: 12px; color: #475569;">Item</th>
                    <th style="padding: 8px; text-align: center; font-size: 12px; color: #475569;">Qty</th>
                    <th style="padding: 8px; text-align: right; font-size: 12px; color: #475569;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Totals Breakdown -->
              <div style="background: #f8fafc; border-radius: 8px; padding: 14px; border: 1px solid #e2e8f0;">
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #64748b; margin-bottom: 4px;">
                  <span>Taxable Base Value:</span>
                  <span style="font-weight: 600; color: #0f172a;">₹${taxableTotal.toLocaleString('en-IN')}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #64748b; margin-bottom: 4px;">
                  <span>GST (CGST 9% + SGST 9%):</span>
                  <span style="font-weight: 600; color: #0f172a;">₹${gstTotal.toLocaleString('en-IN')}</span>
                </div>
                ${order.discountAmount > 0 ? `
                  <div style="display: flex; justify-content: space-between; font-size: 12px; color: #16a34a; margin-bottom: 4px;">
                    <span>Promotional Discount:</span>
                    <span style="font-weight: 700;">-₹${Number(order.discountAmount).toLocaleString('en-IN')}</span>
                  </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 800; color: #0f172a; border-top: 1px solid #cbd5e1; padding-top: 8px; margin-top: 6px;">
                  <span>Grand Total:</span>
                  <span style="color: #dc2626;">₹${grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <!-- Fulfillment / Pickup Information -->
            <div style="background: #f1f5f9; padding: 20px 24px; border-top: 1px solid #e2e8f0;">
              <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; margin: 0 0 8px;">
                ${isPickup ? '🏢 Store Counter Pickup Details' : '🚚 Doorstep Delivery Address'}
              </h3>
              ${isPickup ? `
                <p style="font-size: 13px; color: #0f172a; margin: 0 0 6px;">
                  <strong>Pickup Location:</strong> Variathu Power Tools Counter, Poyanil Building, Poyanil Junction, Kozhencherry-689641
                </p>
                ${order.pickupOtp ? `
                  <div style="display: inline-block; background: #ea580c; color: #ffffff; padding: 6px 14px; border-radius: 6px; font-weight: 800; font-size: 14px; letter-spacing: 0.1em; margin-top: 6px;">
                    PICKUP OTP: ${order.pickupOtp}
                  </div>
                ` : ''}
              ` : `
                <p style="font-size: 13px; color: #0f172a; margin: 0; line-height: 1.4;">
                  ${order.customer?.address || 'Customer Delivery Address'}<br>
                  ${order.customer?.district || 'Pathanamthitta'}, Kerala - ${order.customer?.pincode || '689641'}<br>
                  <strong>Contact:</strong> ${order.customer?.phone || '+91 94471 23456'}
                </p>
              `}
            </div>

            <!-- Action Button / Footer -->
            <div style="padding: 24px; text-align: center;">
              <p style="font-size: 12px; color: #64748b; margin: 0 0 14px;">
                You can download your statutory Indian & Kerala GST Tax Invoice anytime directly from your customer dashboard.
              </p>
              <a href="http://localhost:3000/account" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 13px;">
                View Order & GST Invoice →
              </a>
            </div>

            <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px; text-align: center; font-size: 11px; color: #94a3b8;">
              Variathu Power Tools &bull; GSTIN: 32AABCV4921E1Z8 &bull; Phone: +91 94471 23456<br>
              Poyanil Building, Near St Thomas HSS Ground, Poyanil Junction, Kozhencherry-689641
            </div>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [customerEmail],
      subject: `Order Confirmed #${order.id} - Variathu Power Tools`,
      html: htmlContent
    });

    if (error) {
      console.warn(`[Resend Email] API returned error for order #${order.id}:`, error.message);
      return { success: false, error: error.message };
    }

    console.log(`[Resend Email] Successfully sent confirmation email for order #${order.id} to ${customerEmail}. Message ID: ${data?.id}`);
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.warn(`[Resend Email] Error sending order confirmation email:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send welcome email to new registered customer
 */
async function sendWelcomeEmail(customer) {
  try {
    const email = customer.email?.trim();
    if (!email || !email.includes('@')) return { success: false };

    const resend = getResendClient();
    if (!resend) {
      console.log(`[Resend Email Simulation] Welcome email simulated for ${email}`);
      return { success: true, simulated: true };
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: `Welcome to Variathu Power Tools!`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #0f172a; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a;">Welcome to Variathu Power Tools!</h2>
          <p>Hi ${customer.name || 'there'},</p>
          <p>Your account with mobile number <strong>${customer.phone}</strong> has been successfully set up.</p>
          <p>You can now easily track heavy duty equipment orders, download compliant Kerala GST invoices, and verify in-house clinic repair warranties.</p>
          <p style="margin-top: 20px; font-size: 12px; color: #64748b;">Variathu Power Tools &bull; Poyanil Junction, Kozhencherry, Kerala</p>
        </div>
      `
    });

    if (error) return { success: false, error: error.message };
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.warn("[Resend Email] Error sending welcome email:", err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendOrderConfirmationEmail,
  sendWelcomeEmail
};
