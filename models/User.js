const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  location: {
    city: String,
    district: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  preferences: {
    favoriteVibes: [{
      type: String,
      enum: ['study-friendly', 'cozy', 'workspace', 'socializing', 'quiet', 'trendy', 'traditional']
    }],
    workSchedule: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night', 'flexible']
    },
    coffeePreferences: [{
      type: String,
      enum: ['espresso', 'americano', 'latte', 'cappuccino', 'mocha', 'cold-brew', 'tea']
    }]
  },
  socialMedia: {
    instagram: String,
    facebook: String,
    twitter: String
  },
  stats: {
    reviewsCount: { type: Number, default: 0 },
    bookmarksCount: { type: Number, default: 0 },
    checkInsCount: { type: Number, default: 0 },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 }
  },
  isBusinessOwner: {
    type: Boolean,
    default: false
  },
  businessInfo: {
    businessName: String,
    businessType: {
      type: String,
      enum: ['coffeeshop', 'cafe', 'restaurant', 'coworking']
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: Date,
  emailVerifiedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for location-based queries
userSchema.index({ 'location.coordinates': '2dsphere' });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update updatedAt on save
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get public profile
userSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    name: this.name,
    avatar: this.avatar,
    bio: this.bio,
    location: this.location,
    preferences: this.preferences,
    socialMedia: this.socialMedia,
    stats: this.stats,
    isBusinessOwner: this.isBusinessOwner,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', userSchema);