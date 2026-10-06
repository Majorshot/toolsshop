import React from 'react';
import { Printer, X, Wrench, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const JobCardPrintModal = ({ job, onClose }) => {
  if (!job) return null;

  const rawDate = job.createdAt || job.loggedAt || job.updatedAt || Date.now();
  const inwardDate = new Date(rawDate);
  const formattedDate = !isNaN(inwardDate.getTime())
    ? inwardDate.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : new Date().toLocaleDateString('en-IN');
  const formattedTime = !isNaN(inwardDate.getTime())
    ? inwardDate.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    : '';

  const estCost = Number(job.finalCost || job.estimatedCost || 0);
  const advPaid = Number(job.advancePaid || 0);
  const balDue = Math.max(0, estCost - advPaid);
  const isHandedOver = Boolean(job.handoverVerified) || job.status === 'Handed Over';
  const isReady = !isHandedOver && (job.status === 'Repaired & Ready' || job.status === 'Ready for Pickup');

  const displayJobNo = job.jobCardNumber || job.jobId;

  // High-fidelity isolated print handler
  const handlePrint = () => {
    const printEl = document.getElementById('printable-job-card-content');
    if (!printEl) {
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
          <title>Job Card - ${displayJobNo} - ${job.customerName || 'Customer'}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            @page {
              size: A4 portrait;
              margin: 7mm 8mm;
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
              line-height: 1.3;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .jobcard-wrapper {
              width: 100%;
              max-width: 100%;
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
              break-inside: avoid !important;
            }
            tr {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
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
          <div class="jobcard-wrapper">
            ${printEl.innerHTML}
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
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        zIndex: 9999,
        overflowY: 'auto',
        padding: '24px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15, 23, 42, 0.75)'
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '880px',
          width: '100%',
          margin: '0 auto',
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Top Control Bar */}
        <div
          className="no-print"
          style={{
            padding: '12px 20px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wrench size={20} style={{ color: '#133886' }} />
            <div>
              <strong style={{ fontSize: '0.98rem', color: '#0f172a', display: 'block' }}>
                Workshop Job Card Receipt
              </strong>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Ticket: {job.jobId} {job.jobCardNumber ? `• Slip #${job.jobCardNumber}` : ''}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                boxShadow: '0 2px 6px rgba(19, 56, 134, 0.25)'
              }}
              id="btn-print-jobcard-submit"
            >
              <Printer size={15} />
              <span>Print Job Card</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.8rem',
                fontWeight: '600',
                color: '#475569',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <X size={15} />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Printable Job Card Preview Shell */}
        <div style={{ padding: '20px', background: '#e2e8f0', overflowX: 'auto' }}>
          <div
            id="printable-job-card-content"
            style={{
              width: '100%',
              minWidth: '700px',
              maxWidth: '800px',
              margin: '0 auto',
              background: '#ffffff',
              border: '1.5px solid #000000',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, Arial, sans-serif",
              color: '#000000',
              fontSize: '8.4pt',
              lineHeight: 1.25,
              boxSizing: 'border-box'
            }}
          >
            {/* 1. OFFICIAL GST BANNER LOGO FROM /image.png */}
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

            {/* 2. TITLE BAR */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                borderBottom: '1px solid #000000',
                background: '#f8fafc',
                height: '6.5mm'
              }}
            >
              <tbody>
                <tr style={{ height: '6.5mm' }}>
                  <td style={{ textAlign: 'center', fontWeight: '900', fontSize: '9.2pt', paddingLeft: '40px', letterSpacing: '0.03em' }}>
                    WORKSHOP SERVICE JOB CARD • CUSTOMER ACKNOWLEDGEMENT
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '800', fontSize: '8.5pt', width: '130px', paddingRight: '12px' }}>
                    ORIGINAL COPY
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 3. 2-COLUMN TABLE: WORKSHOP CLINIC (LEFT) | CUSTOMER & TICKET DETAILS (RIGHT) */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                borderBottom: '1px solid #000000',
                fontSize: '8pt',
                lineHeight: 1.25
              }}
            >
              <colgroup>
                <col style={{ width: '52%' }} />
                <col style={{ width: '48%' }} />
              </colgroup>
              <tbody>
                <tr style={{ verticalAlign: 'top' }}>
                  {/* Left: Workshop Details */}
                  <td style={{ padding: '6px 10px', borderRight: '1px solid #000000' }}>
                    <div style={{ fontWeight: '900', fontSize: '9pt', color: '#000000', marginBottom: '2px' }}>
                      VARIATHU POWERTOOLS — SERVICE CLINIC
                    </div>
                    <div>POYANIL BUILDING OPP. ST THOMAS HIGHER SECONDRY SCHOOL</div>
                    <div>KOZHENCHERY, PATHANAMTHITTA, KERALA - 689641</div>
                    <div style={{ marginTop: '2px' }}>
                      Mobile: <strong>9447559574</strong> • Email: sajanvariathu@gmail.com
                    </div>
                    <div>
                      GSTIN: <strong>32BJEPG6328P2ZZ</strong> • UDYAM: <strong>UDYAM-KL-11-0008353</strong>
                    </div>
                  </td>

                  {/* Right: Customer & Job Card Meta */}
                  <td style={{ padding: '6px 10px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt', lineHeight: 1.25 }}>
                      <tbody>
                        <tr>
                          <td style={{ width: '115px', color: '#475569' }}>Job Card Slip No.</td>
                          <td><strong style={{ fontSize: '9pt', color: '#000000' }}>: {displayJobNo}</strong></td>
                        </tr>
                        <tr>
                          <td style={{ color: '#475569' }}>Ticket ID</td>
                          <td><strong style={{ fontFamily: 'monospace' }}>: {job.jobId}</strong></td>
                        </tr>
                        <tr>
                          <td style={{ color: '#475569' }}>Inward Date / Time</td>
                          <td>: <strong>{formattedDate}</strong> {formattedTime && `at ${formattedTime}`}</td>
                        </tr>
                        <tr>
                          <td style={{ color: '#475569' }}>Customer Name</td>
                          <td>:<strong style={{ fontSize: '8.8pt', textTransform: 'uppercase' }}> {job.customerName}</strong></td>
                        </tr>
                        <tr>
                          <td style={{ color: '#475569' }}>Mobile Number</td>
                          <td>: <strong>{job.customerPhone}</strong></td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 4. MACHINERY & EQUIPMENT PARTICULARS TABLE */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                borderBottom: '1px solid #000000',
                fontSize: '8.2pt'
              }}
            >
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #000000', height: '6mm' }}>
                  <th style={{ borderRight: '1px solid #000000', padding: '2px 6px', textAlign: 'left', fontWeight: '800', width: '22%' }}>Tool Brand</th>
                  <th style={{ borderRight: '1px solid #000000', padding: '2px 6px', textAlign: 'left', fontWeight: '800', width: '30%' }}>Machine / Model Name</th>
                  <th style={{ borderRight: '1px solid #000000', padding: '2px 6px', textAlign: 'left', fontWeight: '800', width: '24%' }}>Serial Number (S/N)</th>
                  <th style={{ padding: '2px 6px', textAlign: 'left', fontWeight: '800', width: '24%' }}>Floor Technician</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ height: '7.5mm' }}>
                  <td style={{ borderRight: '1px solid #000000', padding: '3px 6px', fontWeight: '700' }}>
                    {job.toolBrand ? job.toolBrand.toUpperCase() : 'POWER TOOL'}
                  </td>
                  <td style={{ borderRight: '1px solid #000000', padding: '3px 6px', fontWeight: '800', fontSize: '8.6pt' }}>
                    {job.toolModel ? job.toolModel.toUpperCase() : 'EQUIPMENT'}
                  </td>
                  <td style={{ borderRight: '1px solid #000000', padding: '3px 6px', fontFamily: 'monospace', fontWeight: '600' }}>
                    {job.serialNumber || 'N/A'}
                  </td>
                  <td style={{ padding: '3px 6px', fontWeight: '700', color: '#1e40af' }}>
                    {job.assignedTechnician || 'Senior Specialist'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 5. PROBLEM DESCRIPTION & DIAGNOSIS DETAILS */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                borderBottom: '1px solid #000000',
                fontSize: '8pt',
                lineHeight: 1.25
              }}
            >
              <tbody>
                <tr>
                  <td style={{ width: '26%', padding: '5px 8px', borderRight: '1px solid #000000', borderBottom: '1px solid #000000', background: '#f8fafc', fontWeight: '800' }}>
                    Reported Problem / Issue:
                  </td>
                  <td style={{ padding: '5px 8px', borderBottom: '1px solid #000000', fontWeight: '600', color: '#b91c1c' }}>
                    {job.issueDescription || 'No description provided'}
                  </td>
                </tr>
                <tr>
                  <td style={{ width: '26%', padding: '5px 8px', borderRight: '1px solid #000000', borderBottom: '1px solid #000000', background: '#f8fafc', fontWeight: '800' }}>
                    Technician Work / Diagnosis:
                  </td>
                  <td style={{ padding: '5px 8px', borderBottom: '1px solid #000000', color: '#0369a1', fontWeight: '600' }}>
                    {job.technicianNotes || 'Initial diagnostics, teardown inspection, field coil & armature testing.'}
                  </td>
                </tr>
                <tr>
                  <td style={{ width: '26%', padding: '5px 8px', borderRight: '1px solid #000000', background: '#f8fafc', fontWeight: '800' }}>
                    Current Workshop Stage:
                  </td>
                  <td style={{ padding: '5px 8px', fontWeight: '800' }}>
                    {isHandedOver ? (
                      <span style={{ color: '#15803d' }}>✅ Machine Delivered &amp; Handed Over to Customer</span>
                    ) : isReady ? (
                      <span style={{ color: '#16a34a' }}>⏳ Repaired &amp; Ready for Counter Collection</span>
                    ) : (
                      <span style={{ color: '#ea580c' }}>🔧 Under Active Service / In Progress</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 6. ESTIMATE & ADVANCE AMOUNT PAYMENT PARTICULARS */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                borderBottom: '1px solid #000000',
                background: '#f8fafc'
              }}
            >
              <colgroup>
                <col style={{ width: '33.33%' }} />
                <col style={{ width: '33.33%' }} />
                <col style={{ width: '33.34%' }} />
              </colgroup>
              <tbody>
                <tr style={{ height: '11mm', textAlign: 'center' }}>
                  <td style={{ padding: '4px 8px', borderRight: '1px solid #000000' }}>
                    <span style={{ fontSize: '7.2pt', color: '#475569', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>
                      {isHandedOver ? 'Final Bill Amount' : 'Estimated Cost'}
                    </span>
                    <strong style={{ fontSize: '11pt', color: '#0f172a' }}>
                      ₹ {estCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                  </td>
                  <td style={{ padding: '4px 8px', borderRight: '1px solid #000000' }}>
                    <span style={{ fontSize: '7.2pt', color: '#475569', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>
                      Advance Amount Paid
                    </span>
                    <strong style={{ fontSize: '11pt', color: '#16a34a' }}>
                      ₹ {advPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <span style={{ fontSize: '7.2pt', color: '#475569', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>
                      Balance Payable at Delivery
                    </span>
                    <strong style={{ fontSize: '11pt', color: balDue > 0 ? '#ea580c' : '#059669' }}>
                      ₹ {balDue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 7. STATUTORY WORKSHOP SERVICE TERMS & WARRANTY */}
            <div style={{ padding: '6px 10px', borderBottom: '1px solid #000000', fontSize: '6.8pt', lineHeight: 1.25, color: '#334155' }}>
              <div style={{ fontWeight: '800', textDecoration: 'underline', marginBottom: '2px', fontSize: '7.2pt', color: '#0f172a' }}>
                Workshop Service Terms &amp; Conditions:
              </div>
              <ol style={{ paddingLeft: '14px', margin: 0 }}>
                <li>Estimated charges and repair delivery dates are tentative and subject to internal mechanical teardown, electrical coils inspection, and spare parts availability.</li>
                <li>Genuine replacement parts installed are covered under 30 days workshop warranty against manufacturing defects from the date of handover.</li>
                <li>Replaced defective parts must be collected at the time of delivery; unclaimed damaged parts will be responsibly disposed of after 7 days.</li>
                <li>Equipment not collected within 30 days of completion notification via WhatsApp/SMS may attract storage demurrage charges of ₹20/day.</li>
                <li>Please present this original Job Card slip or registered mobile number during counter pickup at Poyanil Building, Kozhencherry.</li>
              </ol>
            </div>

            {/* 8. SIGNATURE & ACKNOWLEDGEMENT BLOCK */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '7.6pt',
                height: '32mm'
              }}
            >
              <colgroup>
                <col style={{ width: '50%' }} />
                <col style={{ width: '50%' }} />
              </colgroup>
              <tbody>
                <tr style={{ verticalAlign: 'top', height: '32mm' }}>
                  {/* Left: Customer Signature */}
                  <td style={{ padding: '6px 10px', borderRight: '1px solid #000000', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                      <div>
                        <div style={{ fontWeight: '800', textDecoration: 'underline', marginBottom: '2px', fontSize: '7.8pt' }}>
                          Customer Acknowledgement
                        </div>
                        <div style={{ fontSize: '6.8pt', color: '#475569', lineHeight: 1.2 }}>
                          I confirm the reported machine complaints and acknowledge receipt of this service job card slip.
                        </div>
                      </div>

                      {/* Signature line */}
                      <div>
                        <div style={{ borderBottom: '1px dotted #94a3b8', width: '160px', marginBottom: '3px' }}></div>
                        <div style={{ fontWeight: '700', fontSize: '7.4pt', color: '#0f172a' }}>
                          Customer's Signature
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Right: Authorised Workshop Signatory */}
                  <td style={{ padding: '6px 10px', textAlign: 'right', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                      <div>
                        <div style={{ fontWeight: '900', fontSize: '8.6pt', color: '#000000' }}>
                          For, VARIATHU POWERTOOLS
                        </div>
                        <div style={{ fontSize: '6.8pt', color: '#64748b' }}>
                          Authorised Workshop Service Clinic
                        </div>
                      </div>

                      {/* Space for stamp/signature */}
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '8pt', color: '#000000' }}>
                          Authorised Signatory / Technician Seal
                        </div>
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

export default JobCardPrintModal;
