const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Coffeeshop = require('../models/Coffeeshop');
const { authenticate, optionalAuth } = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// Validation middleware
const validateReview = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Comment must be between 10 and 1000 characters'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  body('visitDate')
    .isISO8601()
    .withMessage('Visit date must be a valid date'),
  body('vibeRatings.ambiance')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Ambiance rating must be between 1 and 5'),
  body('vibeRatings.service')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Service rating must be between 1 and 5'),
  body('vibeRatings.coffeeQuality')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Coffee quality rating must be between 1 and 5'),
  body('vibeRatings.valueForMoney')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Value for money rating must be between 1 and 5'),
  body('vibeRatings.cleanliness')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Cleanliness rating must be between 1 and 5'),
];

// Get reviews for a coffeeshop
router.get('/coffeeshop/:coffeeshopId', optionalAuth, [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 20 }).toInt(),
  query('sortBy').optional().isIn(['newest', 'oldest', 'rating-high', 'rating-low', 'helpful']),
  query('rating').optional().isInt({ min: 1, max: 5 }).toInt(),
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
      sortBy = 'newest',
      rating
    } = req.query;

    // Build query
    let query = {
      coffeeshop: req.params.coffeeshopId,
      isHidden: false
    };

    if (rating) {
      query.rating = rating;
    }

    // Build sort options
    let sort = {};
    switch (sortBy) {
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      case 'rating-high':
        sort = { rating: -1, createdAt: -1 };
        break;
      case 'rating-low':
        sort = { rating: 1, createdAt: -1 };
        break;
      case 'helpful':
        sort = { helpfulCount: -1, createdAt: -1 };
        break;
      case 'newest':
      default:
        sort = { createdAt: -1 };
    }

    const skip = (page - 1) * limit;

    // Aggregation pipeline
    let aggregationPipeline = [
      { $match: query },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo',
          pipeline: [
            { $project: { name: 1, avatar: 1, stats: 1 } }
          ]
        }
      },
      {
        $addFields: {
          userInfo: { $arrayElemAt: ['$userInfo', 0] }
        }
      }
    ];

    // Add user-specific data if authenticated
    if (req.user) {
      aggregationPipeline.push({
        $addFields: {
          isHelpfulToCurrentUser: {
            $in: [req.user._id, '$helpfulVotes.user']
          },
          isOwnReview: { $eq: ['$user', req.user._id] }
        }
      });
    }

    const reviews = await Review.aggregate(aggregationPipeline);

    // Get total count for pagination
    const total = await Review.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: reviews,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews'
    });
  }
});

// Get single review by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    let aggregationPipeline = [
      { $match: { _id: new mongoose.Types.ObjectId(req.params.id), isHidden: false } },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo',
          pipeline: [
            { $project: { name: 1, avatar: 1, stats: 1 } }
          ]
        }
      },
      {
        $lookup: {
          from: 'coffeeshops',
          localField: 'coffeeshop',
          foreignField: '_id',
          as: 'coffeeshopInfo',
          pipeline: [
            { $project: { name: 1, address: 1, images: 1 } }
          ]
        }
      },
      {
        $addFields: {
          userInfo: { $arrayElemAt: ['$userInfo', 0] },
          coffeeshopInfo: { $arrayElemAt: ['$coffeeshopInfo', 0] }
        }
      }
    ];

    // Add user-specific data if authenticated
    if (req.user) {
      aggregationPipeline.push({
        $addFields: {
          isHelpfulToCurrentUser: {
            $in: [req.user._id, '$helpfulVotes.user']
          },
          isOwnReview: { $eq: ['$user', req.user._id] }
        }
      });
    }

    const result = await Review.aggregate(aggregationPipeline);
    const review = result[0];

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching review'
    });
  }
});

// Create new review
router.post('/', authenticate, validateReview, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { coffeeshop } = req.body;

    // Check if coffeeshop exists
    const coffeeshopExists = await Coffeeshop.findById(coffeeshop);
    if (!coffeeshopExists) {
      return res.status(404).json({
        success: false,
        message: 'Coffeeshop not found'
      });
    }

    // Check if user already reviewed this coffeeshop
    const existingReview = await Review.findOne({
      user: req.user._id,
      coffeeshop: coffeeshop
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this coffeeshop'
      });
    }

    // Create review
    const reviewData = {
      ...req.body,
      user: req.user._id
    };

    const review = new Review(reviewData);
    await review.save();

    // Populate user info
    await review.populate('user', 'name avatar stats');

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating review'
    });
  }
});

// Update review
router.put('/:id', authenticate, validateReview, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check ownership
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own reviews'
      });
    }

    const allowedFields = [
      'rating', 'title', 'comment', 'images', 'visitDate',
      'vibeRatings', 'tags', 'recommendedFor'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('user', 'name avatar stats');

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: updatedReview
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating review'
    });
  }
});

// Delete review
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check ownership
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own reviews'
      });
    }

    await Review.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting review'
    });
  }
});

// Mark review as helpful
router.post('/:id/helpful', authenticate, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user already marked this review as helpful
    const alreadyHelpful = review.helpfulVotes.some(
      vote => vote.user.toString() === req.user._id.toString()
    );

    if (alreadyHelpful) {
      // Remove helpful vote
      review.helpfulVotes = review.helpfulVotes.filter(
        vote => vote.user.toString() !== req.user._id.toString()
      );
      review.helpfulCount = Math.max(0, review.helpfulCount - 1);
    } else {
      // Add helpful vote
      review.helpfulVotes.push({
        user: req.user._id,
        votedAt: new Date()
      });
      review.helpfulCount += 1;
    }

    await review.save();

    res.json({
      success: true,
      message: alreadyHelpful ? 'Helpful vote removed' : 'Review marked as helpful',
      data: {
        helpfulCount: review.helpfulCount,
        isHelpful: !alreadyHelpful
      }
    });
  } catch (error) {
    console.error('Toggle helpful error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling helpful status'
    });
  }
});

// Add reply to review
router.post('/:id/replies', authenticate, [
  body('message')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Reply message must be between 1 and 500 characters')
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

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    const reply = {
      user: req.user._id,
      message: req.body.message,
      createdAt: new Date()
    };

    review.replies.push(reply);
    await review.save();

    // Populate the new reply with user info
    await review.populate('replies.user', 'name avatar');

    res.status(201).json({
      success: true,
      message: 'Reply added successfully',
      data: reply
    });
  } catch (error) {
    console.error('Add reply error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding reply'
    });
  }
});

// Report review
router.post('/:id/report', authenticate, [
  body('reason')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Report reason must be between 10 and 500 characters')
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

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user already reported this review
    const alreadyReported = review.reportedBy.some(
      report => report.user.toString() === req.user._id.toString()
    );

    if (alreadyReported) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this review'
      });
    }

    const report = {
      user: req.user._id,
      reason: req.body.reason,
      reportedAt: new Date()
    };

    review.reportedBy.push(report);
    await review.save();

    res.json({
      success: true,
      message: 'Review reported successfully'
    });
  } catch (error) {
    console.error('Report review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reporting review'
    });
  }
});

// Get user's reviews
router.get('/user/:userId', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({
      user: req.params.userId,
      isHidden: false
    })
    .populate('coffeeshop', 'name address.city images rating')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Review.countDocuments({
      user: req.params.userId,
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

module.exports = router;