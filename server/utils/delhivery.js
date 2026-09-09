const https = require('https');

const DELHIVERY_API_HOST = 'track.delhivery.com';

function getApiToken() {
  return process.env.DELHIVERY_API_TOKEN || '943a9342db5c13138cfef66325f47516051c388a';
}

/**
 * Make an HTTPS request to Delhivery API
 */
function delhiveryRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const token = getApiToken();
    const headers = {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const reqOptions = {
      hostname: DELHIVERY_API_HOST,
      path,
      method: options.method || 'GET',
      headers
    };

    const req = https.request(reqOptions, (res) => {
      let rawData = '';
      res.on('data', (chunk) => {
        rawData += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(rawData);
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, raw: rawData });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

/**
 * Check serviceability for a given pincode
 */
async function checkPincode(pincode) {
  if (!pincode) return { serviceable: false, message: 'Pincode is required' };
  const cleanPin = String(pincode).trim();

  try {
    const res = await delhiveryRequest(`/c/api/pin-codes/json/?filter_codes=${cleanPin}`);
    if (res.statusCode === 200 && res.data && res.data.delivery_codes && res.data.delivery_codes.length > 0) {
      const codeObj = res.data.delivery_codes[0]?.postal_code;
      if (codeObj) {
        return {
          success: true,
          serviceable: true,
          pincode: cleanPin,
          city: codeObj.district || codeObj.city || '',
          district: codeObj.district || '',
          state: codeObj.state_code || 'KL',
          codAvailable: codeObj.cod === 'Y',
          prepaidAvailable: codeObj.pre_paid === 'Y',
          pickupAvailable: codeObj.pickup === 'Y',
          partner: 'Delhivery Express'
        };
      }
    }
    return {
      success: true,
      serviceable: false,
      pincode: cleanPin,
      message: `Pincode ${cleanPin} is currently outside direct Delhivery express zones.`
    };
  } catch (err) {
    console.error('[Delhivery Pincode Error]:', err.message);
    return {
      success: false,
      serviceable: true, // fallback to avoid blocking
      pincode: cleanPin,
      fallback: true,
      message: 'Serviceability check fallback active'
    };
  }
}

/**
 * Track shipment by Waybill / AWB
 */
async function trackShipment(waybill) {
  if (!waybill) return null;
  const cleanWaybill = String(waybill).trim();

  try {
    const res = await delhiveryRequest(`/api/v1/packages/json/?waybill=${encodeURIComponent(cleanWaybill)}`);
    if (res.statusCode === 200 && res.data && res.data.ShipmentData && res.data.ShipmentData.length > 0) {
      const shipment = res.data.ShipmentData[0]?.Shipment;
      if (shipment) {
        return {
          found: true,
          statusCode: res.statusCode,
          waybill: cleanWaybill,
          status: shipment.Status?.Status || 'In Transit',
          statusType: shipment.Status?.StatusType,
          statusDateTime: shipment.Status?.StatusDateTime,
          origin: shipment.Origin || 'Kozhencherry, Pathanamthitta',
          destination: shipment.Destination || '',
          expectedDeliveryDate: shipment.ExpectedDeliveryDate,
          scans: (shipment.Scans || []).map(s => ({
            scanDetail: s.ScanDetail?.Scan,
            scanDateTime: s.ScanDetail?.ScanDateTime,
            location: s.ScanDetail?.ScannedLocation
          })),
          raw: res.data
        };
      }
    }
    return {
      found: false,
      statusCode: res.statusCode,
      waybill: cleanWaybill,
      delhiveryError: res.data?.Error || res.data?.rmk || 'No live scans yet on Delhivery network',
      message: res.data?.Error ? `Delhivery API: ${res.data.Error}` : 'No live scans yet on Delhivery network',
      raw: res.data
    };
  } catch (err) {
    console.error('[Delhivery Tracking Error]:', err.message);
    return {
      found: false,
      statusCode: 500,
      waybill: cleanWaybill,
      error: err.message
    };
  }
}

module.exports = {
  getApiToken,
  checkPincode,
  trackShipment
};
