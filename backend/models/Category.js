const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    default: 'expense'
  },
  icon: {
    type: String,
    default: 'bi-tag'
  },
  color: {
    type: String,
    default: '#9CAF9A'
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  versionKey: false
});

CategorySchema.pre('findOneAndUpdate', async function() {
  this.set({ updated_at: new Date() });
});

CategorySchema.pre('updateOne', async function() {
  this.set({ updated_at: new Date() });
});

module.exports = mongoose.model('Category', CategorySchema);