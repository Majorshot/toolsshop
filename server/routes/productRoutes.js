const express = require('express');
const router = express.Router();
const db = require('../utils/db');

// GET all products with filtering & search
router.get('/', async (req, res) => {
  try {
    const { category, brand, cordless, search, sortBy } = req.query;
    const products = await db.getProducts({ category, brand, cordless, search, sortBy });
    res.json({ success: true, count: products.length, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET taxonomy (brands & categories) - Must be before /:id
router.get('/meta/taxonomy', async (req, res) => {
  try {
    const tax = await db.getTaxonomy();
    res.json({ success: true, ...tax });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST add new brand
router.post('/meta/brands', async (req, res) => {
  try {
    const result = await db.addBrand(req.body.name);
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST add new category
router.post('/meta/categories', async (req, res) => {
  try {
    const result = await db.addCategory(req.body);
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE brand (with optional cascading deletion of associated products)
router.delete('/meta/brands/:name', async (req, res) => {
  try {
    const deleteProducts = req.query.deleteProducts === 'true';
    const result = await db.deleteBrand(req.params.name, deleteProducts);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE category (with optional cascading deletion of associated products)
router.delete('/meta/categories/:id', async (req, res) => {
  try {
    const deleteProducts = req.query.deleteProducts === 'true';
    const result = await db.deleteCategory(req.params.id, deleteProducts);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create product (Admin)
router.post('/', async (req, res) => {
  try {
    const product = await db.createProduct(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT update product (Admin)
router.put('/:id', async (req, res) => {
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

// DELETE product (Admin)
router.delete('/:id', async (req, res) => {
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

