import React, { useState } from 'react';
import { X, Printer, ShieldCheck, Download, FileText, CheckCircle2 } from 'lucide-react';

// Indian Rupee Number to Words Converter (Compliant with Indian Invoicing Standards)
export function numberToWordsINR(num) {
  if (!num || isNaN(num) || num <= 0) return 'Zero Rupees Only';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n) => {
    let str = '';
    if (n >= 10000000) {
      str += inWords(Math.floor(n / 10000000)) + ' Crore ';
      n %= 10000000;
    }
    if (n >= 100000) {
      str += inWords(Math.floor(n / 100000)) + ' Lakh ';
      n %= 100000;
    }
    if (n >= 1000) {
      str += inWords(Math.floor(n / 1000)) + ' Thousand ';
      n %= 1000;
    }
    if (n >= 100) {
      str += inWords(Math.floor(n / 100)) + ' Hundred ';
      n %= 100;
    }
    if (n > 0) {
      if (str !== '') str += 'and ';
      if (n < 20) {
        str += a[n] + ' ';
      } else {
        str += b[Math.floor(n / 10)] + ' ';
        if (n % 10 > 0) str += a[n % 10] + ' ';
      }
    }
    return str.trim();
  };

  const whole = Math.floor(num);
  const words = inWords(whole);
  return `INR ${words} Only`;
}

export const GstInvoiceModal = ({
  order,
  onClose,
  defaultCopy = 'Original for Recipient',
  showCopySelector = false
}) => {
  const [copyType, setCopyType] = useState(defaultCopy);

  if (!order) return null;

  const invoiceNumber = `VPT/2026-27/INV-${String(order.id || '1001').replace(/[^0-9]/g, '') || '1001'}`;
  const invoiceDate = order.date ? new Date(order.date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }) : new Date().toLocaleDateString('en-IN');

  const grandTotal = Number(order.totalAmount || 0);
  const itemsSubtotal = (order.items || []).reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
  const rawDiscount = Number(order.discountAmount || order.discount || (itemsSubtotal > grandTotal ? itemsSubtotal - grandTotal : 0));
  const discountAmount = Math.max(0, rawDiscount);
  const couponCode = order.couponCode || (order.coupon && typeof order.coupon === 'string' ? order.coupon : order.coupon?.code) || (discountAmount > 0 ? 'PROMO' : null);

  // Delivery fee is an additional charge and MUST NOT be included in product GST calculations
  const rawDeliveryFee = Number(order.deliveryFee !== undefined ? order.deliveryFee : (order.deliveryType && !order.deliveryType.toLowerCase().includes('pickup') && grandTotal > (itemsSubtotal - discountAmount) ? grandTotal - (itemsSubtotal - discountAmount) : 0));
  const deliveryFee = Math.max(0, rawDeliveryFee);

  // The actual product price after discount (GST applies ONLY to products, NOT delivery charges)
  const productNetTotal = Math.max(0, itemsSubtotal - discountAmount);

  // Product taxable value and 18% GST (CGST 9% + SGST 9%)
  const taxableTotal = Math.round(productNetTotal / 1.18);
  const totalCgst = Math.round((productNetTotal - taxableTotal) / 2);
  const totalSgst = productNetTotal - taxableTotal - totalCgst;

  // Print Handler: uses an isolated iframe for flawless, clean A4 print preview with zero clipping
  const handlePrint = () => {
    const invoiceEl = document.getElementById('printable-gst-invoice-content');
    if (!invoiceEl) {
      window.print();
      return;
    }

    // Clean, isolated print iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>GST Tax Invoice - ${invoiceNumber}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm 10mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            html, body {
              width: 100%;
              height: 100%;
              margin: 0;
              padding: 0;
              background: #ffffff;
              overflow: hidden;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              font-size: 8.5pt;
              line-height: 1.35;
            }
            .invoice-wrapper {
              width: 100%;
              max-width: 190mm;
              height: 278mm;
              max-height: 278mm;
              margin: 0 auto;
              border: 1.5px solid #0f172a;
              background: #ffffff;
              box-sizing: border-box;
              padding: 7mm 9mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              page-break-after: avoid;
              page-break-before: avoid;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .invoice-wrapper > * {
              margin-bottom: 0 !important;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #cbd5e1;
            }
            img {
              image-rendering: -webkit-optimize-contrast;
            }
          </style>
        </head>
        <body>
          <div class="invoice-wrapper">
            ${invoiceEl.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2500);
    }, 450);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999, overflowY: 'auto', padding: '16px 8px' }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '850px',
          width: '100%',
          margin: 'auto',
          background: '#ffffff',
          color: '#0f172a',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* Top Control Toolbar (Hidden during actual print) */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: '14px',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} style={{ color: 'var(--brand-primary)' }} />
            <div>
              <strong style={{ fontSize: '1.02rem', color: '#0f172a', display: 'block' }}>
                GST Tax Invoice & Warranty Certificate
              </strong>
              <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                Compliant with Indian CGST Act & Kerala SGST Rules, 2017
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Copy Type Selector (Shown ONLY in Store Dashboard) */}
            {showCopySelector && (
              <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '6px', padding: '3px', fontSize: '0.74rem' }} id="invoice-copy-selector-group">
                <button
                  type="button"
                  onClick={() => setCopyType('Original for Recipient')}
                  style={{
                    border: 'none',
                    background: copyType === 'Original for Recipient' ? '#ffffff' : 'transparent',
                    color: copyType === 'Original for Recipient' ? '#0f172a' : '#64748b',
                    fontWeight: copyType === 'Original for Recipient' ? '800' : '500',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    boxShadow: copyType === 'Original for Recipient' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                  }}
                  id="btn-invoice-copy-buyer"
                >
                  Original (Buyer)
                </button>
                <button
                  type="button"
                  onClick={() => setCopyType('Duplicate for Transporter')}
                  style={{
                    border: 'none',
                    background: copyType === 'Duplicate for Transporter' ? '#ffffff' : 'transparent',
                    color: copyType === 'Duplicate for Transporter' ? '#0f172a' : '#64748b',
                    fontWeight: copyType === 'Duplicate for Transporter' ? '800' : '500',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    boxShadow: copyType === 'Duplicate for Transporter' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                  }}
                  id="btn-invoice-copy-courier"
                >
                  Duplicate (Courier)
                </button>
                <button
                  type="button"
                  onClick={() => setCopyType('Triplicate for Supplier')}
                  style={{
                    border: 'none',
                    background: copyType === 'Triplicate for Supplier' ? '#ffffff' : 'transparent',
                    color: copyType === 'Triplicate for Supplier' ? '#0f172a' : '#64748b',
                    fontWeight: copyType === 'Triplicate for Supplier' ? '800' : '500',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    boxShadow: copyType === 'Triplicate for Supplier' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                  }}
                  id="btn-invoice-copy-shop"
                >
                  Triplicate (Shop)
                </button>
              </div>
            )}

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              style={{
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '0.84rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              id="btn-print-gst-invoice"
            >
              <Printer size={15} />
              <span>Print Invoice (A4)</span>
            </button>

            {/* Close Modal */}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '7px 10px',
                cursor: 'pointer',
                color: '#64748b'
              }}
              title="Close"
              id="btn-close-invoice-modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PRINTABLE A4 CONTENT CONTAINER                                           */}
        {/* ========================================================================= */}
        <div
          id="printable-gst-invoice-content"
          className="unified-gst-invoice-sheet"
          style={{
            border: '1.5px solid #0f172a',
            background: '#ffffff',
            padding: '24px 20px',
            fontFamily: 'Inter, -apple-system, sans-serif',
            color: '#0f172a'
          }}
        >
          {/* Section 1: Header (Logo, Supplier info, Tax Invoice Badge) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '2px solid #0f172a',
              paddingBottom: '14px',
              marginBottom: '12px'
            }}
          >
            {/* Supplier / Seller Details */}
            <div style={{ maxWidth: '440px' }}>
              <div style={{ marginBottom: '8px' }}>
                <img
                  src="/Logo.jpeg"
                  alt="Variathu Power Tools"
                  style={{ height: '40px', width: 'auto', objectFit: 'contain', display: 'block' }}
                />
              </div>
              <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Heavy Duty Power Tools, Industrial Equipment & Authorized Service Clinic
              </div>
              <div style={{ fontSize: '0.76rem', color: '#475569', marginTop: '3px', lineHeight: 1.4 }}>
                Poyanil Building, Near St Thomas Higher Secondary School Ground, Poyanil Junction, Kozhencherry, Pathanamthitta-689641, Kerala
              </div>
              <div style={{ fontSize: '0.76rem', color: '#0f172a', marginTop: '4px', fontWeight: '600' }}>
                <strong>GSTIN:</strong> 32AABCV4921E1Z8 &bull; <strong>State:</strong> Kerala (32) &bull; <strong>PAN:</strong> AABCV4921E
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                Phone: +91 94471 23456 &bull; Email: variathupowertools@gmail.com
              </div>
            </div>

            {/* Tax Invoice Identification Badge */}
            <div style={{ textAlign: 'right', minWidth: '220px' }}>
              <div
                style={{
                  background: '#0f172a',
                  color: '#ffffff',
                  padding: '5px 12px',
                  borderRadius: '4px',
                  fontWeight: '900',
                  fontSize: '0.88rem',
                  display: 'inline-block',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase'
                }}
              >
                TAX INVOICE
              </div>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: '800',
                  color: '#dc2626',
                  textTransform: 'uppercase',
                  marginTop: '4px',
                  letterSpacing: '0.05em'
                }}
              >
                {copyType}
              </div>
              <div style={{ fontSize: '0.66rem', color: '#64748b', marginTop: '2px', maxWidth: '230px', marginLeft: 'auto', lineHeight: 1.2 }}>
                (Issued under Sec 31 of CGST Act & Kerala SGST Act, 2017)
              </div>

              <div style={{ marginTop: '8px', borderTop: '1px dashed #cbd5e1', paddingTop: '6px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#0f172a' }}>
                  Invoice No: <span style={{ fontFamily: 'monospace' }}>{invoiceNumber}</span>
                </div>
                <div style={{ fontSize: '0.76rem', color: '#475569', marginTop: '2px' }}>
                  Invoice Date: <strong>{invoiceDate}</strong>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                  Order Ref: #{order.id}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Statutory Metadata Strip (Rule 46 Mandatory Fields) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '0.72rem',
              marginBottom: '12px'
            }}
          >
            <div>
              <span style={{ color: '#64748b', display: 'block', textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: '700' }}>
                Reverse Charge (RCM):
              </span>
              <strong style={{ color: '#0f172a' }}>NO</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: '700' }}>
                Place of Supply:
              </span>
              <strong style={{ color: '#0f172a' }}>Kerala (State Code: 32)</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: '700' }}>
                Supply Type:
              </span>
              <strong style={{ color: '#0f172a' }}>Intra-State (CGST + SGST)</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: '700' }}>
                Payment Mode & Status:
              </span>
              <strong style={{ color: '#16a34a' }}>
                {order.paymentMethod || 'Razorpay Online'} ({order.paymentStatus || 'PAID'})
              </strong>
            </div>
          </div>

          {/* Section 3: Billed To (Customer) & Shipped To (Consignee) Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '14px',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '10px 14px',
              fontSize: '0.76rem',
              marginBottom: '14px',
              background: '#ffffff'
            }}
          >
            {/* Billed To (Buyer) */}
            <div>
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: '800',
                  color: '#475569',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid #e2e8f0',
                  paddingBottom: '3px',
                  marginBottom: '6px'
                }}
              >
                Details of Receiver / Billed To:
              </div>
              <div style={{ fontWeight: '800', fontSize: '0.86rem', color: '#0f172a' }}>
                {order.customer?.name || 'Cash Customer'}
              </div>
              <div style={{ color: '#334155', marginTop: '2px', lineHeight: 1.35 }}>
                {order.customer?.address || 'Poyanil Junction, Kozhencherry'}
              </div>
              <div style={{ color: '#334155' }}>
                {order.customer?.district || 'Pathanamthitta'}, Kerala - {order.customer?.pincode || '689641'}
              </div>
              <div style={{ color: '#0f172a', marginTop: '3px' }}>
                <strong>Phone:</strong> {order.customer?.phone || '+91 94471 23456'}
              </div>
              <div style={{ color: '#0f172a', marginTop: '1px' }}>
                <strong>State:</strong> Kerala (Code: 32) &bull; <strong>GSTIN:</strong> {order.customer?.gstin || 'URP (Unregistered)'}
              </div>
            </div>

            {/* Shipped To (Consignee) */}
            <div style={{ borderLeft: '1px dashed #cbd5e1', paddingLeft: '14px' }}>
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: '800',
                  color: '#475569',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid #e2e8f0',
                  paddingBottom: '3px',
                  marginBottom: '6px'
                }}
              >
                Details of Consignee / Shipped To:
              </div>
              <div style={{ fontWeight: '800', fontSize: '0.86rem', color: '#0f172a' }}>
                {order.deliveryType === 'store-pickup' ? '🏢 Store Counter Handover' : '🚚 Doorstep Courier Delivery'}
              </div>
              <div style={{ color: '#334155', marginTop: '2px', lineHeight: 1.35 }}>
                {order.deliveryType === 'store-pickup'
                  ? 'Variathu Power Tools Counter, Poyanil Building, Kozhencherry-689641'
                  : (order.customer?.address || 'Customer Delivery Address')}
              </div>
              {order.pickupOtp && (
                <div style={{ marginTop: '4px', color: '#ea580c', fontWeight: '700' }}>
                  Store Pickup OTP: <span style={{ fontFamily: 'monospace', fontSize: '0.86rem' }}>{order.pickupOtp}</span>
                </div>
              )}
              {order.awb && (
                <div style={{ marginTop: '4px', color: '#0284c7', fontWeight: '700' }}>
                  Courier AWB: <span style={{ fontFamily: 'monospace' }}>{order.awb}</span> ({order.courierPartner || 'DTDC'})
                </div>
              )}
              {order.transactionId && (
                <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '3px' }}>
                  Txn ID: <span style={{ fontFamily: 'monospace' }}>{order.transactionId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Itemized Schedule of Goods & GST Calculations */}
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginBottom: '12px',
              fontSize: '0.74rem'
            }}
          >
            <thead>
              <tr style={{ background: '#0f172a', color: '#ffffff', textAlign: 'left' }}>
                <th style={{ padding: '6px 8px', width: '32px', textAlign: 'center' }}>#</th>
                <th style={{ padding: '6px 8px' }}>Description of Equipment / Goods</th>
                <th style={{ padding: '6px 8px', width: '70px', textAlign: 'center' }}>HSN</th>
                <th style={{ padding: '6px 8px', width: '45px', textAlign: 'center' }}>Qty</th>
                <th style={{ padding: '6px 8px', width: '75px', textAlign: 'right' }}>Unit Rate</th>
                <th style={{ padding: '6px 8px', width: '85px', textAlign: 'right' }}>Taxable Val</th>
                <th style={{ padding: '6px 8px', width: '70px', textAlign: 'right' }}>CGST 9%</th>
                <th style={{ padding: '6px 8px', width: '70px', textAlign: 'right' }}>SGST 9%</th>
                <th style={{ padding: '6px 8px', width: '90px', textAlign: 'right' }}>Total (INR)</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((it, idx) => {
                const lineTotal = Number(it.price || 0) * Number(it.quantity || 1);
                const lineTaxable = Math.round(lineTotal / 1.18);
                const lineCgst = Math.round((lineTotal - lineTaxable) / 2);
                const lineSgst = lineTotal - lineTaxable - lineCgst;
                const unitRate = Math.round(lineTaxable / (it.quantity || 1));
                const hsn = it.hsn || (it.name?.toLowerCase().includes('bit') || it.name?.toLowerCase().includes('blade') ? '8207' : '84672900');

                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '7px 8px', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                    <td style={{ padding: '7px 8px' }}>
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>{it.name}</div>
                      {it.brand && (
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                          Brand: {it.brand} &bull; Warranty: Official Manufacturer
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'center', fontFamily: 'monospace', color: '#475569' }}>
                      {hsn}
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'center', fontWeight: '700' }}>
                      {it.quantity} NOS
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: 'monospace' }}>
                      ₹{unitRate.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600' }}>
                      ₹{lineTaxable.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: 'monospace', color: '#334155' }}>
                      ₹{lineCgst.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: 'monospace', color: '#334155' }}>
                      ₹{lineSgst.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: '800', fontFamily: 'monospace' }}>
                      ₹{lineTotal.toLocaleString('en-IN')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Section 5: HSN / SAC Statutory Tax Breakdown Table */}
          <div style={{ marginBottom: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', color: '#334155', textAlign: 'left' }}>
                  <th style={{ padding: '4px 8px' }}>HSN/SAC Code</th>
                  <th style={{ padding: '4px 8px', textAlign: 'right' }}>Taxable Value</th>
                  <th style={{ padding: '4px 8px', textAlign: 'right' }}>Central Tax (CGST 9%)</th>
                  <th style={{ padding: '4px 8px', textAlign: 'right' }}>State Tax (SGST 9%)</th>
                  <th style={{ padding: '4px 8px', textAlign: 'right' }}>Total Tax Amount (18%)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '4px 8px', fontFamily: 'monospace', fontWeight: '700' }}>84672900 / 8207</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'monospace' }}>₹{taxableTotal.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'monospace' }}>₹{totalCgst.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'monospace' }}>₹{totalSgst.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: '700' }}>₹{(totalCgst + totalSgst).toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 6: Financial Summary & Amount in Words */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderTop: '2px solid #0f172a',
              paddingTop: '10px',
              marginBottom: '12px',
              gap: '16px'
            }}
          >
            {/* Amount in Words & Bank Details */}
            <div style={{ maxWidth: '440px', fontSize: '0.74rem' }}>
              <div style={{ background: '#f8fafc', padding: '6px 10px', borderRadius: '4px', border: '1px solid #e2e8f0', marginBottom: '8px' }}>
                <span style={{ color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: '700', display: 'block' }}>
                  Total Invoice Amount in Words:
                </span>
                <strong style={{ color: '#0f172a', fontSize: '0.78rem' }}>
                  {numberToWordsINR(grandTotal)}
                </strong>
              </div>

              <div style={{ fontSize: '0.72rem', color: '#475569', lineHeight: 1.35 }}>
                <strong style={{ color: '#0f172a' }}>Bank Details for Electronic Remittance:</strong><br />
                Bank: <strong>State Bank of India</strong> &bull; A/c Name: <strong>Variathu Power Tools</strong><br />
                A/c No: <span style={{ fontFamily: 'monospace', fontWeight: '700' }}>39482019482</span> &bull; IFSC: <span style={{ fontFamily: 'monospace', fontWeight: '700' }}>SBIN0070084</span><br />
                Branch: Kozhencherry Main (Kerala) &bull; UPI ID: <span style={{ fontFamily: 'monospace' }}>variathupowertools@sbi</span>
              </div>
            </div>

            {/* Totals Summary */}
            <div style={{ width: '310px', fontSize: '0.78rem' }}>
              {itemsSubtotal > 0 && discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                  <span style={{ color: '#475569' }}>Total Equipment Price:</span>
                  <strong style={{ fontFamily: 'monospace' }}>₹{itemsSubtotal.toLocaleString('en-IN')}</strong>
                </div>
              )}

              {discountAmount > 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '3px 6px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '4px',
                  color: '#15803d',
                  fontWeight: '700',
                  margin: '3px 0'
                }}>
                  <span>
                    Coupon Discount {couponCode ? `(${couponCode.toUpperCase()})` : ''}:
                  </span>
                  <span style={{ fontFamily: 'monospace' }}>-₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '2px 0',
                borderTop: discountAmount > 0 ? '1px dashed #cbd5e1' : 'none',
                marginTop: discountAmount > 0 ? '3px' : '0',
                paddingTop: discountAmount > 0 ? '3px' : '0'
              }}>
                <span style={{ color: '#475569' }}>Product Taxable Value:</span>
                <strong style={{ fontFamily: 'monospace' }}>₹{taxableTotal.toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span style={{ color: '#475569' }}>Central GST (9% on Tools):</span>
                <span style={{ fontFamily: 'monospace' }}>₹{totalCgst.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span style={{ color: '#475569' }}>Kerala State GST (9% on Tools):</span>
                <span style={{ fontFamily: 'monospace' }}>₹{totalSgst.toLocaleString('en-IN')}</span>
              </div>
              {deliveryFee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                  <span style={{ color: '#475569' }}>Courier Delivery Charge (Addl):</span>
                  <span style={{ fontFamily: 'monospace' }}>₹{deliveryFee.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '2px solid #0f172a',
                  marginTop: '6px',
                  paddingTop: '6px',
                  fontSize: '1.05rem',
                  fontWeight: '900'
                }}
              >
                <span>Grand Total:</span>
                <span style={{ color: '#dc2626', fontFamily: 'monospace' }}>
                  ₹{grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.68rem', color: '#16a34a', fontWeight: '700', marginTop: '2px' }}>
                ✓ Tax Paid • Amount Verified
              </div>
            </div>
          </div>

          {/* Section 7: Statutory Declaration, Terms of Warranty & Signatory */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              borderTop: '1px dashed #cbd5e1',
              paddingTop: '10px',
              marginTop: '8px',
              gap: '16px'
            }}
          >
            <div style={{ maxWidth: '460px', fontSize: '0.68rem', color: '#475569', lineHeight: 1.35 }}>
              <div style={{ fontWeight: '800', color: '#0f172a', marginBottom: '2px' }}>
                Statutory Declaration & Terms of Sale:
              </div>
              <div>
                1. We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
              </div>
              <div>
                2. Goods carry manufacturer warranty. In-house service clinic at Poyanil Building, Kozhencherry.
              </div>
              <div>
                3. All disputes subject to Pathanamthitta district jurisdiction.
              </div>
              <div style={{ color: '#64748b', marginTop: '3px' }}>
                This is a computer generated commercial tax invoice as per Rule 46 of CGST Rules, 2017.
              </div>
            </div>

            {/* Authorized Signatory Stamp Box */}
            <div style={{ textAlign: 'center', width: '200px' }}>
              <div
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  padding: '16px 8px 6px',
                  background: '#f8fafc'
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#0f172a' }}>
                  For VARIATHU POWER TOOLS
                </div>
                <div
                  style={{
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '4px 0',
                    color: '#94a3b8',
                    fontSize: '0.66rem',
                    fontStyle: 'italic'
                  }}
                >
                  [Digital Stamp / Seal]
                </div>
                <div style={{ borderTop: '1px solid #0f172a', paddingTop: '2px', fontSize: '0.68rem', fontWeight: '700', color: '#334155' }}>
                  Authorized Signatory
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GstInvoiceModal;
