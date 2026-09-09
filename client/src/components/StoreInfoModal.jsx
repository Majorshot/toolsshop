import React, { useState } from 'react';
import { X, MapPin, Phone, MessageCircle, Clock, Wrench, ShieldCheck, Navigation, CheckCircle2 } from 'lucide-react';

export const StoreInfoModal = ({ onClose, storeInfo }) => {
  const [serviceRequested, setServiceRequested] = useState(false);
  const [toolModel, setToolModel] = useState('');
  const [issueText, setIssueText] = useState('');

  const handleSubmitService = (e) => {
    e.preventDefault();
    const text = encodeURIComponent(
      `Hello Variathu Power Tools Service Center Kozhencherry,\nI would like to request repair/service for:\nTool Model: ${toolModel}\nIssue: ${issueText}\nPlease let me know when I can bring it to Poyanil Building.`
    );
    window.open(`https://wa.me/919447123456?text=${text}`, '_blank');
    setServiceRequested(true);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(234, 88, 12, 0.1)',
                color: '#ea580c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <MapPin size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#0f172a' }}>Variathu Power Tools</h3>
              <p style={{ fontSize: '0.74rem', color: '#64748b' }}>Poyanil Junction, Kozhencherry, Kerala</p>
            </div>
          </div>
          <button className="btn-close-modal" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {/* Shop Card */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '20px',
              marginBottom: '20px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#ecfdf5',
                  color: '#16a34a',
                  border: '1px solid #bbf7d0',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.76rem',
                  fontWeight: '700'
                }}
              >
                ● Open for Sales & Repairs
              </span>
              <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Pincode: 689641</span>
            </div>

            <h4 style={{ color: '#0f172a', fontSize: '1.15rem', fontWeight: '800', marginBottom: '6px' }}>
              Variathu Power Tools
            </h4>

            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '14px' }}>
              Poyanil Building, Near St Thomas Higher Secondary School Ground,<br />
              Poyanil Junction, Kozhencherry, Pathanamthitta-689641, Kerala.
            </p>

            {/* Timings */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: '#64748b', marginBottom: '18px' }}>
              <Clock size={16} style={{ color: '#ea580c' }} />
              <span>Mon - Sat: 8:30 AM - 7:30 PM | Sunday: Closed</span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <a
                href="tel:+919447123456"
                className="btn-hero-secondary"
                style={{ fontSize: '0.86rem', padding: '10px 16px' }}
                id="store-modal-call-btn"
              >
                <Phone size={15} style={{ color: '#ea580c' }} />
                <span>Call Store</span>
              </a>

              <a
                href="https://wa.me/919447123456?text=Hello%20Variathu%20Power%20Tools%20Kozhencherry,%20I%20am%20inquiring%20about%20store%20timings."
                target="_blank"
                rel="noopener noreferrer"
                className="btn-hero-secondary"
                style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#16a34a', fontSize: '0.86rem', padding: '10px 16px' }}
                id="store-modal-whatsapp-btn"
              >
                <MessageCircle size={15} />
                <span>WhatsApp</span>
              </a>

              <a
                href="https://maps.google.com/?q=Poyanil+Junction+Kozhencherry+Pathanamthitta"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-hero-clean"
                style={{ fontSize: '0.86rem', padding: '10px 16px' }}
                id="store-modal-directions-btn"
              >
                <Navigation size={15} />
                <span>Get Directions</span>
              </a>
            </div>
          </div>

          {/* Quick Repair Form */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '18px',
              border: '1px solid #e2e8f0'
            }}
          >
            <h4 style={{ color: '#0f172a', fontSize: '0.92rem', fontWeight: '800', marginBottom: '4px' }}>
              Power Tool Service Clinic
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '14px' }}>
              Armature rewinding, carbon brushes, and switch servicing available at our Kozhencherry workshop.
            </p>

            {serviceRequested ? (
              <div style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem' }}>
                <CheckCircle2 size={16} /> Inquiry generated! Opening WhatsApp...
              </div>
            ) : (
              <form onSubmit={handleSubmitService} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  type="text"
                  required
                  placeholder="Tool model (e.g. Bosch GDC 120 Marble Cutter)"
                  value={toolModel}
                  onChange={(e) => setToolModel(e.target.value)}
                  style={{
                    padding: '9px 12px',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    color: '#0f172a',
                    fontSize: '0.84rem',
                    outline: 'none'
                  }}
                />

                <input
                  type="text"
                  required
                  placeholder="Issue (e.g. sparks, not rotating, switch broken)"
                  value={issueText}
                  onChange={(e) => setIssueText(e.target.value)}
                  style={{
                    padding: '9px 12px',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    color: '#0f172a',
                    fontSize: '0.84rem',
                    outline: 'none'
                  }}
                />

                <button
                  type="submit"
                  className="btn-hero-clean"
                  style={{ justifyContent: 'center', padding: '10px', fontSize: '0.84rem' }}
                >
                  <MessageCircle size={15} />
                  <span>Send Service Request to Workshop</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
