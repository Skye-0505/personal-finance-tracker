const Category = require('../models/Category');

// Get all categories for the current user
const getCategories = async (req, res) => {
  try {
    const userId = req.user._id;
    const categories = await Category.find({ user_id: userId }).sort({ created_at: -1 });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
};

// Get a single category by ID
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const category = await Category.findOne({ _id: id, user_id: userId });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category'
    });
  }
};

// Create a new category
const createCategory = async (req, res) => {
  try {
    const { name, type } = req.body;
    const userId = req.user._id;

    // Validation
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({
      user_id: userId,
      name: name.trim(),
      type: type || 'expense'
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    const category = new Category({
      user_id: userId,
      name: name.trim(),
      type: type || 'expense'
    });

    await category.save();

    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully'
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category'
    });
  }
};

// Update a category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type } = req.body;
    const userId = req.user._id;

    // Validation
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    const category = await Category.findOne({ _id: id, user_id: userId });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if name is being changed and if new name already exists
    if (category.name !== name.trim()) {
      const existingCategory = await Category.findOne({
        user_id: userId,
        name: name.trim(),
        type: type || category.type
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
    }

    category.name = name.trim();
    if (type) {
      category.type = type;
    }

    await category.save();

    res.json({
      success: true,
      data: category,
      message: 'Category updated successfully'
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category'
    });
  }
};

// Delete a category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const category = await Category.findOne({ _id: id, user_id: userId });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has associated transactions
    const Transaction = require('../models/Transaction');
    const transactionCount = await Transaction.countDocuments({
      user_id: userId,
      category: category.name
    });

    if (transactionCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'This category has associated transactions and cannot be deleted',
        transactionCount
      });
    }

    await Category.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to delete category'
    });
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};
