const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Bookmark = require('../models/Bookmark');
const Coffeeshop = require('../models/Coffeeshop');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get user's bookmarks
router.get('/', authenticate, [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  query('collection').optional().trim(),
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
      collection
    } = req.query;

    // Build query
    let query = { user: req.user._id };

    if (collection) {
      query.collection = collection;
    }

    const skip = (page - 1) * limit;

    // Get bookmarks with populated coffeeshop data
    const bookmarks = await Bookmark.find(query)
      .populate({
        path: 'coffeeshop',
        match: { isActive: true },
        select: 'name description address location images logo vibes rating stats priceRange',
        populate: {
          path: 'owner',
          select: 'name avatar'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Filter out bookmarks where coffeeshop was not found (inactive)
    const validBookmarks = bookmarks.filter(bookmark => bookmark.coffeeshop);

    // Get total count
    const total = await Bookmark.countDocuments(query);

    // Get collections summary
    const collections = await Bookmark.aggregate([
      { $match: { user: req.user._id } },
      {
        $lookup: {
          from: 'coffeeshops',
          localField: 'coffeeshop',
          foreignField: '_id',
          as: 'coffeeshop'
        }
      },
      {
        $match: {
          'coffeeshop.isActive': true
        }
      },
      {
        $group: {
          _id: '$collection',
          count: { $sum: 1 },
          customName: { $first: '$customCollectionName' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: validBookmarks,
      collections: collections,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookmarks'
    });
  }
});

// Add/Remove bookmark (toggle)
router.post('/toggle', authenticate, [
  body('coffeeshopId')
    .isMongoId()
    .withMessage('Valid coffeeshop ID is required'),
  body('collection')
    .optional()
    .isIn(['favorites', 'want-to-visit', 'study-spots', 'date-places', 'work-friendly', 'custom'])
    .withMessage('Invalid collection type'),
  body('customCollectionName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Collection name cannot exceed 50 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
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
      coffeeshopId,
      collection = 'favorites',
      customCollectionName,
      notes,
      isPrivate = false
    } = req.body;

    // Check if coffeeshop exists
    const coffeeshop = await Coffeeshop.findById(coffeeshopId);
    if (!coffeeshop || !coffeeshop.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Coffeeshop not found'
      });
    }

    // Check if bookmark already exists for this collection
    const existingBookmark = await Bookmark.findOne({
      user: req.user._id,
      coffeeshop: coffeeshopId,
      collection: collection
    });

    if (existingBookmark) {
      // Remove bookmark
      await Bookmark.findByIdAndDelete(existingBookmark._id);

      res.json({
        success: true,
        message: 'Bookmark removed successfully',
        isBookmarked: false
      });
    } else {
      // Add bookmark
      const bookmarkData = {
        user: req.user._id,
        coffeeshop: coffeeshopId,
        collection,
        notes,
        isPrivate
      };

      if (collection === 'custom' && customCollectionName) {
        bookmarkData.customCollectionName = customCollectionName;
      }

      const bookmark = new Bookmark(bookmarkData);
      await bookmark.save();

      await bookmark.populate('coffeeshop', 'name address.city images rating');

      res.status(201).json({
        success: true,
        message: 'Bookmark added successfully',
        isBookmarked: true,
        data: bookmark
      });
    }
  } catch (error) {
    console.error('Toggle bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling bookmark'
    });
  }
});

// Update bookmark
router.put('/:id', authenticate, [
  body('collection')
    .optional()
    .isIn(['favorites', 'want-to-visit', 'study-spots', 'date-places', 'work-friendly', 'custom'])
    .withMessage('Invalid collection type'),
  body('customCollectionName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Collection name cannot exceed 50 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
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

    const bookmark = await Bookmark.findById(req.params.id);

    if (!bookmark) {
      return res.status(404).json({
        success: false,
        message: 'Bookmark not found'
      });
    }

    // Check ownership
    if (bookmark.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own bookmarks'
      });
    }

    const allowedFields = ['collection', 'customCollectionName', 'notes', 'isPrivate'];
    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedBookmark = await Bookmark.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('coffeeshop', 'name address.city images rating');

    res.json({
      success: true,
      message: 'Bookmark updated successfully',
      data: updatedBookmark
    });
  } catch (error) {
    console.error('Update bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating bookmark'
    });
  }
});

// Delete bookmark
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const bookmark = await Bookmark.findById(req.params.id);

    if (!bookmark) {
      return res.status(404).json({
        success: false,
        message: 'Bookmark not found'
      });
    }

    // Check ownership
    if (bookmark.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own bookmarks'
      });
    }

    await Bookmark.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Bookmark deleted successfully'
    });
  } catch (error) {
    console.error('Delete bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting bookmark'
    });
  }
});

// Check if coffeeshop is bookmarked
router.get('/check/:coffeeshopId', authenticate, async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({
      user: req.user._id,
      coffeeshop: req.params.coffeeshopId
    }).select('collection customCollectionName');

    const isBookmarked = bookmarks.length > 0;
    const collections = bookmarks.map(b => ({
      collection: b.collection,
      customName: b.customCollectionName
    }));

    res.json({
      success: true,
      isBookmarked,
      collections
    });
  } catch (error) {
    console.error('Check bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking bookmark status'
    });
  }
});

// Get user's bookmark collections
router.get('/collections', authenticate, async (req, res) => {
  try {
    const collections = await Bookmark.aggregate([
      { $match: { user: req.user._id } },
      {
        $lookup: {
          from: 'coffeeshops',
          localField: 'coffeeshop',
          foreignField: '_id',
          as: 'coffeeshop'
        }
      },
      {
        $match: {
          'coffeeshop.isActive': true
        }
      },
      {
        $group: {
          _id: '$collection',
          count: { $sum: 1 },
          customName: { $first: '$customCollectionName' },
          lastUpdated: { $max: '$createdAt' },
          coffeeshops: {
            $push: {
              _id: { $arrayElemAt: ['$coffeeshop._id', 0] },
              name: { $arrayElemAt: ['$coffeeshop.name', 0] },
              image: { 
                $arrayElemAt: [
                  { $arrayElemAt: ['$coffeeshop.images.url', 0] }, 
                  0
                ]
              }
            }
          }
        }
      },
      {
        $addFields: {
          displayName: {
            $cond: {
              if: { $eq: ['$_id', 'custom'] },
              then: '$customName',
              else: {
                $switch: {
                  branches: [
                    { case: { $eq: ['$_id', 'favorites'] }, then: 'Favorites' },
                    { case: { $eq: ['$_id', 'want-to-visit'] }, then: 'Want to Visit' },
                    { case: { $eq: ['$_id', 'study-spots'] }, then: 'Study Spots' },
                    { case: { $eq: ['$_id', 'date-places'] }, then: 'Date Places' },
                    { case: { $eq: ['$_id', 'work-friendly'] }, then: 'Work Friendly' }
                  ],
                  default: '$_id'
                }
              }
            }
          },
          preview: { $slice: ['$coffeeshops', 3] }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: collections
    });
  } catch (error) {
    console.error('Get collections error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching collections'
    });
  }
});

// Share bookmark collection
router.get('/share/:collectionId', async (req, res) => {
  try {
    const { collectionId } = req.params;
    
    // Find bookmarks in the collection
    const bookmarks = await Bookmark.find({
      $or: [
        { collection: collectionId },
        { customCollectionName: collectionId }
      ],
      isPrivate: false
    })
    .populate('coffeeshop', 'name description address images rating stats vibes')
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 });

    if (bookmarks.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found or is private'
      });
    }

    // Filter out inactive coffeeshops
    const validBookmarks = bookmarks.filter(bookmark => 
      bookmark.coffeeshop && bookmark.coffeeshop.isActive
    );

    const collection = {
      name: bookmarks[0].collection === 'custom' 
        ? bookmarks[0].customCollectionName 
        : bookmarks[0].collection,
      owner: bookmarks[0].user,
      coffeeshops: validBookmarks.map(b => b.coffeeshop),
      count: validBookmarks.length,
      createdAt: bookmarks[0].createdAt
    };

    res.json({
      success: true,
      data: collection
    });
  } catch (error) {
    console.error('Share collection error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sharing collection'
    });
  }
});

module.exports = router;