const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Coffeeshop = require('../models/Coffeeshop');
const Review = require('../models/Review');
const Bookmark = require('../models/Bookmark');
const { authenticate, optionalAuth, requireBusinessOwner } = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// Validation middleware
const validateCoffeeshop = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('address.street')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Street address is required'),
  body('address.district')
    .trim()
    .isLength({ min: 2 })
    .withMessage('District is required'),
  body('address.city')
    .trim()
    .isLength({ min: 2 })
    .withMessage('City is required'),
  body('location.coordinates')
    .isArray({ min: 2, max: 2 })
    .withMessage('Coordinates must be [longitude, latitude]'),
  body('priceRange')
    .isIn(['$', '$$', '$$$'])
    .withMessage('Price range must be $, $$, or $$$'),
];

// Get all coffeeshops with filtering and search
router.get('/', optionalAuth, [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  query('search').optional().trim(),
  query('city').optional().trim(),
  query('district').optional().trim(),
  query('vibes').optional(),
  query('amenities').optional(),
  query('priceRange').optional(),
  query('minRating').optional().isFloat({ min: 0, max: 5 }).toFloat(),
  query('sortBy').optional().isIn(['rating', 'newest', 'reviews', 'distance']),
  query('latitude').optional().isFloat({ min: -90, max: 90 }).toFloat(),
  query('longitude').optional().isFloat({ min: -180, max: 180 }).toFloat(),
  query('maxDistance').optional().isInt({ min: 1 }).toInt(),
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
      limit = 12,
      search,
      city,
      district,
      vibes,
      amenities,
      priceRange,
      minRating,
      sortBy = 'rating',
      latitude,
      longitude,
      maxDistance = 10
    } = req.query;

    // Build query
    let query = { isActive: true };

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Location filters
    if (city) query['address.city'] = new RegExp(city, 'i');
    if (district) query['address.district'] = new RegExp(district, 'i');

    // Feature filters
    if (vibes) {
      const vibeArray = Array.isArray(vibes) ? vibes : [vibes];
      query.vibes = { $in: vibeArray };
    }

    if (amenities) {
      const amenityArray = Array.isArray(amenities) ? amenities : [amenities];
      query.amenities = { $in: amenityArray };
    }

    if (priceRange) {
      const priceArray = Array.isArray(priceRange) ? priceRange : [priceRange];
      query.priceRange = { $in: priceArray };
    }

    if (minRating) {
      query['rating.average'] = { $gte: minRating };
    }

    // Geospatial query for distance
    if (latitude && longitude) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: maxDistance * 1000 // Convert km to meters
        }
      };
    }

    // Build sort options
    let sort = {};
    switch (sortBy) {
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'reviews':
        sort = { 'rating.count': -1, 'rating.average': -1 };
        break;
      case 'distance':
        // Distance sorting is handled by $near in query
        break;
      case 'rating':
      default:
        sort = { 'rating.average': -1, 'rating.count': -1 };
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    let aggregationPipeline = [
      { $match: query },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'owner',
          foreignField: '_id',
          as: 'ownerInfo',
          pipeline: [{ $project: { name: 1, avatar: 1 } }]
        }
      }
    ];

    // Add user-specific data if authenticated
    if (req.user) {
      aggregationPipeline.push({
        $lookup: {
          from: 'bookmarks',
          let: { coffeeshopId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$coffeeshop', '$$coffeeshopId'] },
                    { $eq: ['$user', req.user._id] }
                  ]
                }
              }
            }
          ],
          as: 'userBookmark'
        }
      });

      aggregationPipeline.push({
        $addFields: {
          isBookmarked: { $gt: [{ $size: '$userBookmark' }, 0] }
        }
      });
    }

    const coffeeshops = await Coffeeshop.aggregate(aggregationPipeline);

    // Get total count for pagination
    const totalQuery = [
      { $match: query },
      { $count: 'total' }
    ];
    const totalResult = await Coffeeshop.aggregate(totalQuery);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: coffeeshops,
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
    console.error('Get coffeeshops error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching coffeeshops'
    });
  }
});

// Get single coffeeshop by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    let aggregationPipeline = [
      { $match: { _id: new mongoose.Types.ObjectId(req.params.id), isActive: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'owner',
          foreignField: '_id',
          as: 'ownerInfo',
          pipeline: [{ $project: { name: 1, avatar: 1, isBusinessOwner: 1 } }]
        }
      }
    ];

    // Add user-specific data if authenticated
    if (req.user) {
      aggregationPipeline.push({
        $lookup: {
          from: 'bookmarks',
          let: { coffeeshopId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$coffeeshop', '$$coffeeshopId'] },
                    { $eq: ['$user', req.user._id] }
                  ]
                }
              }
            }
          ],
          as: 'userBookmark'
        }
      });

      aggregationPipeline.push({
        $addFields: {
          isBookmarked: { $gt: [{ $size: '$userBookmark' }, 0] }
        }
      });
    }

    const result = await Coffeeshop.aggregate(aggregationPipeline);
    const coffeeshop = result[0];

    if (!coffeeshop) {
      return res.status(404).json({
        success: false,
        message: 'Coffeeshop not found'
      });
    }

    // Increment view count
    await Coffeeshop.findByIdAndUpdate(req.params.id, {
      $inc: { 'stats.viewsCount': 1 }
    });

    res.json({
      success: true,
      data: coffeeshop
    });
  } catch (error) {
    console.error('Get coffeeshop error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching coffeeshop'
    });
  }
});

// Create new coffeeshop
router.post('/', authenticate, requireBusinessOwner, validateCoffeeshop, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const coffeeshopData = {
      ...req.body,
      owner: req.user._id,
      verificationStatus: 'pending'
    };

    const coffeeshop = new Coffeeshop(coffeeshopData);
    await coffeeshop.save();

    await coffeeshop.populate('owner', 'name avatar isBusinessOwner');

    res.status(201).json({
      success: true,
      message: 'Coffeeshop created successfully',
      data: coffeeshop
    });
  } catch (error) {
    console.error('Create coffeeshop error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating coffeeshop'
    });
  }
});

// Update coffeeshop
router.put('/:id', authenticate, validateCoffeeshop, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const coffeeshop = await Coffeeshop.findById(req.params.id);

    if (!coffeeshop) {
      return res.status(404).json({
        success: false,
        message: 'Coffeeshop not found'
      });
    }

    // Check ownership
    if (coffeeshop.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own coffeeshops'
      });
    }

    const allowedFields = [
      'name', 'description', 'address', 'location', 'contact', 'hours',
      'images', 'logo', 'vibes', 'amenities', 'specialties', 'priceRange'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedCoffeeshop = await Coffeeshop.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('owner', 'name avatar isBusinessOwner');

    res.json({
      success: true,
      message: 'Coffeeshop updated successfully',
      data: updatedCoffeeshop
    });
  } catch (error) {
    console.error('Update coffeeshop error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating coffeeshop'
    });
  }
});

// Delete coffeeshop (soft delete)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const coffeeshop = await Coffeeshop.findById(req.params.id);

    if (!coffeeshop) {
      return res.status(404).json({
        success: false,
        message: 'Coffeeshop not found'
      });
    }

    // Check ownership
    if (coffeeshop.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own coffeeshops'
      });
    }

    await Coffeeshop.findByIdAndUpdate(req.params.id, { isActive: false });

    res.json({
      success: true,
      message: 'Coffeeshop deleted successfully'
    });
  } catch (error) {
    console.error('Delete coffeeshop error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting coffeeshop'
    });
  }
});

// Get coffeeshops by user
router.get('/user/:userId', async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const skip = (page - 1) * limit;

    const coffeeshops = await Coffeeshop.find({
      owner: req.params.userId,
      isActive: true
    })
    .populate('owner', 'name avatar isBusinessOwner')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Coffeeshop.countDocuments({
      owner: req.params.userId,
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

// Get featured coffeeshops
router.get('/featured/list', optionalAuth, async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    let aggregationPipeline = [
      { $match: { isActive: true, isFeatured: true } },
      { $sort: { 'rating.average': -1, 'rating.count': -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'users',
          localField: 'owner',
          foreignField: '_id',
          as: 'ownerInfo',
          pipeline: [{ $project: { name: 1, avatar: 1 } }]
        }
      }
    ];

    // Add user-specific data if authenticated
    if (req.user) {
      aggregationPipeline.push({
        $lookup: {
          from: 'bookmarks',
          let: { coffeeshopId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$coffeeshop', '$$coffeeshopId'] },
                    { $eq: ['$user', req.user._id] }
                  ]
                }
              }
            }
          ],
          as: 'userBookmark'
        }
      });

      aggregationPipeline.push({
        $addFields: {
          isBookmarked: { $gt: [{ $size: '$userBookmark' }, 0] }
        }
      });
    }

    const featuredCoffeeshops = await Coffeeshop.aggregate(aggregationPipeline);

    res.json({
      success: true,
      data: featuredCoffeeshops
    });
  } catch (error) {
    console.error('Get featured coffeeshops error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured coffeeshops'
    });
  }
});

module.exports = router;