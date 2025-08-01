const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coffeeshop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coffeeshop',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  comment: {
    type: String,
    required: [true, 'Comment is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  images: [{
    url: { type: String, required: true },
    caption: String
  }],
  visitDate: {
    type: Date,
    required: true
  },
  vibeRatings: {
    ambiance: { type: Number, min: 1, max: 5 },
    service: { type: Number, min: 1, max: 5 },
    coffeeQuality: { type: Number, min: 1, max: 5 },
    valueForMoney: { type: Number, min: 1, max: 5 },
    cleanliness: { type: Number, min: 1, max: 5 }
  },
  tags: [{
    type: String,
    enum: ['great-coffee', 'good-wifi', 'quiet', 'busy', 'expensive', 'affordable', 'friendly-staff', 'slow-service', 'cozy', 'spacious', 'study-friendly', 'date-spot']
  }],
  recommendedFor: [{
    type: String,
    enum: ['studying', 'meetings', 'dates', 'casual-hangout', 'working', 'reading']
  }],
  helpfulVotes: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    votedAt: { type: Date, default: Date.now }
  }],
  helpfulCount: {
    type: Number,
    default: 0
  },
  replies: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: { type: String, required: true, maxlength: 500 },
    createdAt: { type: Date, default: Date.now }
  }],
  isVerifiedVisit: {
    type: Boolean,
    default: false
  },
  reportedBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String, required: true },
    reportedAt: { type: Date, default: Date.now }
  }],
  isHidden: {
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

// Compound indexes for efficient queries
reviewSchema.index({ coffeeshop: 1, rating: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ coffeeshop: 1, createdAt: -1 });
reviewSchema.index({ rating: -1, helpfulCount: -1 });

// Ensure one review per user per coffeeshop
reviewSchema.index({ user: 1, coffeeshop: 1 }, { unique: true });

// Pre-save middleware to update updatedAt
reviewSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Post-save middleware to update coffeeshop rating
reviewSchema.post('save', async function(doc) {
  await updateCoffeeshopRating(doc.coffeeshop);
});

// Post-remove middleware to update coffeeshop rating
reviewSchema.post('remove', async function(doc) {
  await updateCoffeeshopRating(doc.coffeeshop);
});

// Helper function to update coffeeshop rating
async function updateCoffeeshopRating(coffeeshopId) {
  try {
    const Coffeeshop = mongoose.model('Coffeeshop');
    const Review = mongoose.model('Review');
    
    const stats = await Review.aggregate([
      { $match: { coffeeshop: coffeeshopId, isHidden: false } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);
    
    const rating = stats.length > 0 ? {
      average: Math.round(stats[0].averageRating * 10) / 10,
      count: stats[0].totalReviews
    } : { average: 0, count: 0 };
    
    await Coffeeshop.findByIdAndUpdate(coffeeshopId, {
      rating: rating,
      'stats.reviewsCount': rating.count
    });
  } catch (error) {
    console.error('Error updating coffeeshop rating:', error);
  }
}

// Instance method to check if user found review helpful
reviewSchema.methods.isHelpfulToUser = function(userId) {
  return this.helpfulVotes.some(vote => vote.user.toString() === userId.toString());
};

// Virtual for average vibe rating
reviewSchema.virtual('averageVibeRating').get(function() {
  const ratings = this.vibeRatings;
  const values = Object.values(ratings).filter(val => val != null);
  if (values.length === 0) return null;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
});

module.exports = mongoose.model('Review', reviewSchema);