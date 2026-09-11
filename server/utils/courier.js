/**
 * Variathu Power Tools - Multi-Courier Logistics Helper
 * Supported Couriers: DTDC, The Professional Couriers, Alleppey Parcel Service (APS), Delhivery
 */

const COURIER_PARTNERS = {
  dtdc: {
    id: 'dtdc',
    name: 'DTDC Express',
    shortName: 'DTDC',
    trackingUrl: 'https://www.dtdc.com/track-your-shipment/',
    directTrackHelp: 'Enter consignment number on DTDC tracking page',
    awbPrefix: 'D',
    sampleAwb: () => `D${Math.floor(10000000 + Math.random() * 90000000)}`,
    originHub: 'Kozhencherry Branch, Pathanamthitta, Kerala',
    supportContact: '080-25365032',
    color: '#dc2626' // Red
  },
  tpc: {
    id: 'tpc',
    name: 'The Professional Couriers',
    shortName: 'Professional Courier',
    trackingUrl: 'https://www.tpcindia.com/',
    directTrackHelp: 'Enter consignment number on The Professional Couriers portal',
    awbPrefix: 'KLB',
    sampleAwb: () => `KLB${Math.floor(10000000 + Math.random() * 90000000)}`,
    originHub: 'Kozhencherry Office, Pathanamthitta, Kerala',
    supportContact: '+91 468 2212345',
    color: '#0284c7' // Blue
  },
  aps: {
    id: 'aps',
    name: 'Alleppey Parcel Service (APS Cargo)',
    shortName: 'Alleppey Couriers',
    trackingUrl: 'https://www.apscargo.com/index',
    directTrackHelp: 'Enter LR / Consignment number on APS Cargo portal',
    awbPrefix: 'APS',
    sampleAwb: () => `APS${Math.floor(100000 + Math.random() * 900000)}`,
    originHub: 'Kozhencherry Booking Office, Pathanamthitta, Kerala',
    supportContact: '+91 477 2244331',
    color: '#16a34a' // Green
  },
  delhivery: {
    id: 'delhivery',
    name: 'Delhivery',
    shortName: 'Delhivery',
    trackingUrl: 'https://www.delhivery.com/',
    directTrackHelp: 'Enter Waybill / Mobile number on Delhivery tracking page',
    awbPrefix: 'DLH',
    sampleAwb: () => `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
    originHub: 'Kozhencherry Drop Point, Pathanamthitta, Kerala',
    supportContact: '0124-6719500',
    color: '#0f172a' // Dark Slate
  }
};

// District lookup for Kerala pincodes
const KERALA_PIN_PREFIXES = {
  '689': 'Pathanamthitta',
  '686': 'Kottayam',
  '688': 'Alappuzha',
  '682': 'Ernakulam (Kochi)',
  '683': 'Ernakulam',
  '680': 'Thrissur',
  '685': 'Idukki',
  '691': 'Kollam',
  '690': 'Alappuzha / Kollam',
  '695': 'Thiruvananthapuram',
  '678': 'Palakkad',
  '679': 'Palakkad / Malappuram',
  '676': 'Malappuram',
  '673': 'Kozhikode',
  '670': 'Kannur',
  '671': 'Kasaragod'
};

/**
 * Check serviceability for any 6-digit Indian pincode
 */
function checkPincode(pincode) {
  if (!pincode) {
    return { success: false, serviceable: false, message: 'Pincode is required' };
  }

  const cleanPin = String(pincode).trim().replace(/\s+/g, '');
  if (!/^\d{6}$/.test(cleanPin)) {
    return {
      success: false,
      serviceable: false,
      pincode: cleanPin,
      message: 'Please enter a valid 6-digit Indian pincode'
    };
  }

  const prefix3 = cleanPin.substring(0, 3);
  const prefix2 = cleanPin.substring(0, 2);
  const isKerala = ['67', '68', '69'].includes(prefix2);
  const keralaDistrict = KERALA_PIN_PREFIXES[prefix3] || (isKerala ? 'Kerala Region' : null);

  const cityName = cleanPin === '689641' 
    ? 'Kozhencherry, Pathanamthitta'
    : (keralaDistrict ? `${keralaDistrict}, Kerala` : 'India Speed Delivery Zone');

  return {
    success: true,
    serviceable: true,
    pincode: cleanPin,
    isKerala,
    city: cityName,
    district: keralaDistrict || 'All-India Zone',
    state: isKerala ? 'Kerala' : 'National Delivery',
    codAvailable: true,
    prepaidAvailable: true,
    estimatedDelivery: isKerala ? 'Next Day / 48 hrs (Kerala Express)' : '3-5 Business Days',
    partners: Object.values(COURIER_PARTNERS).map(c => c.name),
    message: isKerala 
      ? `Full express coverage via DTDC, Professional, Alleppey (APS) & Delhivery (${cityName})`
      : `Domestic coverage available via DTDC, Professional, Alleppey & Delhivery`
  };
}

/**
 * Get list of available couriers
 */
function getCouriers() {
  return Object.values(COURIER_PARTNERS);
}

/**
 * Normalize courier partner name or id to supported partner config
 */
function resolveCourier(identifier) {
  if (!identifier) return COURIER_PARTNERS.dtdc;
  const lower = String(identifier).toLowerCase();
  if (lower.includes('alep') || lower.includes('allep') || lower.includes('aps')) {
    return COURIER_PARTNERS.aps;
  }
  if (lower.includes('delh')) {
    return COURIER_PARTNERS.delhivery;
  }
  if (lower.includes('prof') || lower.includes('tpc')) {
    return COURIER_PARTNERS.tpc;
  }
  return COURIER_PARTNERS.dtdc;
}

/**
 * Get tracking link & details for an AWB
 */
function getTrackingInfo(courierIdentifier, awb) {
  const courier = resolveCourier(courierIdentifier);
  const cleanAwb = (awb || courier.sampleAwb()).trim();

  return {
    courierId: courier.id,
    courierName: courier.name,
    courierShortName: courier.shortName,
    awb: cleanAwb,
    trackingUrl: courier.trackingUrl,
    originHub: courier.originHub,
    supportContact: courier.supportContact,
    instructions: `Track consignment "${cleanAwb}" on the official ${courier.name} tracking page.`
  };
}

module.exports = {
  COURIER_PARTNERS,
  checkPincode,
  getCouriers,
  resolveCourier,
  getTrackingInfo
};
