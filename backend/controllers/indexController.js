const { initializeDatabase } = require('../services/initService');
const Category = require('../models/Category');
const defaultCategories = require('../seed/defaultCategories');

/**
 * Initialize default categories for a specific user
 * @param {string} userId - User ID
 * @returns {Object} Initialization result
 */
const initializeCategoriesForUser = async (userId) => {
  try {
    // Check if user already has categories
    const existingCategories = await Category.countDocuments({ user_id: userId });

    if (existingCategories > 0) {
      return {
        success: true,
        message: `You already have ${existingCategories} categories`,
        data: {
          alreadyExists: true,
          count: existingCategories
        }
      };
    }

    // Create default categories for this user
    const userCategories = defaultCategories.map(cat => ({
      user_id: userId,
      name: cat.name,
      type: cat.type,
      icon: cat.icon,
      color: cat.color,
      isDefault: cat.isDefault,
      created_at: new Date(),
      updated_at: new Date()
    }));

    await Category.insertMany(userCategories);

    return {
      success: true,
      message: `Successfully created ${userCategories.length} default categories`,
      data: {
        created: true,
        count: userCategories.length
      }
    };
  } catch (error) {
    console.error('Error initializing categories:', error);
    return {
      success: false,
      message: 'Failed to initialize categories',
      error: error.message
    };
  }
};

/**
 * POST /api/init - Initialize database
 * Creates: users collection, transactions collection, admin user, and default categories
 */
const initDBController = async (req, res) => {
  try {
    const result = await initializeDatabase();
    
    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        users_collection_created: result.usersCollectionCreated,
        transactions_collection_created: result.transactionsCollectionCreated,
        admin_created: result.adminCreated,
        admin: result.adminInfo,
        categories_created: result.categoriesCreated,
        categories_count: result.categoriesCount
      }
    });
    
  } catch (error) {
    console.error('Database initialization error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Database initialization failed',
      error: error.message
    });
  }
};

/**
 * POST /api/categories/init - Initialize categories for current user
 * Integrated from categoryInitController
 */
const initUserCategoriesController = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await initializeCategoriesForUser(userId);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Categories initialization error:', error);
    res.status(500).json({
      success: false,
      message: 'Categories initialization failed',
      error: error.message
    });
  }
};

module.exports = {
  initDBController,
  initUserCategoriesController,
  initializeCategoriesForUser
};