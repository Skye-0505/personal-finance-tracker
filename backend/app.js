const createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
require('dotenv').config();
// Import database connection
const connectDB = require('./config/database');

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const transactionsRouter = require('./routes/transactions');
const usersRouter = require('./routes/users');
const categoriesRouter = require('./routes/categories');
const aiRouter = require('./routes/ai');

// Connect to MongoDB and initialize database
const { initializeDatabase } = require('./services/initService');
let dbInitialized = false;

connectDB().then(async () => {
  console.log('✅ Database connection established');
  
  // Auto-initialize database immediately after successful connection
  try {
    console.log('\n🚀 Starting automatic database initialization...\n');
    const result = await initializeDatabase();
    console.log('\n📊 Database Initialization Complete:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(result.message);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    dbInitialized = true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.error('Please check your MongoDB connection and try again.\n');
  }
}).catch(err => {
  console.error('❌ Database connection failed:', err.message);
  console.error('Make sure MongoDB is running on localhost:27017\n');
  process.exit(1);
});

var app = express();

// CORS middleware (allow frontend to access)
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:5173'],
  credentials: true
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/', indexRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/ai', aiRouter);

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    success: false,
    message: err.message
  });
});

module.exports = app;
