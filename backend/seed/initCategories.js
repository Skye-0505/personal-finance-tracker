/**
 * Initialize default categories for existing users
 * Run this script to add default categories to users who don't have them yet
 */

const mongoose = require('mongoose');
const Category = require('../models/Category');
const User = require('../models/User');
const defaultCategories = require('./defaultCategories');

const initializeCategoriesForExistingUsers = async () => {
  try {
    console.log('🚀 Starting category initialization...');

    // Get all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users`);

    let totalCategoriesCreated = 0;

    for (const user of users) {
      // Check if user already has categories
      const existingCategories = await Category.countDocuments({ user_id: user._id });

      if (existingCategories > 0) {
        console.log(`⏭️  Skipping user "${user.username}" (already has ${existingCategories} categories)`);
        continue;
      }

      // Create default categories for this user
      const userCategories = defaultCategories.map(cat => ({
        user_id: user._id,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
        isDefault: cat.isDefault,
        created_at: new Date(),
        updated_at: new Date()
      }));

      await Category.insertMany(userCategories);
      console.log(`✅ Created ${userCategories.length} default categories for user: ${user.username}`);
      totalCategoriesCreated += userCategories.length;
    }

    console.log(`\n🎉 Initialization complete! Created ${totalCategoriesCreated} categories total.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during initialization:', error);
    process.exit(1);
  }
};

// For running directly with node
if (require.main === module) {
  const connectDB = require('../config/database');

  connectDB()
    .then(() => {
      console.log('✅ Database connected');
      return initializeCategoriesForExistingUsers();
    })
    .catch((error) => {
      console.error('❌ Failed to connect to database:', error);
      process.exit(1);
    });
}

module.exports = initializeCategoriesForExistingUsers;
