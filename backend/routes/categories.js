const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { initUserCategoriesController } = require('../controllers/indexController');

// Auth middleware
const { authenticateToken } = require('../middlewares/auth');

// All routes require authentication
router.use(authenticateToken);

// POST /api/categories/init - Initialize default categories
router.post('/init', initUserCategoriesController);

// GET /api/categories - Get all categories
router.get('/', getCategories);

// GET /api/categories/:id - Get a single category
router.get('/:id', getCategoryById);

// POST /api/categories - Create a new category
router.post('/', createCategory);

// PUT /api/categories/:id - Update a category
router.put('/:id', updateCategory);

// DELETE /api/categories/:id - Delete a category
router.delete('/:id', deleteCategory);

module.exports = router;
