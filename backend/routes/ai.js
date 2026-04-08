const express = require('express');
const router = express.Router();
const { analyzeExpenses } = require('../controllers/aiController');

// Auth middleware
const { authenticateToken } = require('../middlewares/auth');

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/ai/analyze
 * @desc    Analyze user's spending using AI
 * @access  Private
 */
router.post('/analyze', analyzeExpenses);

module.exports = router;
