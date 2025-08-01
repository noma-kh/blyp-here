const mongoose = require('mongoose');

const coffeeshopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Coffeeshop name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  address: {
    street: { type: String, required: true },
    district: { type: String, required: true },
    city: { type: String, required: true },
    province: { type: String, default: 'Mongolia' },
    postalCode: String
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      index: '2dsphere'
    }
  },
  contact: {
    phone: String,
    email: String,
    website: String,
    socialMedia: {
      facebook: String,
      instagram: String,
      twitter: String
    }
  },
  hours: {
    monday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    tuesday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    wednesday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    thursday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    friday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    saturday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    sunday: { open: String, close: String, isClosed: { type: Boolean, default: false } }
  },
  images: [{
    url: { type: String, required: true },
    caption: String,
    isPrimary: { type: Boolean, default: false },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now }
  }],
  logo: {
    url: String,
    backgroundColor: { type: String, default: '#8B5A2B' }
  },
  vibes: [{
    type: String,
    enum: ['study-friendly', 'cozy', 'workspace', 'socializing', 'quiet', 'trendy', 'traditional', 'romantic', 'family-friendly']
  }],
  amenities: [{
    type: String,
    enum: ['wifi', 'power-outlets', 'outdoor-seating', 'parking', 'wheelchair-accessible', 'pet-friendly', 'takeaway', 'delivery', 'group-seating', 'private-rooms']
  }],
  specialties: [{
    type: String,
    enum: ['specialty-coffee', 'local-roast', 'international-coffee', 'tea-selection', 'pastries', 'light-meals', 'vegan-options', 'gluten-free']
  }],
  priceRange: {
    type: String,
    enum: ['$', '$$', '$$$'],
    required: true
  },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  stats: {
    viewsCount: { type: Number, default: 0 },
    bookmarksCount: { type: Number, default: 0 },
    checkInsCount: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 }
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Geospatial index for location-based queries
coffeeshopSchema.index({ location: '2dsphere' });

// Text index for search functionality
coffeeshopSchema.index({
  name: 'text',
  description: 'text',
  'address.district': 'text',
  'address.city': 'text',
  vibes: 'text',
  specialties: 'text'
});

// Compound indexes for common queries
coffeeshopSchema.index({ 'rating.average': -1, 'stats.reviewsCount': -1 });
coffeeshopSchema.index({ vibes: 1, 'rating.average': -1 });
coffeeshopSchema.index({ 'address.city': 1, 'rating.average': -1 });

// Pre-save middleware to update updatedAt
coffeeshopSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for formatted address
coffeeshopSchema.virtual('formattedAddress').get(function() {
  return `${this.address.street}, ${this.address.district}, ${this.address.city}`;
});

// Method to check if currently open
coffeeshopSchema.methods.isCurrentlyOpen = function() {
  const now = new Date();
  const day = now.toLocaleLowerCase().slice(0, 3) + now.toLocaleLowerCase().slice(3);
  const currentTime = now.toTimeString().slice(0, 5);
  
  const todayHours = this.hours[day];
  if (!todayHours || todayHours.isClosed) return false;
  
  return currentTime >= todayHours.open && currentTime <= todayHours.close;
};

// Method to calculate distance from coordinates
coffeeshopSchema.methods.distanceFrom = function(longitude, latitude) {
  const [shopLng, shopLat] = this.location.coordinates;
  const R = 6371; // Earth's radius in kilometers
  
  const dLat = (shopLat - latitude) * Math.PI / 180;
  const dLng = (shopLng - longitude) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(latitude * Math.PI / 180) * Math.cos(shopLat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
};

module.exports = mongoose.model('Coffeeshop', coffeeshopSchema);