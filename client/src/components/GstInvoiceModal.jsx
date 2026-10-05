import React, { useState } from 'react';
import { X, Printer, ShieldCheck, Download, Edit3, Check, RotateCcw } from 'lucide-react';
import { api } from '../services/api';

/**
 * Returns dynamic Indian Financial Year code based on date.
 * Financial Year runs April 1 to March 31.
 * e.g., in 2026 -> '26-27'; in 2027 -> '27-28'.
 */
export function getFinancialYearCode(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const year = isNaN(d.getFullYear()) ? new Date().getFullYear() : d.getFullYear();
  const month = isNaN(d.getMonth()) ? new Date().getMonth() : d.getMonth(); // 0 = Jan, 3 = Apr
  if (month >= 3) { // April (3) to December (11)
    const start = String(year).slice(-2);
    const end = String(year + 1).slice(-2);
    return `${start}-${end}`;
  } else { // January (0) to March (2)
    const start = String(year - 1).slice(-2);
    const end = String(year).slice(-2);
    return `${start}-${end}`;
  }
}

/**
 * Build the standardized invoice number string: VP/{FY}/{manualBillNumber}
 * e.g., manual '03630' -> 'VP/26-27/03630'
 */
export function buildInvoiceNumber(manualNumber, date = new Date()) {
  const fy = getFinancialYearCode(date);
  if (!manualNumber) {
    return `VP/${fy}/`;
  }
  const clean = String(manualNumber).trim();
  if (clean.startsWith('VP/')) {
    return clean;
  }
  if (clean.startsWith(`${fy}/`)) {
    return `VP/${clean}`;
  }
  return `VP/${fy}/${clean}`;
}

/**
 * Extract only the numerical / custom suffix from a full invoice number.
 * e.g., 'VP/26-27/03630' -> '03630'
 */
export function extractBillNumber(invoiceNo, date = new Date()) {
  if (!invoiceNo) return '';
  const fy = getFinancialYearCode(date);
  const prefix = `VP/${fy}/`;
  if (invoiceNo.startsWith(prefix)) {
    return invoiceNo.slice(prefix.length);
  }
  const parts = invoiceNo.split('/');
  return parts[parts.length - 1] || invoiceNo;
}

/**
 * Indian Rupee Number to Words Converter with exact Rupees & Paise support.
 * Compliant with Indian GST Tax Invoicing standards.
 * e.g., 9000 -> 'NINE THOUSAND RUPEES ONLY'
 * e.g., 1372.88 -> 'ONE THOUSAND THREE HUNDRED SEVENTY TWO RUPEES AND EIGHTY EIGHT PAISA ONLY'
 */
export function numberToWordsINR(amount) {
  if (!amount || isNaN(amount) || amount <= 0) return 'ZERO RUPEES ONLY';
  const a = [
    '', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN',
    'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'
  ];
  const b = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

  const convert = (n) => {
    let str = '';
    if (n >= 10000000) {
      str += convert(Math.floor(n / 10000000)) + ' CRORE ';
      n %= 10000000;
    }
    if (n >= 100000) {
      str += convert(Math.floor(n / 100000)) + ' LAKH ';
      n %= 100000;
    }
    if (n >= 1000) {
      str += convert(Math.floor(n / 1000)) + ' THOUSAND ';
      n %= 1000;
    }
    if (n >= 100) {
      str += convert(Math.floor(n / 100)) + ' HUNDRED ';
      n %= 100;
    }
    if (n > 0) {
      if (n < 20) {
        str += a[n] + ' ';
      } else {
        str += b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '') + ' ';
      }
    }
    return str.trim();
  };

  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let result = convert(rupees).trim() + ' RUPEES';
  if (paise > 0) {
    result += ' AND ' + convert(paise).trim() + ' PAISA';
  }
  return (result.trim() + ' ONLY').replace(/\s+/g, ' ');
}

/**
 * Format date as DD-MM-YYYY (matching Indian GST tax invoice standard)
 */
export function formatInvoiceDate(date) {
  const d = date ? new Date(date) : new Date();
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export const GstInvoiceModal = ({
  order,
  onClose,
  defaultCopy = 'ORIGINAL',
  showCopySelector = false,
  onOrderUpdated = null
}) => {
  const [copyType, setCopyType] = useState(defaultCopy || 'ORIGINAL');
  const [isEditingInvoiceNo, setIsEditingInvoiceNo] = useState(false);
  const [manualBillInput, setManualBillInput] = useState('');
  const [isSavingInvoiceNo, setIsSavingInvoiceNo] = useState(false);

  if (!order) return null;

  const orderDate = order.date ? new Date(order.date) : new Date();
  const currentFy = getFinancialYearCode(orderDate);

  // Determine current active invoice number
  // Format: VP/{FY}/{manualNumber}
  const defaultBillNum = order.billNumber || String(order.id || '').replace(/[^0-9]/g, '').slice(-5).padStart(5, '0') || '03630';
  const rawInvoiceNo = order.invoiceNumber || `VP/${currentFy}/${defaultBillNum}`;
  const displayInvoiceNumber = rawInvoiceNo.startsWith('VP/') ? rawInvoiceNo : `VP/${currentFy}/${rawInvoiceNo}`;

  const formattedDate = formatInvoiceDate(order.dispatchDate || order.date);

  // Financial calculations
  const grandTotal = Number(order.totalAmount || 0);
  const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [
    {
      name: 'IBELL CAR WASHER MICROJET',
      hsn: '84798950',
      quantity: 1,
      price: grandTotal || 9000
    }
  ];

  const itemsSubtotal = items.reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
  const rawDiscount = Number(order.discountAmount || order.discount || (itemsSubtotal > grandTotal ? itemsSubtotal - grandTotal : 0));
  const discountAmount = Math.max(0, rawDiscount);

  // Delivery fee
  const isPickup = order.deliveryType && order.deliveryType.toLowerCase().includes('pickup');
  const rawDeliveryFee = Number(order.deliveryFee !== undefined ? order.deliveryFee : (!isPickup && grandTotal > (itemsSubtotal - discountAmount) ? grandTotal - (itemsSubtotal - discountAmount) : 0));
  const deliveryFee = Math.max(0, rawDeliveryFee);

  // Product net amount (tax inclusive)
  const productNetTotal = Math.max(0, itemsSubtotal - discountAmount);

  // Net taxable calculation (18% GST: 9% CGST + 9% SGST)
  // Base taxable = gross / 1.18
  const discountFactor = itemsSubtotal > 0 ? (itemsSubtotal - discountAmount) / itemsSubtotal : 1;

  // Build itemized invoice lines
  const invoiceLines = items.map((it, idx) => {
    const unitGross = Number(it.price || 0) * discountFactor;
    const itemTotalGross = unitGross * Number(it.quantity || 1);
    const taxableUnit = Math.round((unitGross / 1.18) * 100) / 100;
    const taxableAmount = Math.round((itemTotalGross / 1.18) * 100) / 100;
    const cgst = Math.round((taxableAmount * 0.09) * 100) / 100;
    const sgst = Math.round((taxableAmount * 0.09) * 100) / 100;

    return {
      slNo: idx + 1,
      name: (it.name || 'Power Tool Equipment').toUpperCase(),
      hsn: it.hsnCode || it.hsn || it.specs?.hsnCode || (it.category === 'parts' ? '84679900' : '84672900'),
      quantity: Number(it.quantity || 1),
      rate: taxableUnit,
      taxableAmount,
      cgst,
      sgst,
      totalTax: Math.round((cgst + sgst) * 100) / 100
    };
  });

  // If there is courier delivery charge, include it as statutory freight line item (HSN 996812)
  if (deliveryFee > 0) {
    const deliveryTaxable = Math.round((deliveryFee / 1.18) * 100) / 100;
    const deliveryCgst = Math.round((deliveryTaxable * 0.09) * 100) / 100;
    const deliverySgst = Math.round((deliveryTaxable * 0.09) * 100) / 100;

    invoiceLines.push({
      slNo: invoiceLines.length + 1,
      name: 'COURIER FREIGHT & DOOR DELIVERY CHARGES',
      hsn: '996812',
      quantity: 1,
      rate: deliveryTaxable,
      taxableAmount: deliveryTaxable,
      cgst: deliveryCgst,
      sgst: deliverySgst,
      totalTax: Math.round((deliveryCgst + deliverySgst) * 100) / 100
    });
  }

  // Aggregate totals
  const totalTaxable = invoiceLines.reduce((sum, l) => sum + l.taxableAmount, 0);
  const totalCgst = invoiceLines.reduce((sum, l) => sum + l.cgst, 0);
  const totalSgst = invoiceLines.reduce((sum, l) => sum + l.sgst, 0);
  const totalCalculated = totalTaxable + totalCgst + totalSgst;
  const roundOff = Math.round((grandTotal - totalCalculated) * 100) / 100;
  const finalPayable = grandTotal;
  const totalTaxAmount = Math.round((totalCgst + totalSgst) * 100) / 100;
  const primaryHsn = (invoiceLines.find(l => l.name !== 'COURIER FREIGHT & DOOR DELIVERY CHARGES')?.hsn) || invoiceLines[0]?.hsn || '84672900';

  // Customer / Buyer details
  const customer = order.customer || {};
  const buyerName = (customer.name || 'CUSTOMER').toUpperCase();
  const buyerAddress = customer.address || customer.street || '';
  const buyerLocality = customer.locality || customer.landmark || '';
  const buyerDistrict = customer.district || 'Pathanamthitta';
  const buyerState = customer.state || 'Kerala';
  const buyerPincode = customer.pincode || '689641';
  const buyerPhone = customer.phone || '';
  const buyerGstin = customer.gstin || customer.gst || '';

  // Shipping details
  const shippingName = (customer.shippingName || buyerName).toUpperCase();
  const shippingAddress = customer.shippingAddress || buyerAddress;
  const shippingPhone = customer.shippingPhone || buyerPhone;

  // Logistics & dispatch details
  const dispatchThrough = order.courierPartner || (isPickup ? 'STORE COUNTER PICKUP' : 'KERALA COURIER EXPRESS');
  const destination = order.destination || customer.town || buyerDistrict;
  const termsOfDelivery = order.termsOfDelivery || (isPickup ? 'STORE PICKUP AT POYANIL BUILDING' : 'DOOR DELIVERY');
  const motorVehicleNo = order.motorVehicleNo || '';
  const eWayBillNo = order.eWayBillNo || '';
  const dispatchDocNo = order.dispatchDocNo || displayInvoiceNumber;
  const deliveryNo = order.deliveryNo || '';
  const billOfLanding = order.awb || '';

  // Handle manual invoice number save
  const handleSaveInvoiceNo = async () => {
    if (!manualBillInput.trim()) return;
    setIsSavingInvoiceNo(true);
    try {
      const fullNum = buildInvoiceNumber(manualBillInput.trim(), orderDate);
      await api.updateOrderInvoice(order.id, {
        invoiceNumber: fullNum,
        billNumber: manualBillInput.trim()
      });
      order.invoiceNumber = fullNum;
      order.billNumber = manualBillInput.trim();
      if (onOrderUpdated) onOrderUpdated(order);
      setIsEditingInvoiceNo(false);
    } catch (err) {
      alert(`Failed to save invoice number: ${err.message}`);
    } finally {
      setIsSavingInvoiceNo(false);
    }
  };

  // High-fidelity A4 isolated print handler
  const handlePrint = () => {
    const invoiceEl = document.getElementById('printable-gst-invoice-content');
    if (!invoiceEl) {
      window.print();
      return;
    }

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
          <title>Tax Invoice - ${displayInvoiceNumber}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 14mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            html, body {
              width: 100%;
              background: #ffffff;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
              color: #000000;
              font-size: 8.5pt;
              line-height: 1.25;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .invoice-wrapper {
              width: 182mm;
              border: 1.5px solid #000000 !important;
              box-sizing: border-box !important;
              background: #ffffff;
              margin: 0 auto;
              display: block;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            table {
              width: 100%;
              border-collapse: collapse !important;
              table-layout: fixed;
              page-break-inside: avoid !important;
            }
            tr {
              page-break-inside: avoid !important;
            }
            th, td {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            img {
              width: 100%;
              height: 100%;
              display: block;
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

    const triggerPrint = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2500);
    };

    const bannerImg = iframe.contentWindow.document.querySelector('img');
    if (bannerImg && !bannerImg.complete) {
      bannerImg.onload = () => setTimeout(triggerPrint, 100);
      bannerImg.onerror = () => setTimeout(triggerPrint, 100);
      setTimeout(triggerPrint, 700);
    } else {
      setTimeout(triggerPrint, 300);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999, overflowY: 'auto', padding: '24px 12px' }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '920px',
          width: '100%',
          margin: 'auto',
          background: '#f1f5f9',
          color: '#000000',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)'
        }}
      >
        {/* Top Control Toolbar (Hidden during printing) */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: '12px',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} style={{ color: '#133886' }} />
            <div>
              <strong style={{ fontSize: '0.98rem', color: '#0f172a', display: 'block' }}>
                Variathu Official Tax Invoice
              </strong>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Shop Offline Bill Standard • VP/{currentFy}/[BillNo]
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Quick Bill Number Edit (Store Dashboard) */}
            {showCopySelector && !isEditingInvoiceNo && (
              <button
                type="button"
                onClick={() => {
                  setManualBillInput(extractBillNumber(displayInvoiceNumber, orderDate));
                  setIsEditingInvoiceNo(true);
                }}
                style={{
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#0f172a',
                  fontWeight: '700',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                id="btn-edit-invoice-number"
              >
                <Edit3 size={13} />
                <span>Change Bill No. ({extractBillNumber(displayInvoiceNumber, orderDate)})</span>
              </button>
            )}

            {showCopySelector && isEditingInvoiceNo && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', padding: '3px 6px', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: '800', color: '#133886' }}>VP/{currentFy}/</span>
                <input
                  type="text"
                  value={manualBillInput}
                  onChange={(e) => setManualBillInput(e.target.value)}
                  placeholder="03630"
                  style={{
                    width: '80px',
                    padding: '4px 6px',
                    fontSize: '0.76rem',
                    fontWeight: '800',
                    border: '1px solid #94a3b8',
                    borderRadius: '4px'
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveInvoiceNo}
                  disabled={isSavingInvoiceNo}
                  style={{
                    background: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  <Check size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingInvoiceNo(false)}
                  style={{
                    background: 'transparent',
                    color: '#64748b',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px 4px'
                  }}
                >
                  <X size={13} />
                </button>
              </div>
            )}

            {/* Copy Type Selector */}
            {showCopySelector && (
              <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '6px', padding: '2px', fontSize: '0.72rem' }}>
                {['ORIGINAL', 'DUPLICATE', 'TRIPLICATE'].map(copy => (
                  <button
                    key={copy}
                    type="button"
                    onClick={() => setCopyType(copy)}
                    style={{
                      border: 'none',
                      background: copyType === copy ? '#ffffff' : 'transparent',
                      color: copyType === copy ? '#0f172a' : '#64748b',
                      fontWeight: copyType === copy ? '800' : '500',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      boxShadow: copyType === copy ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                    }}
                  >
                    {copy}
                  </button>
                ))}
              </div>
            )}

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              style={{
                background: '#133886',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '7px 16px',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(19, 56, 134, 0.25)'
              }}
              id="btn-print-gst-invoice"
            >
              <Printer size={15} />
              <span>Print Official Bill (A4)</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '6px 9px',
                cursor: 'pointer',
                color: '#64748b'
              }}
              title="Close"
              id="btn-close-invoice-modal"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* AUTHENTIC A4 PAPER SHEET PREVIEW WITH SAFE BORDER / MARGINS               */}
        {/* ========================================================================= */}
        <div
          className="invoice-paper-sheet"
          style={{
            background: '#ffffff',
            padding: '24px 28px',
            borderRadius: '4px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            maxWidth: '850px',
            margin: '0 auto',
            boxSizing: 'border-box'
          }}
        >
          {/* ========================================================================= */}
          {/* OFFICIAL SHOP TAX INVOICE (RECREATION OF PHYSICAL SHOP BILL)               */}
          {/* ========================================================================= */}
          <div
            id="printable-gst-invoice-content"
            className="unified-gst-invoice-sheet"
            style={{
              border: '1.5px solid #000000',
              background: '#ffffff',
              color: '#000000',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, Arial, sans-serif",
              fontSize: '8.5pt',
              lineHeight: 1.25,
              width: '100%',
              boxSizing: 'border-box',
              display: 'block'
            }}
          >
            {/* 1. HEADER BANNER: Official Banner Image from /image.png */}
            <div
              style={{
                width: '100%',
                height: '24.5mm',
                borderBottom: '1.5px solid #000000',
                lineHeight: 0,
                overflow: 'hidden',
                background: '#133886'
              }}
            >
              <img
                src="/image.png"
                alt="Variathu Powertools"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'fill',
                  display: 'block'
                }}
              />
            </div>

            {/* 2. TITLE BAR: Tax Invoice (Page 1 of 1) | ORIGINAL */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                borderBottom: '1px solid #000000',
                borderLeft: '1.5px solid #000000',
                borderRight: '1.5px solid #000000',
                height: '6.5mm',
                background: '#f8fafc'
              }}
            >
              <tbody>
                <tr style={{ height: '6.5mm' }}>
                  <td style={{ textAlign: 'center', fontWeight: '800', fontSize: '9pt', paddingLeft: '60px' }}>
                    Tax Invoice (Page 1 of 1)
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '800', fontSize: '8.5pt', width: '80px', paddingRight: '12px', borderRight: '1.5px solid #000000' }}>
                    {copyType}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 3. 3-COLUMN TABLE: Seller Details | Buyer Details | Shipping Address */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                tableLayout: 'fixed',
                borderBottom: '1px solid #000000',
                borderLeft: '1.5px solid #000000',
                borderRight: '1.5px solid #000000',
                height: '38mm',
                fontSize: '8pt',
                lineHeight: 1.25
              }}
            >
              <colgroup>
                <col style={{ width: '33.33%' }} />
                <col style={{ width: '33.33%' }} />
                <col style={{ width: '33.34%' }} />
              </colgroup>
              <tbody>
                <tr style={{ height: '38mm', verticalAlign: 'top' }}>
                  {/* Column 1: Seller (Variathu Powertools) */}
                  <td style={{ padding: '3px 7px', borderRight: '1px solid #000000' }}>
                    <div style={{ fontWeight: '900', fontSize: '9.2pt', color: '#000000', marginBottom: '1px' }}>
                      VARIATHU POWERTOOLS
                    </div>
                    <div>POYANIL BUILDING OPP.ST THOMAS</div>
                    <div>HIGHER SECONDRY SCHOOL</div>
                    <div>KOZHENCHERY</div>
                    <div>UDYAM REG.NO:</div>
                    <div style={{ fontWeight: '700' }}>UDYAM-KL-11-0008353</div>
                    <div>Mobile : 9447559574</div>
                    <div style={{ fontWeight: '700' }}>GSTIN : 32BJEPG6328P2ZZ</div>
                    <div>State : 32-Kerala</div>
                    <div>Email : sajanvariathu@gmail.com</div>
                  </td>

                  {/* Column 2: Buyer Details */}
                  <td style={{ padding: '3px 7px', borderRight: '1px solid #000000' }}>
                    <div style={{ fontWeight: '800', textDecoration: 'underline', marginBottom: '1px' }}>Buyer</div>
                    <div style={{ fontWeight: '900', fontSize: '9pt', color: '#000000' }}>{buyerName}</div>
                    <div>{buyerAddress || 'Kozhencherry, Pathanamthitta'}</div>
                    {buyerLocality && <div>{buyerLocality}</div>}
                    <div>{buyerDistrict}, {buyerState}, {buyerPincode}</div>
                    <div style={{ marginTop: '1px' }}>Mobile : {buyerPhone || '-'}</div>
                    <div style={{ fontWeight: '700' }}>GSTIN : {buyerGstin || 'Unregistered'}</div>
                    <div>State : 32-Kerala</div>
                  </td>

                  {/* Column 3: Shipping Address */}
                  <td style={{ padding: '3px 7px', borderRight: '1.5px solid #000000' }}>
                    <div style={{ fontWeight: '800', marginBottom: '1px' }}>Shipping Address:</div>
                    <div style={{ fontWeight: '900', fontSize: '9pt', color: '#000000' }}>{shippingName}</div>
                    <div>{shippingAddress || buyerAddress || 'Kozhencherry, Pathanamthitta'}</div>
                    <div style={{ marginTop: '1px' }}>Mobile : {shippingPhone || buyerPhone || '-'}</div>
                    <div style={{ fontWeight: '700' }}>GSTIN : {buyerGstin || 'Unregistered'}</div>
                    <div>State Name : {buyerState}</div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 4. 4-COLUMN TRANSPORT & DOCUMENT TABLE (3 equal rows of 8.5mm) */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                tableLayout: 'fixed',
                borderBottom: '1px solid #000000',
                borderLeft: '1.5px solid #000000',
                borderRight: '1.5px solid #000000',
                height: '25.5mm',
                fontSize: '7.6pt'
              }}
            >
              <colgroup>
                <col style={{ width: '25%' }} />
                <col style={{ width: '25%' }} />
                <col style={{ width: '25%' }} />
                <col style={{ width: '25%' }} />
              </colgroup>
              <tbody>
                {/* Row 1 */}
                <tr style={{ height: '8.5mm' }}>
                  <td style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '2px 5px' }}>
                    <span style={{ color: '#475569', display: 'block', fontSize: '6.8pt' }}>Invoice No.</span>
                    <strong style={{ fontSize: '8.8pt', color: '#000000', display: 'block', lineHeight: 1.1 }}>{displayInvoiceNumber}</strong>
                  </td>
                  <td style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '2px 5px' }}>
                    <span style={{ color: '#475569', display: 'block', fontSize: '6.8pt' }}>Delivery No.</span>
                    <span style={{ fontSize: '7.6pt', display: 'block' }}>{deliveryNo || ''}</span>
                  </td>
                  <td style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '2px 5px' }}>
                    <span style={{ color: '#475569', display: 'block', fontSize: '6.8pt' }}>Dispatch through</span>
                    <strong style={{ fontSize: '8pt', display: 'block', lineHeight: 1.1 }}>{dispatchThrough}</strong>
                  </td>
                  <td style={{ borderBottom: '1px solid #000000', borderRight: '1.5px solid #000000', padding: '2px 5px' }}>
                    <span style={{ color: '#475569', display: 'block', fontSize: '6.8pt' }}>Destination</span>
                    <strong style={{ fontSize: '8pt', display: 'block', lineHeight: 1.1 }}>{destination}</strong>
                  </td>
                </tr>

                {/* Row 2 */}
                <tr style={{ height: '8.5mm' }}>
                  <td style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '2px 5px' }}>
                    <span style={{ color: '#475569', display: 'block', fontSize: '6.8pt' }}>Dated</span>
                    <strong style={{ fontSize: '8.4pt', color: '#000000', display: 'block', lineHeight: 1.1 }}>{formattedDate}</strong>
                  </td>
                  <td style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '2px 5px' }}>
                    <span style={{ color: '#475569', display: 'block', fontSize: '6.8pt' }}>Dispatch Document No.</span>
                    <strong style={{ fontSize: '8.2pt', display: 'block', lineHeight: 1.1 }}>{dispatchDocNo}</strong>
                  </td>
                  <td style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '2px 5px' }}>
                    <span style={{ color: '#475569', display: 'block', fontSize: '6.8pt' }}>Motor Vehicle No.</span>
                    <span style={{ fontSize: '7.6pt', display: 'block' }}>{motorVehicleNo || ''}</span>
                  </td>
                  <td style={{ borderBottom: '1px solid #000000', borderRight: '1.5px solid #000000', padding: '2px 5px' }}>
                    &nbsp;
                  </td>
                </tr>

                {/* Row 3 */}
                <tr style={{ height: '8.5mm' }}>
                  <td style={{ borderRight: '1px solid #000000', padding: '2px 5px' }}>
                    <span style={{ color: '#475569', display: 'block', fontSize: '6.8pt' }}>e-Way bill No.</span>
                    <span style={{ fontSize: '7.6pt', display: 'block' }}>{eWayBillNo || ''}</span>
                  </td>
                  <td style={{ borderRight: '1px solid #000000', padding: '2px 5px' }}>
                    <span style={{ color: '#475569', display: 'block', fontSize: '6.8pt' }}>Bill of Lading/LR-RR No.</span>
                    <strong style={{ fontSize: '7.6pt', display: 'block' }}>{billOfLanding || ''}</strong>
                  </td>
                  <td style={{ borderRight: '1px solid #000000', padding: '2px 5px' }}>
                    <span style={{ color: '#475569', display: 'block', fontSize: '6.8pt' }}>Terms of Delivery</span>
                    <span style={{ fontSize: '7.6pt', display: 'block', lineHeight: 1.1 }}>{termsOfDelivery}</span>
                  </td>
                  <td style={{ borderRight: '1.5px solid #000000', padding: '2px 5px' }}>
                    &nbsp;
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 5. ITEMS TABLE: Sl.No | Item Description | HSN | Rate | Qty | Amount (84mm) */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                tableLayout: 'fixed',
                fontSize: '8.4pt',
                height: '84mm',
                borderLeft: '1.5px solid #000000',
                borderRight: '1.5px solid #000000'
              }}
            >
              <colgroup>
                <col style={{ width: '6%' }} />
                <col style={{ width: '44%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '14%' }} />
              </colgroup>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #000000', height: '6.5mm' }}>
                  <th style={{ borderRight: '1px solid #000000', padding: '2px 4px', textAlign: 'center', fontWeight: '800' }}>Sl.No.</th>
                  <th style={{ borderRight: '1px solid #000000', padding: '2px 8px', textAlign: 'left', fontWeight: '800' }}>Item Description</th>
                  <th style={{ borderRight: '1px solid #000000', padding: '2px 4px', textAlign: 'center', fontWeight: '800' }}>HSN/SAC</th>
                  <th style={{ borderRight: '1px solid #000000', padding: '2px 6px', textAlign: 'right', fontWeight: '800' }}>Rate(₹)</th>
                  <th style={{ borderRight: '1px solid #000000', padding: '2px 4px', textAlign: 'center', fontWeight: '800' }}>Quantity</th>
                  <th style={{ padding: '2px 8px', textAlign: 'right', fontWeight: '800', borderRight: '1.5px solid #000000' }}>Amount(₹)</th>
                </tr>
              </thead>
              <tbody>
                {invoiceLines.map((line) => (
                  <tr key={line.slNo} style={{ height: '6.5mm' }}>
                    <td style={{ borderRight: '1px solid #000000', padding: '2px 4px', textAlign: 'center' }}>{line.slNo}</td>
                    <td style={{ borderRight: '1px solid #000000', padding: '2px 8px', fontWeight: '700' }}>{line.name}</td>
                    <td style={{ borderRight: '1px solid #000000', padding: '2px 4px', textAlign: 'center' }}>{line.hsn}</td>
                    <td style={{ borderRight: '1px solid #000000', padding: '2px 6px', textAlign: 'right' }}>{line.rate.toFixed(2)}</td>
                    <td style={{ borderRight: '1px solid #000000', padding: '2px 4px', textAlign: 'center' }}>{line.quantity.toFixed(2)} NOS</td>
                    <td style={{ padding: '2px 8px', textAlign: 'right', fontWeight: '700', borderRight: '1.5px solid #000000' }}>{line.taxableAmount.toFixed(2)}</td>
                  </tr>
                ))}

                {/* Fixed space filler row with all vertical column lines continuous and intact */}
                <tr style={{ height: `${Math.max(15, 55.5 - (invoiceLines.length * 6.5))}mm` }}>
                  <td style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000' }}>&nbsp;</td>
                  <td style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000' }}>&nbsp;</td>
                  <td style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000' }}>&nbsp;</td>
                  <td style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000' }}>&nbsp;</td>
                  <td style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000' }}>&nbsp;</td>
                  <td style={{ borderBottom: '1px solid #000000', borderRight: '1.5px solid #000000' }}>&nbsp;</td>
                </tr>

                {/* Subtotal & GST Line Items */}
                <tr style={{ height: '5.5mm' }}>
                  <td style={{ borderTop: '1px solid #000000', borderRight: '1px solid #000000' }}>&nbsp;</td>
                  <td style={{ borderTop: '1px solid #000000', borderRight: '1px solid #000000' }}>&nbsp;</td>
                  <td style={{ borderTop: '1px solid #000000', borderRight: '1px solid #000000' }}>&nbsp;</td>
                  <td style={{ borderTop: '1px solid #000000', borderRight: '1px solid #000000' }}>&nbsp;</td>
                  <td style={{ borderTop: '1px solid #000000', borderRight: '1px solid #000000', padding: '1px 5px', textAlign: 'right', fontWeight: '700' }}>&nbsp;</td>
                  <td style={{ borderTop: '1px solid #000000', padding: '1px 8px', textAlign: 'right', fontWeight: '700', borderRight: '1.5px solid #000000' }}>{totalTaxable.toFixed(2)}</td>
                </tr>
                <tr style={{ height: '5.5mm' }}>
                  <td style={{ borderRight: '1px solid #000000' }}>&nbsp;</td>
                  <td style={{ borderRight: '1px solid #000000' }}>&nbsp;</td>
                  <td style={{ borderRight: '1px solid #000000' }}>&nbsp;</td>
                  <td style={{ borderRight: '1px solid #000000' }}>&nbsp;</td>
                  <td style={{ borderRight: '1px solid #000000', padding: '1px 5px', textAlign: 'right', fontWeight: '700' }}>CGST</td>
                  <td style={{ padding: '1px 8px', textAlign: 'right', fontWeight: '700', borderRight: '1.5px solid #000000' }}>{totalCgst.toFixed(2)}</td>
                </tr>
                <tr style={{ height: '5.5mm' }}>
                  <td style={{ borderRight: '1px solid #000000' }}>&nbsp;</td>
                  <td style={{ borderRight: '1px solid #000000' }}>&nbsp;</td>
                  <td style={{ borderRight: '1px solid #000000' }}>&nbsp;</td>
                  <td style={{ borderRight: '1px solid #000000' }}>&nbsp;</td>
                  <td style={{ borderRight: '1px solid #000000', padding: '1px 5px', textAlign: 'right', fontWeight: '700' }}>SGST</td>
                  <td style={{ padding: '1px 8px', textAlign: 'right', fontWeight: '700', borderRight: '1.5px solid #000000' }}>{totalSgst.toFixed(2)}</td>
                </tr>
                <tr style={{ height: '5.5mm' }}>
                  <td style={{ borderRight: '1px solid #000000' }}>&nbsp;</td>
                  <td style={{ borderRight: '1px solid #000000' }}>&nbsp;</td>
                  <td style={{ borderRight: '1px solid #000000' }}>&nbsp;</td>
                  <td style={{ borderRight: '1px solid #000000' }}>&nbsp;</td>
                  <td style={{ borderRight: '1px solid #000000', padding: '1px 5px', textAlign: 'right', fontWeight: '700' }}>Round Off</td>
                  <td style={{ padding: '1px 8px', textAlign: 'right', fontWeight: '700', borderRight: '1.5px solid #000000' }}>{roundOff.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            {/* 6. GRAND TOTAL ROW (8mm) */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                borderTop: '1.5px solid #000000',
                borderBottom: '1px solid #000000',
                borderLeft: '1.5px solid #000000',
                borderRight: '1.5px solid #000000',
                height: '8mm',
                background: '#f8fafc'
              }}
            >
              <tbody>
                <tr style={{ height: '8mm' }}>
                  <td style={{ padding: '0 8px', fontSize: '8.4pt' }}>
                    <span>Amount (in words) : </span>
                    <strong style={{ fontSize: '8.6pt' }}>{numberToWordsINR(finalPayable)}</strong>
                  </td>
                  <td style={{ textAlign: 'right', padding: '0 8px', width: '230px', whiteSpace: 'nowrap', borderRight: '1.5px solid #000000' }}>
                    <strong style={{ fontSize: '10.5pt' }}>TOTAL AMOUNT : ₹ {finalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                    <span style={{ fontSize: '7pt', color: '#475569', marginLeft: '6px' }}>E & O.E</span>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 7. GST TAX ANALYSIS BREAKDOWN TABLE (18mm) */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                tableLayout: 'fixed',
                fontSize: '7.8pt',
                height: '18mm',
                borderLeft: '1.5px solid #000000',
                borderRight: '1.5px solid #000000'
              }}
            >
              <colgroup>
                <col style={{ width: '15%' }} />
                <col style={{ width: '19%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '18%' }} />
              </colgroup>
              <thead>
                <tr style={{ borderBottom: '1px solid #000000', background: '#f8fafc', height: '4.5mm' }}>
                  <th rowSpan={2} style={{ borderRight: '1px solid #000000', padding: '1px 3px', textAlign: 'center', fontWeight: '800' }}>HSN/SAC</th>
                  <th rowSpan={2} style={{ borderRight: '1px solid #000000', padding: '1px 5px', textAlign: 'right', fontWeight: '800' }}>Taxable Value</th>
                  <th colSpan={2} style={{ borderRight: '1px solid #000000', padding: '1px 3px', textAlign: 'center', fontWeight: '800' }}>Central Tax</th>
                  <th colSpan={2} style={{ borderRight: '1px solid #000000', padding: '1px 3px', textAlign: 'center', fontWeight: '800' }}>State Tax</th>
                  <th rowSpan={2} style={{ padding: '1px 5px', textAlign: 'right', fontWeight: '800', borderRight: '1.5px solid #000000' }}>Total Tax Amount</th>
                </tr>
                <tr style={{ borderBottom: '1px solid #000000', background: '#f8fafc', height: '4mm' }}>
                  <th style={{ borderRight: '1px solid #000000', padding: '1px 3px', textAlign: 'center', fontWeight: '700' }}>Rate %</th>
                  <th style={{ borderRight: '1px solid #000000', padding: '1px 5px', textAlign: 'right', fontWeight: '700' }}>Amount</th>
                  <th style={{ borderRight: '1px solid #000000', padding: '1px 3px', textAlign: 'center', fontWeight: '700' }}>Rate %</th>
                  <th style={{ borderRight: '1px solid #000000', padding: '1px 5px', textAlign: 'right', fontWeight: '700' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {/* Product Tools HSN Row */}
                <tr style={{ borderBottom: '1px solid #000000', height: '4.8mm' }}>
                  <td style={{ borderRight: '1px solid #000000', padding: '1px 3px', textAlign: 'center' }}>{primaryHsn}</td>
                  <td style={{ borderRight: '1px solid #000000', padding: '1px 5px', textAlign: 'right' }}>{totalTaxable.toFixed(2)}</td>
                  <td style={{ borderRight: '1px solid #000000', padding: '1px 3px', textAlign: 'center' }}>9.00</td>
                  <td style={{ borderRight: '1px solid #000000', padding: '1px 5px', textAlign: 'right' }}>{totalCgst.toFixed(2)}</td>
                  <td style={{ borderRight: '1px solid #000000', padding: '1px 3px', textAlign: 'center' }}>9.00</td>
                  <td style={{ borderRight: '1px solid #000000', padding: '1px 5px', textAlign: 'right' }}>{totalSgst.toFixed(2)}</td>
                  <td style={{ padding: '1px 5px', textAlign: 'right', fontWeight: '700', borderRight: '1.5px solid #000000' }}>{totalTaxAmount.toFixed(2)}</td>
                </tr>

                {/* Total Row */}
                <tr style={{ borderBottom: '1px solid #000000', height: '4.8mm', fontWeight: '800', background: '#f8fafc' }}>
                  <td style={{ borderRight: '1px solid #000000', padding: '1px 3px', textAlign: 'center' }}>Total</td>
                  <td style={{ borderRight: '1px solid #000000', padding: '1px 5px', textAlign: 'right' }}>{totalTaxable.toFixed(2)}</td>
                  <td style={{ borderRight: '1px solid #000000', padding: '1px 3px', textAlign: 'center' }}>&nbsp;</td>
                  <td style={{ borderRight: '1px solid #000000', padding: '1px 5px', textAlign: 'right' }}>{totalCgst.toFixed(2)}</td>
                  <td style={{ borderRight: '1px solid #000000', padding: '1px 3px', textAlign: 'center' }}>&nbsp;</td>
                  <td style={{ borderRight: '1px solid #000000', padding: '1px 5px', textAlign: 'right' }}>{totalSgst.toFixed(2)}</td>
                  <td style={{ padding: '1px 5px', textAlign: 'right', borderRight: '1.5px solid #000000' }}>{totalTaxAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            {/* 8. Tax Amount in Words Bar (4.5mm) */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                borderBottom: '1px solid #000000',
                borderLeft: '1.5px solid #000000',
                borderRight: '1.5px solid #000000',
                height: '4.5mm',
                fontSize: '8pt'
              }}
            >
              <tbody>
                <tr style={{ height: '4.5mm' }}>
                  <td style={{ padding: '0 8px' }}>
                    <span>Tax Amount (in words) : </span>
                    <strong style={{ letterSpacing: '0.2px' }}>{numberToWordsINR(totalTaxAmount)}</strong>
                  </td>
                  <td style={{ textAlign: 'right', padding: '0 8px', width: '60px', fontSize: '7pt', color: '#475569', borderRight: '1.5px solid #000000' }}>
                    E & O.E
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 9. BOTTOM SECTION: Bank Details, Declaration & Signatory (39mm) */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                tableLayout: 'fixed',
                height: '39mm',
                borderLeft: '1.5px solid #000000',
                borderRight: '1.5px solid #000000',
                borderBottom: '1.5px solid #000000',
                fontSize: '8pt'
              }}
            >
              <colgroup>
                <col style={{ width: '58%' }} />
                <col style={{ width: '42%' }} />
              </colgroup>
              <tbody>
                <tr style={{ height: '39mm', verticalAlign: 'top' }}>
                  {/* Left: Bank Details & Declaration */}
                  <td style={{ padding: '3px 8px', borderRight: '1px solid #000000', borderBottom: '1.5px solid #000000', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                      <div>
                        <div style={{ fontWeight: '800', textDecoration: 'underline', marginBottom: '2px', fontSize: '8.4pt' }}>
                          Company's Bank Details
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7.8pt', lineHeight: 1.25 }}>
                          <tbody>
                            <tr>
                              <td style={{ width: '105px', color: '#334155' }}>Account Number</td>
                              <td><strong>: 12605600001251</strong></td>
                            </tr>
                            <tr>
                              <td style={{ color: '#334155' }}>Bank Name</td>
                              <td><strong>: FEDARAL BANK</strong></td>
                            </tr>
                            <tr>
                              <td style={{ color: '#334155' }}>Branch Name</td>
                              <td><strong>: KOTTATHOOR</strong></td>
                            </tr>
                            <tr>
                              <td style={{ color: '#334155' }}>IFSC Code</td>
                              <td><strong>: FDRL0001260</strong></td>
                            </tr>
                            <tr>
                              <td style={{ color: '#334155' }}>Account Name</td>
                              <td><strong>: VARIATH POWERTOOLS</strong></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div style={{ marginTop: '2px' }}>
                        <div style={{ fontWeight: '800', textDecoration: 'underline', marginBottom: '1px', fontSize: '8pt' }}>Declaration</div>
                        <div style={{ fontSize: '7.2pt', color: '#1e293b', lineHeight: 1.2 }}>
                          We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Right: Authorised Signatory */}
                  <td style={{ padding: '4px 10px', textAlign: 'right', borderRight: '1.5px solid #000000', borderBottom: '1.5px solid #000000', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                      <div style={{ fontWeight: '900', fontSize: '9pt', color: '#000000' }}>
                        For, VARIATHU POWERTOOLS
                      </div>

                      {/* Space for stamp/signature */}
                      <div style={{ height: '14mm' }}></div>

                      <div style={{ fontWeight: '800', fontSize: '8.8pt', color: '#000000' }}>
                        Authorised Signatory
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GstInvoiceModal;
