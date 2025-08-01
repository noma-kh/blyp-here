const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
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
  collection: {
    type: String,
    default: 'favorites',
    enum: ['favorites', 'want-to-visit', 'study-spots', 'date-places', 'work-friendly', 'custom']
  },
  customCollectionName: {
    type: String,
    maxlength: [50, 'Collection name cannot exceed 50 characters']
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure unique bookmark per user per coffeeshop per collection
bookmarkSchema.index({ user: 1, coffeeshop: 1, collection: 1 }, { unique: true });

// Index for user's bookmarks queries
bookmarkSchema.index({ user: 1, createdAt: -1 });
bookmarkSchema.index({ user: 1, collection: 1, createdAt: -1 });

// Post-save middleware to update user and coffeeshop stats
bookmarkSchema.post('save', async function(doc) {
  try {
    const User = mongoose.model('User');
    const Coffeeshop = mongoose.model('Coffeeshop');
    
    // Update user bookmark count
    const userBookmarkCount = await mongoose.model('Bookmark').countDocuments({ user: doc.user });
    await User.findByIdAndUpdate(doc.user, { 'stats.bookmarksCount': userBookmarkCount });
    
    // Update coffeeshop bookmark count
    const coffeeshopBookmarkCount = await mongoose.model('Bookmark').countDocuments({ coffeeshop: doc.coffeeshop });
    await Coffeeshop.findByIdAndUpdate(doc.coffeeshop, { 'stats.bookmarksCount': coffeeshopBookmarkCount });
  } catch (error) {
    console.error('Error updating bookmark stats:', error);
  }
});

// Post-remove middleware to update stats
bookmarkSchema.post('remove', async function(doc) {
  try {
    const User = mongoose.model('User');
    const Coffeeshop = mongoose.model('Coffeeshop');
    
    // Update user bookmark count
    const userBookmarkCount = await mongoose.model('Bookmark').countDocuments({ user: doc.user });
    await User.findByIdAndUpdate(doc.user, { 'stats.bookmarksCount': userBookmarkCount });
    
    // Update coffeeshop bookmark count
    const coffeeshopBookmarkCount = await mongoose.model('Bookmark').countDocuments({ coffeeshop: doc.coffeeshop });
    await Coffeeshop.findByIdAndUpdate(doc.coffeeshop, { 'stats.bookmarksCount': coffeeshopBookmarkCount });
  } catch (error) {
    console.error('Error updating bookmark stats:', error);
  }
});

module.exports = mongoose.model('Bookmark', bookmarkSchema);