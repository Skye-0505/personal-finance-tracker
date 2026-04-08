const bcrypt = require('bcrypt');
const User = require('../models/User');
const Category = require('../models/Category');
const { generateToken } = require('../utils/jwt');
const defaultCategories = require('../seed/defaultCategories');

const SALT_ROUNDS = 10;

// Login function
const login = async (username, password) => {
  const user = await User.findOne({ username: username });
  
  if (!user) {
    return {
      success: false,
      statusCode: 401,
      message: 'User not found'
    };
  }
  
  if (!user.is_active) {
    return {
      success: false,
      statusCode: 401,
      message: 'Account is deactivated'
    };
  }
  
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  
  if (!isPasswordValid) {
    return {
      success: false,
      statusCode: 401,
      message: 'Invalid password'
    };
  }
  
  const token = generateToken({
    _id: user._id,
    username: user.username
  });
  
  const userInfo = {
    _id: user._id,
    username: user.username,
    created_at: user.created_at,
    is_active: user.is_active
  };
  
  return {
    success: true,
    statusCode: 200,
    message: 'Login successful',
    data: {
      token,
      user: userInfo
    }
  };
};

// Register function 
const register = async (username, password) => {
  // 1. Check if username already exists
  const existingUser = await User.findOne({ username: username });
  
  if (existingUser) {
    return {
      success: false,
      statusCode: 400,
      message: 'Username already exists'
    };
  }
  
  // 2. Validate password length
  if (!password || password.length < 6) {
    return {
      success: false,
      statusCode: 400,
      message: 'Password must be at least 6 characters'
    };
  }
  
  // 3. Hash password
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  
  // 4. Create new user
  const newUser = new User({
    username,
    password_hash,
    created_at: new Date(),
    updated_at: new Date(),
    is_active: true
  });
  
  await newUser.save();

  // 5. Create default categories for the new user
  try {
    const userCategories = defaultCategories.map(cat => ({
      user_id: newUser._id,
      name: cat.name,
      type: cat.type,
      icon: cat.icon,
      color: cat.color,
      isDefault: cat.isDefault,
      created_at: new Date(),
      updated_at: new Date()
    }));

    await Category.insertMany(userCategories);
    console.log(`✅ Created ${userCategories.length} default categories for user: ${username}`);
  } catch (error) {
    console.error('Error creating default categories:', error);
    // Don't fail registration if category creation fails
  }

  // 6. Return user info (without password)
  const userInfo = {
    _id: newUser._id,
    username: newUser.username,
    created_at: newUser.created_at,
    is_active: newUser.is_active
  };
  
  return {
    success: true,
    statusCode: 201,
    message: 'Account created successfully',
    data: {
      user: userInfo
    }
  };
};

module.exports = {
  login,
  register
};