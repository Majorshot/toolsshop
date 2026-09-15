const { Resend } = require('resend');

// Initialize Resend client
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 're_your_resend_api_key_here') {
    return null;
  }
  return new Resend(apiKey.trim());
};

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

// ─── Shared Email Layout Wrapper ───────────────────────────────────────────────
function emailWrapper(title, bodyContent) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <!-- Header -->
          <div style="background: #0f172a; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 0.05em; text-transform: uppercase;">
              VARIATHU POWER TOOLS
            </h1>
            <p style="color: #94a3b8; margin: 4px 0 0; font-size: 12px;">
              Authorized Equipment Clinic &amp; Sales &bull; Kozhencherry, Kerala
            </p>
          </div>

          ${bodyContent}

          <!-- Footer -->
          <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px; text-align: center; font-size: 11px; color: #94a3b8;">
            Variathu Power Tools &bull; GSTIN: 32AABCV4921E1Z8 &bull; Phone: +91 94471 23456<br>
            Poyanil Building, Near St Thomas HSS Ground, Poyanil Junction, Kozhencherry-689641
          </div>
        </div>
      </body>
    </html>
  `;
}

// ─── Helper: Build items table HTML ────────────────────────────────────────────
function buildItemsTable(items) {
  const rows = (items || []).map(it => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 10px 8px; font-size: 13px; color: #0f172a;">
        <strong>${it.name || 'Equipment'}</strong>
        ${it.brand ? `<div style="font-size: 11px; color: #64748b;">Brand: ${it.brand}</div>` : ''}
      </td>
      <td style="padding: 10px 8px; text-align: center; font-size: 13px; color: #475569;">${it.quantity || 1} NOS</td>
      <td style="padding: 10px 8px; text-align: right; font-size: 13px; font-weight: 600; color: #0f172a;">₹${Number(it.price || 0).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  return `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
      <thead>
        <tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1; text-align: left;">
          <th style="padding: 8px; font-size: 12px; color: #475569;">Item</th>
          <th style="padding: 8px; text-align: center; font-size: 12px; color: #475569;">Qty</th>
          <th style="padding: 8px; text-align: right; font-size: 12px; color: #475569;">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// ─── Helper: Build totals breakdown ────────────────────────────────────────────
function buildTotalsBlock(order) {
  const grandTotal = Number(order.totalAmount || 0);
  const taxableTotal = Math.round(grandTotal / 1.18);
  const gstTotal = grandTotal - taxableTotal;

  return `
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
  `;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. ORDER CONFIRMATION EMAIL
// ═══════════════════════════════════════════════════════════════════════════════
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

    const bodyContent = `
      <!-- Confirmation Badge -->
      <div style="padding: 24px; border-bottom: 1px solid #f1f5f9; text-align: center;">
        <div style="display: inline-block; background: #dcfce7; color: #16a34a; font-weight: 700; font-size: 13px; padding: 6px 14px; border-radius: 20px; margin-bottom: 12px;">
          ✓ ORDER CONFIRMED &amp; VERIFIED
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
          Ordered Equipment &amp; Machinery
        </h3>
        ${buildItemsTable(order.items)}
        ${buildTotalsBlock(order)}
      </div>

      <!-- Fulfillment Info -->
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
            <strong>Contact:</strong> ${order.customer?.phone || ''}
          </p>
        `}
      </div>

      <!-- Action Button -->
      <div style="padding: 24px; text-align: center;">
        <p style="font-size: 12px; color: #64748b; margin: 0 0 14px;">
          You can download your statutory Indian &amp; Kerala GST Tax Invoice anytime directly from your customer dashboard.
        </p>
        <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/account" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 13px;">
          View Order &amp; GST Invoice →
        </a>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [customerEmail],
      subject: `Order Confirmed #${order.id} - Variathu Power Tools`,
      html: emailWrapper('Order Confirmation - Variathu Power Tools', bodyContent)
    });

    if (error) {
      console.warn(`[Resend Email] API error for order #${order.id}:`, error.message);
      return { success: false, error: error.message };
    }

    console.log(`[Resend Email] ✅ Order confirmation sent for #${order.id} to ${customerEmail}. ID: ${data?.id}`);
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.warn(`[Resend Email] Error sending order confirmation:`, err.message);
    return { success: false, error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. CANCELLATION REQUEST EMAIL (Customer requested cancellation, pending review)
// ═══════════════════════════════════════════════════════════════════════════════
async function sendCancellationRequestEmail(order, reason) {
  try {
    const customerEmail = order.customer?.email?.trim();
    if (!customerEmail || !customerEmail.includes('@')) {
      return { success: false, reason: 'no_email' };
    }

    const resend = getResendClient();
    if (!resend) {
      console.log(`[Resend Email Simulation] Cancellation request simulated for order #${order.id}`);
      return { success: true, simulated: true };
    }

    const customerName = order.customer?.name || 'Valued Customer';

    const bodyContent = `
      <!-- Status Badge -->
      <div style="padding: 24px; border-bottom: 1px solid #f1f5f9; text-align: center;">
        <div style="display: inline-block; background: #fef3c7; color: #d97706; font-weight: 700; font-size: 13px; padding: 6px 14px; border-radius: 20px; margin-bottom: 12px;">
          ⏳ CANCELLATION REQUEST RECEIVED
        </div>
        <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 6px; color: #0f172a;">
          We've received your cancellation request
        </h2>
        <p style="color: #64748b; font-size: 13px; margin: 0;">
          Hi ${customerName}, your cancellation request for order <strong style="color: #0f172a;">#${order.id}</strong> has been submitted and is under review by our store team.
        </p>
      </div>

      <!-- Request Details -->
      <div style="padding: 24px;">
        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <h4 style="font-size: 13px; color: #92400e; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.05em;">Request Details</h4>
          <p style="font-size: 13px; color: #78350f; margin: 0 0 4px;">
            <strong>Order ID:</strong> #${order.id}
          </p>
          <p style="font-size: 13px; color: #78350f; margin: 0 0 4px;">
            <strong>Order Total:</strong> ₹${Number(order.totalAmount || 0).toLocaleString('en-IN')}
          </p>
          ${reason ? `
            <p style="font-size: 13px; color: #78350f; margin: 0;">
              <strong>Reason:</strong> ${reason}
            </p>
          ` : ''}
        </div>

        <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin: 0 0 12px;">
          Items in This Order
        </h3>
        ${buildItemsTable(order.items)}
      </div>

      <!-- What Happens Next -->
      <div style="background: #f1f5f9; padding: 20px 24px; border-top: 1px solid #e2e8f0;">
        <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; margin: 0 0 8px;">
          📋 What Happens Next?
        </h3>
        <ul style="font-size: 13px; color: #334155; margin: 0; padding-left: 16px; line-height: 1.8;">
          <li>Our store team will review your cancellation request within 24 hours</li>
          <li>If approved, your order will be cancelled and refund (if applicable) will be initiated</li>
          <li>You'll receive a confirmation email once the cancellation is processed</li>
          <li>For urgent queries, call us at <strong>+91 94471 23456</strong></li>
        </ul>
      </div>

      <!-- Action Button -->
      <div style="padding: 24px; text-align: center;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/account" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 13px;">
          Track Request Status →
        </a>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [customerEmail],
      subject: `Cancellation Request Received #${order.id} - Variathu Power Tools`,
      html: emailWrapper('Cancellation Request - Variathu Power Tools', bodyContent)
    });

    if (error) {
      console.warn(`[Resend Email] API error for cancellation request #${order.id}:`, error.message);
      return { success: false, error: error.message };
    }

    console.log(`[Resend Email] ✅ Cancellation request email sent for #${order.id} to ${customerEmail}. ID: ${data?.id}`);
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.warn(`[Resend Email] Error sending cancellation request email:`, err.message);
    return { success: false, error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. ORDER CANCELLED EMAIL (Cancellation confirmed / approved)
// ═══════════════════════════════════════════════════════════════════════════════
async function sendOrderCancelledEmail(order, reason, cancelledBy) {
  try {
    const customerEmail = order.customer?.email?.trim();
    if (!customerEmail || !customerEmail.includes('@')) {
      return { success: false, reason: 'no_email' };
    }

    const resend = getResendClient();
    if (!resend) {
      console.log(`[Resend Email Simulation] Order cancelled email simulated for #${order.id}`);
      return { success: true, simulated: true };
    }

    const customerName = order.customer?.name || 'Valued Customer';
    const isByStore = cancelledBy === 'store';

    const bodyContent = `
      <!-- Status Badge -->
      <div style="padding: 24px; border-bottom: 1px solid #f1f5f9; text-align: center;">
        <div style="display: inline-block; background: #fee2e2; color: #dc2626; font-weight: 700; font-size: 13px; padding: 6px 14px; border-radius: 20px; margin-bottom: 12px;">
          ✕ ORDER CANCELLED
        </div>
        <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 6px; color: #0f172a;">
          Your order has been cancelled
        </h2>
        <p style="color: #64748b; font-size: 13px; margin: 0;">
          Hi ${customerName}, order <strong style="color: #0f172a;">#${order.id}</strong> has been ${isByStore ? 'cancelled by the store' : 'successfully cancelled as per your request'}.
        </p>
      </div>

      <!-- Cancellation Details -->
      <div style="padding: 24px;">
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <h4 style="font-size: 13px; color: #991b1b; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.05em;">Cancellation Summary</h4>
          <p style="font-size: 13px; color: #7f1d1d; margin: 0 0 4px;">
            <strong>Order ID:</strong> #${order.id}
          </p>
          <p style="font-size: 13px; color: #7f1d1d; margin: 0 0 4px;">
            <strong>Order Total:</strong> ₹${Number(order.totalAmount || 0).toLocaleString('en-IN')}
          </p>
          <p style="font-size: 13px; color: #7f1d1d; margin: 0 0 4px;">
            <strong>Cancelled By:</strong> ${isByStore ? 'Store Team' : 'Customer Request'}
          </p>
          ${reason ? `
            <p style="font-size: 13px; color: #7f1d1d; margin: 0;">
              <strong>Reason:</strong> ${reason}
            </p>
          ` : ''}
        </div>

        <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin: 0 0 12px;">
          Cancelled Items
        </h3>
        ${buildItemsTable(order.items)}
        ${buildTotalsBlock(order)}
      </div>

      <!-- Refund Information -->
      <div style="background: #f1f5f9; padding: 20px 24px; border-top: 1px solid #e2e8f0;">
        <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; margin: 0 0 8px;">
          💰 Refund Information
        </h3>
        <ul style="font-size: 13px; color: #334155; margin: 0; padding-left: 16px; line-height: 1.8;">
          <li>If payment was made online, refund will be initiated to your original payment method</li>
          <li>Bank refunds typically take 5-7 business days to reflect in your account</li>
          <li>For COD orders, no refund action is required</li>
          <li>For any refund queries, contact us at <strong>+91 94471 23456</strong></li>
        </ul>
      </div>

      <!-- Action Button -->
      <div style="padding: 24px; text-align: center;">
        <p style="font-size: 12px; color: #64748b; margin: 0 0 14px;">
          We'd love to serve you again. Browse our latest equipment collection!
        </p>
        <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/shop" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 13px;">
          Continue Shopping →
        </a>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [customerEmail],
      subject: `Order Cancelled #${order.id} - Variathu Power Tools`,
      html: emailWrapper('Order Cancelled - Variathu Power Tools', bodyContent)
    });

    if (error) {
      console.warn(`[Resend Email] API error for cancelled email #${order.id}:`, error.message);
      return { success: false, error: error.message };
    }

    console.log(`[Resend Email] ✅ Order cancelled email sent for #${order.id} to ${customerEmail}. ID: ${data?.id}`);
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.warn(`[Resend Email] Error sending cancelled email:`, err.message);
    return { success: false, error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. ORDER DISPATCHED / COURIER EMAIL
// ═══════════════════════════════════════════════════════════════════════════════
async function sendOrderDispatchedEmail(order, courierPartner, awb) {
  try {
    const customerEmail = order.customer?.email?.trim();
    if (!customerEmail || !customerEmail.includes('@')) {
      return { success: false, reason: 'no_email' };
    }

    const resend = getResendClient();
    if (!resend) {
      console.log(`[Resend Email Simulation] Dispatched email simulated for order #${order.id}`);
      return { success: true, simulated: true };
    }

    const customerName = order.customer?.name || 'Valued Customer';

    const bodyContent = `
      <!-- Status Badge -->
      <div style="padding: 24px; border-bottom: 1px solid #f1f5f9; text-align: center;">
        <div style="display: inline-block; background: #dbeafe; color: #2563eb; font-weight: 700; font-size: 13px; padding: 6px 14px; border-radius: 20px; margin-bottom: 12px;">
          🚚 ORDER DISPATCHED
        </div>
        <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 6px; color: #0f172a;">
          Your order is on its way!
        </h2>
        <p style="color: #64748b; font-size: 13px; margin: 0;">
          Hi ${customerName}, great news! Your order <strong style="color: #0f172a;">#${order.id}</strong> has been dispatched and is headed to your doorstep.
        </p>
      </div>

      <!-- Courier & Tracking Details -->
      <div style="padding: 24px;">
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <h4 style="font-size: 13px; color: #1e40af; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.05em;">📦 Shipping Details</h4>
          ${courierPartner ? `
            <p style="font-size: 13px; color: #1e3a5f; margin: 0 0 6px;">
              <strong>Courier Partner:</strong> ${courierPartner}
            </p>
          ` : ''}
          ${awb ? `
            <p style="font-size: 13px; color: #1e3a5f; margin: 0 0 6px;">
              <strong>AWB / Tracking No:</strong> <span style="font-family: monospace; background: #ffffff; padding: 2px 8px; border-radius: 4px; border: 1px solid #93c5fd; font-weight: 700; color: #1d4ed8;">${awb}</span>
            </p>
          ` : ''}
          <p style="font-size: 13px; color: #1e3a5f; margin: 0 0 6px;">
            <strong>Order Total:</strong> ₹${Number(order.totalAmount || 0).toLocaleString('en-IN')}
          </p>
          <p style="font-size: 13px; color: #1e3a5f; margin: 0;">
            <strong>Payment:</strong> ${(order.paymentMethod || 'COD').toUpperCase()}
          </p>
        </div>

        <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin: 0 0 12px;">
          Dispatched Items
        </h3>
        ${buildItemsTable(order.items)}
      </div>

      <!-- Delivery Address -->
      <div style="background: #f1f5f9; padding: 20px 24px; border-top: 1px solid #e2e8f0;">
        <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; margin: 0 0 8px;">
          📍 Delivery Address
        </h3>
        <p style="font-size: 13px; color: #0f172a; margin: 0; line-height: 1.6;">
          <strong>${customerName}</strong><br>
          ${order.customer?.address || ''}<br>
          ${order.customer?.district || 'Pathanamthitta'}, ${order.customer?.state || 'Kerala'} - ${order.customer?.pincode || '689641'}<br>
          <strong>Phone:</strong> ${order.customer?.phone || ''}
        </p>
      </div>

      <!-- Delivery Tips -->
      <div style="padding: 20px 24px; border-top: 1px solid #e2e8f0;">
        <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; margin: 0 0 8px;">
          📋 Delivery Tips
        </h3>
        <ul style="font-size: 13px; color: #334155; margin: 0; padding-left: 16px; line-height: 1.8;">
          <li>Keep your phone reachable — the courier partner may call before delivery</li>
          <li>Inspect the package for damage before accepting</li>
          ${(order.paymentMethod || '').toLowerCase() === 'cod' ? '<li>Keep exact change ready for Cash on Delivery payment</li>' : ''}
          <li>Estimated delivery: 3-7 business days depending on your location</li>
        </ul>
      </div>

      <!-- Action Button -->
      <div style="padding: 24px; text-align: center;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/account" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 13px;">
          Track Your Order →
        </a>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [customerEmail],
      subject: `Order Dispatched 🚚 #${order.id} - Variathu Power Tools`,
      html: emailWrapper('Order Dispatched - Variathu Power Tools', bodyContent)
    });

    if (error) {
      console.warn(`[Resend Email] API error for dispatched email #${order.id}:`, error.message);
      return { success: false, error: error.message };
    }

    console.log(`[Resend Email] ✅ Dispatched email sent for #${order.id} to ${customerEmail}. ID: ${data?.id}`);
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.warn(`[Resend Email] Error sending dispatched email:`, err.message);
    return { success: false, error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. WELCOME EMAIL (New customer registration)
// ═══════════════════════════════════════════════════════════════════════════════
async function sendWelcomeEmail(customer) {
  try {
    const email = customer.email?.trim();
    if (!email || !email.includes('@')) return { success: false };

    const resend = getResendClient();
    if (!resend) {
      console.log(`[Resend Email Simulation] Welcome email simulated for ${email}`);
      return { success: true, simulated: true };
    }

    const bodyContent = `
      <div style="padding: 24px; text-align: center; border-bottom: 1px solid #f1f5f9;">
        <div style="display: inline-block; background: #dcfce7; color: #16a34a; font-weight: 700; font-size: 13px; padding: 6px 14px; border-radius: 20px; margin-bottom: 12px;">
          🎉 WELCOME ABOARD
        </div>
        <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 6px; color: #0f172a;">
          Welcome to Variathu Power Tools!
        </h2>
        <p style="color: #64748b; font-size: 13px; margin: 0;">
          Hi ${customer.name || 'there'}, your account with mobile number <strong>${customer.phone}</strong> has been set up successfully.
        </p>
      </div>
      <div style="padding: 24px;">
        <p style="font-size: 13px; color: #334155; line-height: 1.6;">
          You can now easily track heavy duty equipment orders, download compliant Kerala GST invoices, and manage your account seamlessly.
        </p>
        <div style="text-align: center; margin-top: 20px;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/shop" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 13px;">
            Start Shopping →
          </a>
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: `Welcome to Variathu Power Tools!`,
      html: emailWrapper('Welcome - Variathu Power Tools', bodyContent)
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
  sendCancellationRequestEmail,
  sendOrderCancelledEmail,
  sendOrderDispatchedEmail,
  sendWelcomeEmail
};
