const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const defaultCategories = require('../seed/defaultCategories');

const SALT_ROUNDS = 10;
const ADMIN_USERNAME = '7270_root';
const ADMIN_PASSWORD = '123456';

/**
 * check if users collection exists
 */
const checkCollectionExists = async () => {
  const db = mongoose.connection?.db;
  if (!db) return false;

  const collectionName = User.collection.name; // "users"
  const existing = await db.listCollections({ name: collectionName }).toArray();
  
  return existing.length > 0;
};

/**
 * create users collection
 */
const createUserCollection = async () => {
  const db = mongoose.connection?.db;
  if (!db) throw new Error('Database connection not established');

  const collectionName = User.collection.name;
  
  try {
    await db.createCollection(collectionName, {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['username', 'password_hash'],
          properties: {
            username: {
              bsonType: 'string',
              description: 'must be a string and is required'
            },
            password_hash: {
              bsonType: 'string',
              description: 'must be a string and is required'
            },
            created_at: {
              bsonType: 'date',
              description: 'must be a date'
            },
            updated_at: {
              bsonType: 'date',
              description: 'must be a date'
            },
            is_active: {
              bsonType: 'bool',
              description: 'must be a boolean'
            }
          }
        }
      }
    });
    
    // create unique index
    await User.init();  
    console.log('Users collection created with indexes');
    
  } catch (err) {
    // handle concurrent creation
    if (err?.codeName === 'NamespaceExists' || /already exists/i.test(err?.message || '')) {
      console.log('Users collection already exists (created by another request)');
      return;
    }
    throw err;
  }
};

/**
 * check if admin user exists
 */
const checkAdminExists = async () => {
  const admin = await User.findOne({ username: ADMIN_USERNAME });
  return admin !== null;
};

/**
 * create admin user
 */
const createAdminUser = async () => {
  // hash password
  const password_hash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
  
  const admin = new User({
    username: ADMIN_USERNAME,
    password_hash: password_hash,
    created_at: new Date(),
    updated_at: new Date(),
    is_active: true
  });
  
  await admin.save();
  console.log('Admin user created:', ADMIN_USERNAME);
  
  return {
    _id: admin._id,
    username: admin.username,
    created_at: admin.created_at,
    is_active: admin.is_active
  };
};

/**
 * check if transactions collection exists
 */
const checkTransactionCollectionExists = async () => {
  const db = mongoose.connection?.db;
  if (!db) return false;

  const collectionName = Transaction.collection.name;
  const existing = await db.listCollections({ name: collectionName }).toArray();
  
  return existing.length > 0;
};

/**
 * create transactions collection
 */
const createTransactionCollection = async () => {
  const db = mongoose.connection?.db;
  if (!db) throw new Error('Database connection not established');

  const collectionName = Transaction.collection.name;
  
  try {
    await db.createCollection(collectionName, {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['user_id', 'type', 'amount', 'category'],
          properties: {
            user_id: { bsonType: 'objectId' },
            type: { bsonType: 'string', enum: ['income', 'expense'] },
            amount: { bsonType: 'number', minimum: 0 },
            category: { bsonType: 'string' },
            description: { bsonType: 'string' },
            transaction_date: { bsonType: 'date' }
          }
        }
      }
    });
    
    await Transaction.init();
    
    const collection = db.collection(collectionName);
    await collection.createIndex({ user_id: 1 });
    await collection.createIndex({ transaction_date: -1 });
    await collection.createIndex({ user_id: 1, transaction_date: -1 });
    
    console.log('Transactions collection created with indexes');
    
  } catch (err) {
    if (err?.codeName === 'NamespaceExists' || /already exists/i.test(err?.message || '')) {
      console.log('Transactions collection already exists');
      return;
    }
    throw err;
  }
};

/**
 * Initialize default categories for specified user
 */
const initializeAdminCategories = async (adminId) => {
  try {
    // Check if admin already has categories
    const existingCategories = await Category.countDocuments({ user_id: adminId });

    if (existingCategories > 0) {
      console.log(`⏭️  Admin already has ${existingCategories} categories`);
      return {
        created: false,
        alreadyExists: true,
        count: existingCategories
      };
    }

    // Create default categories for admin
    const userCategories = defaultCategories.map(cat => ({
      user_id: adminId,
      name: cat.name,
      type: cat.type,
      icon: cat.icon,
      color: cat.color,
      isDefault: cat.isDefault,
      created_at: new Date(),
      updated_at: new Date()
    }));

    await Category.insertMany(userCategories);
    console.log(`✅ Created ${userCategories.length} default categories for admin`);

    return {
      created: true,
      count: userCategories.length
    };
  } catch (error) {
    console.error('❌ Error initializing admin categories:', error);
    throw error;
  }
};

const initializeDatabase = async () => {
  const result = {
    usersCollectionCreated: false,
    transactionsCollectionCreated: false,
    adminCreated: false,
    adminInfo: null,
    categoriesCreated: false,
    categoriesCount: 0,
    message: ''
  };
  
  // 1. Users collection
  const usersCollectionExists = await checkCollectionExists();
  if (!usersCollectionExists) {
    await createUserCollection();
    result.usersCollectionCreated = true;
    result.message += 'Users collection created. ';
  } else {
    result.message += 'Users collection already exists. ';
  }
  
  // 2. Transactions collection
  const transactionsCollectionExists = await checkTransactionCollectionExists();
  if (!transactionsCollectionExists) {
    await createTransactionCollection();
    result.transactionsCollectionCreated = true;
    result.message += 'Transactions collection created. ';
  } else {
    result.message += 'Transactions collection already exists. ';
  }
  
  // 3. Admin user
  const adminExists = await checkAdminExists();
  if (!adminExists) {
    const adminInfo = await createAdminUser();
    result.adminCreated = true;
    result.adminInfo = adminInfo;
    result.message += `Admin user "${ADMIN_USERNAME}" created. `;
  } else {
    result.message += `Admin user "${ADMIN_USERNAME}" already exists. `;
  }
  
  // 4. Default categories for admin
  const admin = await User.findOne({ username: ADMIN_USERNAME });
  if (admin) {
    const categoriesResult = await initializeAdminCategories(admin._id);
    if (categoriesResult.created) {
      result.categoriesCreated = true;
      result.categoriesCount = categoriesResult.count;
      result.message += `${categoriesResult.count} default categories created for admin.`;
    } else if (categoriesResult.alreadyExists) {
      result.message += `Admin categories already exist (${categoriesResult.count} found).`;
    }
  }
  
  return result;
};

module.exports = {
  initializeDatabase,
  initializeAdminCategories,
  checkCollectionExists,
  createUserCollection,
  checkAdminExists,
  createAdminUser,
  checkTransactionCollectionExists,
  createTransactionCollection
};