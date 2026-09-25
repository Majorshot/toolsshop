const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { requireStoreOwner } = require('../utils/auth');

// GET all products with filtering, search, and optional pagination (Public)
router.get('/', async (req, res) => {
  try {
    res.set('Cache-Control', 'public, max-age=15, stale-while-revalidate=60');
    const { category, brand, cordless, search, sortBy, page, limit } = req.query;
    const result = await db.getProducts({ category, brand, cordless, search, sortBy }, { page, limit });
    if (Array.isArray(result)) {
      res.json({ success: true, count: result.length, data: result });
    } else {
      res.json({
        success: true,
        count: result.products.length,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        limit: result.limit,
        data: result.products
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch catalog' });
  }
});

// GET taxonomy (brands & categories) - Must be before /:id (Public)
router.get('/meta/taxonomy', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    const tax = await db.getTaxonomy();
    res.json({ success: true, ...tax });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch taxonomy' });
  }
});

// POST add new brand (Admin only)
router.post('/meta/brands', requireStoreOwner, async (req, res) => {
  try {
    const result = await db.addBrand(req.body.name);
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST add new category (Admin only)
router.post('/meta/categories', requireStoreOwner, async (req, res) => {
  try {
    const result = await db.addCategory(req.body);
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE brand (Admin only)
router.delete('/meta/brands/:name', requireStoreOwner, async (req, res) => {
  try {
    const deleteProducts = req.query.deleteProducts === 'true';
    const result = await db.deleteBrand(req.params.name, deleteProducts);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE category (Admin only)
router.delete('/meta/categories/:id', requireStoreOwner, async (req, res) => {
  try {
    const deleteProducts = req.query.deleteProducts === 'true';
    const result = await db.deleteCategory(req.params.id, deleteProducts);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single product by ID (Public)
router.get('/:id', async (req, res) => {
  try {
    const product = await db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve product' });
  }
});

// POST create product (Admin only)
router.post('/', requireStoreOwner, async (req, res) => {
  try {
    const product = await db.createProduct(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT update product (Admin only)
router.put('/:id', requireStoreOwner, async (req, res) => {
  try {
    const updated = await db.updateProduct(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE product (Admin only)
router.delete('/:id', requireStoreOwner, async (req, res) => {
  try {
    const deleted = await db.deleteProduct(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Product not found or already deleted" });
    }
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
