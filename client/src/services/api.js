const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const api = {
  // Auth: Dual Login
  async login(credentials) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return await res.json();
  },

  // Auth: Register new customer account
  async register(data) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },

  // Auth: Quick Phone Existence Check (Blinkit/Zepto-style)
  async checkPhone(phone) {
    const clean = String(phone).replace(/[^0-9]/g, '').slice(-10);
    const res = await fetch(`${API_BASE}/auth/check-phone/${clean}`);
    if (!res.ok) return { success: false, exists: false };
    return await res.json();
  },

  // Auth: Send 6-digit OTP to Customer
  async sendOtp(payload) {
    const res = await fetch(`${API_BASE}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to send verification code');
    return data;
  },

  // Auth: Verify 6-digit OTP & sign in / register
  async verifyOtp(payload) {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Verification failed');
    return data;
  },

  // Auth: Resend 6-digit OTP
  async resendOtp(payload) {
    const res = await fetch(`${API_BASE}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to resend verification code');
    return data;
  },


  // Fetch products with search & filters (supports optional pagination)
  async getProducts(params = {}) {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'all') query.append('category', params.category);
    if (params.brand && params.brand !== 'all') query.append('brand', params.brand);
    if (params.cordless !== undefined && params.cordless !== null) query.append('cordless', params.cordless);
    if (params.search) query.append('search', params.search);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const res = await fetch(`${API_BASE}/products?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return await res.json();
  },

  // Single product
  async getProduct(id) {
    const res = await fetch(`${API_BASE}/products/${id}`);
    if (!res.ok) throw new Error('Failed to fetch product');
    return await res.json();
  },

  // Admin: Create product
  async createProduct(data) {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create product');
    return await res.json();
  },

  // Admin: Update product
  async updateProduct(id, data) {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update product');
    return await res.json();
  },

  // Admin: Delete product
  async deleteProduct(id) {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to delete product');
    }
    return await res.json();
  },

  // Taxonomy: Categories and Brands
  async getTaxonomy() {
    const res = await fetch(`${API_BASE}/products/meta/taxonomy?_t=${Date.now()}`, {
      cache: 'no-store'
    });
    if (!res.ok) throw new Error('Failed to fetch taxonomy');
    return await res.json();
  },

  async addBrand(name) {
    const res = await fetch(`${API_BASE}/products/meta/brands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to add brand');
    return data;
  },

  async addCategory(catData) {
    const res = await fetch(`${API_BASE}/products/meta/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(catData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to add category');
    return data;
  },

  async deleteBrand(name, deleteProducts = false) {
    const res = await fetch(`${API_BASE}/products/meta/brands/${encodeURIComponent(name)}?deleteProducts=${deleteProducts}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete brand');
    return data;
  },

  async deleteCategory(id, deleteProducts = false) {
    const res = await fetch(`${API_BASE}/products/meta/categories/${encodeURIComponent(id)}?deleteProducts=${deleteProducts}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete category');
    return data;
  },

  // Place order
  async createOrder(orderData) {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    if (!res.ok) throw new Error('Failed to place order');
    return await res.json();
  },

  // Admin: Get all orders
  async getOrders() {
    const res = await fetch(`${API_BASE}/orders`);
    if (!res.ok) throw new Error('Failed to fetch orders');
    return await res.json();
  },

  // Customer: Get orders by phone/name
  async getCustomerOrders(identifier) {
    const res = await fetch(`${API_BASE}/orders/customer/${encodeURIComponent(identifier)}`);
    if (!res.ok) throw new Error('Failed to fetch customer orders');
    return await res.json();
  },

  // Admin: Update order status (with optional courier partner & AWB consignment)
  async updateOrderStatus(orderId, status, extra = {}) {
    const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...extra }),
    });
    if (!res.ok) throw new Error('Failed to update order status');
    return await res.json();
  },

  // Cancel order with automatic online refund
  async cancelOrder(orderId, options = {}) {
    const res = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to cancel order');
    return data;
  },

  // Request cancellation for dispatched orders (customer)
  async requestCancellation(orderId, options = {}) {
    const res = await fetch(`${API_BASE}/orders/${orderId}/request-cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to submit cancellation request');
    return data;
  },

  // Reject cancellation request (store manager)
  async rejectCancellation(orderId) {
    const res = await fetch(`${API_BASE}/orders/${orderId}/reject-cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to reject cancellation request');
    return data;
  },

  // Store information
  async getStoreInfo() {
    const res = await fetch(`${API_BASE}/store`);
    if (!res.ok) throw new Error('Failed to fetch store info');
    return await res.json();
  },

  // Live courier or pickup tracking details
  async getOrderTracking(orderId) {
    const res = await fetch(`${API_BASE}/orders/${orderId}/tracking`);
    if (!res.ok) throw new Error('Failed to fetch order tracking');
    return await res.json();
  },

  // Counter staff: Verify pickup 4-digit OTP
  async verifyPickupOtp(orderId, otp) {
    const res = await fetch(`${API_BASE}/orders/${orderId}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'OTP verification failed');
    return data;
  },

  // Process Instant Payment / Webhook simulation
  async payOrder(orderId, paymentData = {}) {
    const res = await fetch(`${API_BASE}/orders/${orderId}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to capture payment');
    return data;
  },

  // Razorpay Live Order Creation
  async createRazorpayOrder(amount, receipt, notes) {
    const res = await fetch(`${API_BASE}/payment/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, receipt, notes }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to initialize Razorpay checkout');
    return data;
  },

  // Razorpay HMAC Verification
  async verifyRazorpayPayment(verificationData) {
    const res = await fetch(`${API_BASE}/payment/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(verificationData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Payment verification failed');
    return data;
  },

  // Database Connection Status & Reconnect
  async getDbStatus() {
    const res = await fetch(`${API_BASE}/db-status`);
    if (!res.ok) throw new Error('Failed to fetch DB status');
    return await res.json();
  },

  async reconnectDb() {
    const res = await fetch(`${API_BASE}/db-reconnect`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to trigger DB reconnect');
    return await res.json();
  },

  // Logistics & Courier Partner APIs (DTDC Express & The Professional Couriers)
  async checkShippingPincode(pincode) {
    const res = await fetch(`${API_BASE}/shipping/check-pincode/${encodeURIComponent(pincode)}`);
    if (!res.ok) throw new Error('Failed to check pincode serviceability');
    return await res.json();
  },

  async getAvailableCouriers() {
    const res = await fetch(`${API_BASE}/shipping/couriers`);
    if (!res.ok) throw new Error('Failed to fetch courier partners');
    return await res.json();
  },

  async trackShipment(courierIdentifier, waybill) {
    const courierPart = courierIdentifier ? `${encodeURIComponent(courierIdentifier)}/` : '';
    const res = await fetch(`${API_BASE}/shipping/track/${courierPart}${encodeURIComponent(waybill)}`);
    if (!res.ok) throw new Error('Failed to fetch tracking information');
    return await res.json();
  },

  async getShippingStatus() {
    const res = await fetch(`${API_BASE}/shipping/status`);
    if (!res.ok) throw new Error('Failed to fetch shipping integration status');
    return await res.json();
  },

  // Promo & Coupon Manager
  async getCoupons() {
    const res = await fetch(`${API_BASE}/coupons`);
    if (!res.ok) throw new Error('Failed to fetch coupons');
    return await res.json();
  },

  async createCoupon(data) {
    const res = await fetch(`${API_BASE}/coupons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to create coupon');
    return result;
  },

  async updateCoupon(id, data) {
    const res = await fetch(`${API_BASE}/coupons/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to update coupon');
    return result;
  },

  async deleteCoupon(id) {
    const res = await fetch(`${API_BASE}/coupons/${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to delete coupon');
    return result;
  },

  async validateCoupon(code, subtotal, userIdent = '') {
    const payload = typeof userIdent === 'object'
      ? { code, subtotal, ...userIdent }
      : { code, subtotal, phone: userIdent };
    const res = await fetch(`${API_BASE}/coupons/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  // Workshop & Repair Job Cards
  async getRepairJobs() {
    const res = await fetch(`${API_BASE}/repairs`);
    if (!res.ok) throw new Error('Failed to fetch repair jobs');
    return await res.json();
  },

  async getRepairJob(id) {
    const res = await fetch(`${API_BASE}/repairs/${id}`);
    if (!res.ok) throw new Error('Failed to fetch repair job');
    return await res.json();
  },

  async createRepairJob(data) {
    const res = await fetch(`${API_BASE}/repairs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to create repair job');
    return result;
  },

  async updateRepairJob(id, data) {
    const res = await fetch(`${API_BASE}/repairs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to update repair job');
    return result;
  },

  async deleteRepairJob(id) {
    const res = await fetch(`${API_BASE}/repairs/${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to delete repair job');
    return result;
  },

  async verifyRepairOtp(id, otp) {
    const res = await fetch(`${API_BASE}/repairs/${id}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to verify handover OTP');
    return result;
  },

  // Customer Directory & CRM (500+ Customers)
  async getCustomers(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const res = await fetch(`${API_BASE}/customers?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch customers');
    return await res.json();
  },

  async getCustomer(id) {
    const res = await fetch(`${API_BASE}/customers/${id}`);
    if (!res.ok) throw new Error('Failed to fetch customer profile');
    return await res.json();
  },

  async updateCustomer(id, data) {
    const res = await fetch(`${API_BASE}/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to update customer');
    return result;
  },

  async createCustomer(data) {
    const res = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to create customer');
    return result;
  },

  // Customer: Add new delivery address (Flipkart style)
  async addCustomerAddress(customerId, addressData) {
    const res = await fetch(`${API_BASE}/customers/${customerId}/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addressData)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to save delivery address');
    return result;
  },

  // Customer: Update a saved address
  async updateCustomerAddress(customerId, addressId, addressData) {
    const res = await fetch(`${API_BASE}/customers/${customerId}/addresses/${addressId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addressData)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to update address');
    return result;
  },

  // Customer: Set default address
  async setDefaultCustomerAddress(customerId, addressId) {
    const res = await fetch(`${API_BASE}/customers/${customerId}/addresses/${addressId}/default`, {
      method: 'PUT'
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to set default address');
    return result;
  },

  // Customer: Delete a saved address
  async deleteCustomerAddress(customerId, addressId) {
    const res = await fetch(`${API_BASE}/customers/${customerId}/addresses/${addressId}`, {
      method: 'DELETE'
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to delete saved address');
    return result;
  },

  // Trigger WhatsApp notification for order
  async sendOrderWhatsApp(orderId, messageType = 'confirmed') {
    const res = await fetch(`${API_BASE}/orders/${orderId}/send-whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageType })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to send WhatsApp message');
    return data;
  },

  // 24/7 Render Keep-Alive Ping
  async pingKeepAlive() {
    try {
      const res = await fetch(`${API_BASE}/keep-alive`);
      return await res.json();
    } catch (e) {
      return { status: 'error', error: e.message };
    }
  }
};
