const express = require('express');
const { query, validationResult } = require('express-validator');
const User = require('../models/User');
const Review = require('../models/Review');
const Bookmark = require('../models/Bookmark');
const Coffeeshop = require('../models/Coffeeshop');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get user profile with stats
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's public profile
    const userProfile = user.toPublicJSON();

    // Get additional stats
    const [reviewsCount, bookmarksCount, coffeeshopsCount] = await Promise.all([
      Review.countDocuments({ user: req.params.id, isHidden: false }),
      Bookmark.countDocuments({ user: req.params.id }),
      Coffeeshop.countDocuments({ owner: req.params.id, isActive: true })
    ]);

    // Update stats
    userProfile.stats = {
      ...userProfile.stats,
      reviewsCount,
      bookmarksCount,
      coffeeshopsCount
    };

    // Check if current user is following this user (if authenticated)
    let isFollowing = false;
    if (req.user && req.user._id.toString() !== req.params.id) {
      // Add following logic here when implemented
      isFollowing = false; // Placeholder
    }

    res.json({
      success: true,
      data: {
        ...userProfile,
        isFollowing,
        isOwnProfile: req.user ? req.user._id.toString() === req.params.id : false
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile'
    });
  }
});

// Get user's activity feed
router.get('/:id/activity', optionalAuth, [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 20 }).toInt(),
  query('type').optional().isIn(['reviews', 'bookmarks', 'coffeeshops']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 10,
      type
    } = req.query;

    const skip = (page - 1) * limit;
    let activities = [];

    // Check if user exists
    const user = await User.findById(req.params.id);
    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!type || type === 'reviews') {
      // Get recent reviews
      const reviews = await Review.find({
        user: req.params.id,
        isHidden: false
      })
      .populate('coffeeshop', 'name address.city images rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

      activities = activities.concat(
        reviews.map(review => ({
          type: 'review',
          data: review,
          createdAt: review.createdAt
        }))
      );
    }

    if (!type || type === 'bookmarks') {
      // Get recent bookmarks (only public ones)
      const bookmarks = await Bookmark.find({
        user: req.params.id,
        isPrivate: false
      })
      .populate({
        path: 'coffeeshop',
        match: { isActive: true },
        select: 'name address.city images rating vibes'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

      const validBookmarks = bookmarks.filter(b => b.coffeeshop);

      activities = activities.concat(
        validBookmarks.map(bookmark => ({
          type: 'bookmark',
          data: bookmark,
          createdAt: bookmark.createdAt
        }))
      );
    }

    if (!type || type === 'coffeeshops') {
      // Get user's coffeeshops (if business owner)
      if (user.isBusinessOwner) {
        const coffeeshops = await Coffeeshop.find({
          owner: req.params.id,
          isActive: true
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

        activities = activities.concat(
          coffeeshops.map(coffeeshop => ({
            type: 'coffeeshop',
            data: coffeeshop,
            createdAt: coffeeshop.createdAt
          }))
        );
      }
    }

    // Sort all activities by date
    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Limit to requested amount
    activities = activities.slice(0, limit);

    res.json({
      success: true,
      data: activities,
      pagination: {
        currentPage: page,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user activity'
    });
  }
});

// Get user's reviews
router.get('/:id/reviews', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({
      user: req.params.id,
      isHidden: false
    })
    .populate('coffeeshop', 'name address.city images rating')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Review.countDocuments({
      user: req.params.id,
      isHidden: false
    });

    res.json({
      success: true,
      data: reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user reviews'
    });
  }
});

// Get user's coffeeshops (if business owner)
router.get('/:id/coffeeshops', async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const skip = (page - 1) * limit;

    // Check if user is a business owner
    const user = await User.findById(req.params.id);
    if (!user || !user.isBusinessOwner) {
      return res.status(404).json({
        success: false,
        message: 'User is not a business owner or not found'
      });
    }

    const coffeeshops = await Coffeeshop.find({
      owner: req.params.id,
      isActive: true
    })
    .populate('owner', 'name avatar isBusinessOwner')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Coffeeshop.countDocuments({
      owner: req.params.id,
      isActive: true
    });

    res.json({
      success: true,
      data: coffeeshops,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get user coffeeshops error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user coffeeshops'
    });
  }
});

// Search users
router.get('/', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  query('search').optional().trim(),
  query('city').optional().trim(),
  query('isBusinessOwner').optional().isBoolean(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 20,
      search,
      city,
      isBusinessOwner
    } = req.query;

    // Build query
    let query = { isActive: true };

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { bio: new RegExp(search, 'i') }
      ];
    }

    if (city) {
      query['location.city'] = new RegExp(city, 'i');
    }

    if (isBusinessOwner !== undefined) {
      query.isBusinessOwner = isBusinessOwner;
    }

    const skip = (page - 1) * limit;

    const users = await User.find(query, {
      name: 1,
      avatar: 1,
      bio: 1,
      location: 1,
      stats: 1,
      isBusinessOwner: 1,
      businessInfo: 1,
      createdAt: 1
    })
    .sort({ 'stats.reviewsCount': -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching users'
    });
  }
});

// Get top contributors/reviewers
router.get('/top/contributors', async (req, res) => {
  try {
    const { limit = 10, timeframe = 'all' } = req.query;

    let matchQuery = { isActive: true };

    // Add time filter if specified
    if (timeframe !== 'all') {
      const now = new Date();
      let startDate;

      switch (timeframe) {
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        matchQuery.lastLoginAt = { $gte: startDate };
      }
    }

    const topUsers = await User.find(matchQuery, {
      name: 1,
      avatar: 1,
      bio: 1,
      location: 1,
      stats: 1,
      isBusinessOwner: 1,
      createdAt: 1
    })
    .sort({
      'stats.reviewsCount': -1,
      'stats.bookmarksCount': -1,
      'stats.followersCount': -1
    })
    .limit(parseInt(limit));

    res.json({
      success: true,
      data: topUsers
    });
  } catch (error) {
    console.error('Get top contributors error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching top contributors'
    });
  }
});

// Get user's favorite vibes and statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's review statistics
    const reviewStats = await Review.aggregate([
      { $match: { user: user._id, isHidden: false } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          totalHelpfulVotes: { $sum: '$helpfulCount' }
        }
      }
    ]);

    // Get user's favorite vibes from their reviews
    const vibeStats = await Review.aggregate([
      { $match: { user: user._id, isHidden: false } },
      {
        $lookup: {
          from: 'coffeeshops',
          localField: 'coffeeshop',
          foreignField: '_id',
          as: 'coffeeshop'
        }
      },
      { $unwind: '$coffeeshop' },
      { $unwind: '$coffeeshop.vibes' },
      {
        $group: {
          _id: '$coffeeshop.vibes',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Get monthly review activity
    const monthlyActivity = await Review.aggregate([
      { $match: { user: user._id, isHidden: false } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    const stats = {
      reviews: reviewStats[0] || { totalReviews: 0, averageRating: 0, totalHelpfulVotes: 0 },
      favoriteVibes: vibeStats,
      monthlyActivity: monthlyActivity,
      memberSince: user.createdAt,
      totalBookmarks: user.stats.bookmarksCount,
      totalFollowers: user.stats.followersCount,
      totalFollowing: user.stats.followingCount
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics'
    });
  }
});

module.exports = router;