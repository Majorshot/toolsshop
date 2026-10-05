/**
 * Central Courier & Delivery Partners Configuration
 * Standardized delivery services with official logos, branding colors, and tracking portals
 */

export const COURIER_PARTNERS = [
  {
    id: 'dtdc',
    name: 'DTDC Express',
    shortName: 'DTDC',
    badge: 'DTDC',
    logo: 'https://dtdc-images.dtdc.com/dtdc-web2.0/uploads/2026/01/DTDC-Logo-with-Verticals-01-1-1.webp',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fca5a5',
    tagline: 'Fast Red & Blue Surface Express across Kerala',
    deliveryMode: 'hub-pickup',
    modeLabel: 'Nearest Hub Collection',
    portalUrl: 'https://www.dtdc.com/track-your-shipment/',
    trackingUrl: 'https://www.dtdc.com/track-your-shipment/',
    awbPlaceholder: 'e.g. D58291042',
    generateAwb: () => `D${Math.floor(10000000 + Math.random() * 90000000)}`
  },
  {
    id: 'tpc',
    name: 'The Professional Couriers',
    shortName: 'Professional',
    badge: 'TPC',
    logo: 'https://vectorseek.com/wp-content/uploads/2024/01/The-Professional-Couriers-Logo-Vector.svg-.png',
    color: '#0284c7',
    bg: '#f0f9ff',
    border: '#bae6fd',
    tagline: 'TPC India Domestic Courier Network',
    deliveryMode: 'hub-pickup',
    modeLabel: 'Nearest Hub Collection',
    portalUrl: 'https://www.tpcindia.com/',
    trackingUrl: 'https://www.tpcindia.com/',
    awbPlaceholder: 'e.g. KLB38920194',
    generateAwb: () => `KLB${Math.floor(10000000 + Math.random() * 90000000)}`
  },
  {
    id: 'aps',
    name: 'Alleppey Parcel Service (APS Cargo)',
    shortName: 'Alleppey Parcel',
    badge: 'APS',
    logo: 'https://www.apscargo.com/assets/img/logo.png',
    color: '#059669',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    tagline: 'Kerala Heavy Machinery & Parcel Logistics',
    deliveryMode: 'hub-pickup',
    modeLabel: 'Nearest Hub Collection',
    portalUrl: 'https://www.apscargo.com/index',
    trackingUrl: 'https://www.apscargo.com/index',
    awbPlaceholder: 'e.g. APS682914',
    generateAwb: () => `APS${Math.floor(100000 + Math.random() * 900000)}`
  },
  {
    id: 'delhivery',
    name: 'Delhivery',
    shortName: 'Delhivery',
    badge: 'DELHIVERY',
    logo: 'https://www.delhivery.com/_nuxt/img/Delhivery_Logo_Dark.7c8d330.webp',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    tagline: 'Pan-India Express Surface Logistics',
    deliveryMode: 'doorstep',
    modeLabel: 'Doorstep Delivery',
    portalUrl: 'https://www.delhivery.com/',
    trackingUrl: 'https://www.delhivery.com/',
    awbPlaceholder: 'e.g. 142985720193',
    generateAwb: () => `${Math.floor(100000000000 + Math.random() * 900000000000)}`
  }
];

export const COURIER_DELIVERY_POLICY = {
  doorstepPartner: 'Delhivery',
  hubPartners: ['Alleppey Parcel Service (APS)', 'DTDC Express', 'The Professional Couriers (TPC)'],
  noticeText: 'Doorstep delivery is available exclusively via Delhivery. For APS Cargo, DTDC Express, and The Professional Couriers, packages must be collected from your nearest local hub/branch.'
};

export const resolveCourierPartner = (courierNameOrObj = '') => {
  if (courierNameOrObj && typeof courierNameOrObj === 'object' && courierNameOrObj.logo) {
    return courierNameOrObj;
  }
  const c = String(courierNameOrObj || '').toLowerCase();
  if (c.includes('delh')) {
    return COURIER_PARTNERS.find(p => p.id === 'delhivery') || COURIER_PARTNERS[3] || COURIER_PARTNERS[0];
  }
  if (c.includes('alep') || c.includes('allep') || c.includes('aps')) {
    return COURIER_PARTNERS.find(p => p.id === 'aps') || COURIER_PARTNERS[2] || COURIER_PARTNERS[0];
  }
  if (c.includes('prof') || c.includes('tpc')) {
    return COURIER_PARTNERS.find(p => p.id === 'tpc') || COURIER_PARTNERS[1] || COURIER_PARTNERS[0];
  }
  return COURIER_PARTNERS[0]; // default DTDC
};

export const resolveCourierConfig = resolveCourierPartner;

export const getCourierTrackingLink = (courierNameOrObj = '', awb = '') => {
  const cfg = resolveCourierPartner(courierNameOrObj);
  const cleanAwb = String(awb || '').trim();
  if (cleanAwb) {
    if (cfg.id === 'delhivery') {
      return `https://www.delhivery.com/tracking?tracking_id=${encodeURIComponent(cleanAwb)}`;
    }
    if (cfg.id === 'dtdc') {
      return `https://track.dtdc.com/ctrk-tracking/ctrk-tracking.html?action=Search&strCnNo=${encodeURIComponent(cleanAwb)}`;
    }
    if (cfg.id === 'tpc') {
      return `https://www.tpcindia.com/Track.aspx?ConsignmentNo=${encodeURIComponent(cleanAwb)}`;
    }
    if (cfg.id === 'aps') {
      return 'https://www.apscargo.com/index';
    }
  }
  return cfg.trackingUrl || cfg.portalUrl || 'https://www.dtdc.com/track-your-shipment/';
};

