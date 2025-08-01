const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Job = require('../models/Job');
const Coffeeshop = require('../models/Coffeeshop');
const { authenticate, optionalAuth, requireBusinessOwner } = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// Validation middleware
const validateJob = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Title must be between 2 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('company')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
  body('coffeeshop')
    .isMongoId()
    .withMessage('Valid coffeeshop ID is required'),
  body('jobType')
    .isIn(['full-time', 'part-time', 'casual', 'internship', 'contract'])
    .withMessage('Invalid job type'),
  body('category')
    .isIn(['barista', 'manager', 'supervisor', 'kitchen-staff', 'server', 'cleaner', 'cashier', 'other'])
    .withMessage('Invalid job category'),
  body('applicationDeadline')
    .isISO8601()
    .withMessage('Application deadline must be a valid date'),
  body('contactInfo.email')
    .isEmail()
    .withMessage('Valid contact email is required'),
];

// Get all jobs with filtering
router.get('/', optionalAuth, [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  query('search').optional().trim(),
  query('city').optional().trim(),
  query('jobType').optional(),
  query('category').optional(),
  query('experience').optional(),
  query('sortBy').optional().isIn(['newest', 'deadline', 'salary', 'featured']),
  query('isActive').optional().isBoolean(),
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
      jobType,
      category,
      experience,
      sortBy = 'newest',
      isActive = true
    } = req.query;

    // Build query
    let query = { 
      isActive: isActive,
      applicationDeadline: { $gte: new Date() } // Only show non-expired jobs
    };

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Location filter
    if (city) {
      query['locations.city'] = new RegExp(city, 'i');
    }

    // Job filters
    if (jobType) {
      const typeArray = Array.isArray(jobType) ? jobType : [jobType];
      query.jobType = { $in: typeArray };
    }

    if (category) {
      const categoryArray = Array.isArray(category) ? category : [category];
      query.category = { $in: categoryArray };
    }

    if (experience) {
      query.experience = experience;
    }

    // Build sort options
    let sort = {};
    switch (sortBy) {
      case 'deadline':
        sort = { applicationDeadline: 1 };
        break;
      case 'salary':
        sort = { 'salary.min': -1 };
        break;
      case 'featured':
        sort = { isFeatured: -1, isUrgent: -1, createdAt: -1 };
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
          from: 'coffeeshops',
          localField: 'coffeeshop',
          foreignField: '_id',
          as: 'coffeeshopInfo',
          pipeline: [
            { $project: { name: 1, address: 1, rating: 1, images: 1 } }
          ]
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'postedBy',
          foreignField: '_id',
          as: 'posterInfo',
          pipeline: [
            { $project: { name: 1, avatar: 1, isBusinessOwner: 1 } }
          ]
        }
      },
      {
        $addFields: {
          coffeeshopInfo: { $arrayElemAt: ['$coffeeshopInfo', 0] },
          posterInfo: { $arrayElemAt: ['$posterInfo', 0] },
          isExpired: { $lt: ['$applicationDeadline', new Date()] }
        }
      }
    ];

    const jobs = await Job.aggregate(aggregationPipeline);

    // Get total count for pagination
    const totalQuery = [
      { $match: query },
      { $count: 'total' }
    ];
    const totalResult = await Job.aggregate(totalQuery);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: jobs,
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
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching jobs'
    });
  }
});

// Get single job by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    let aggregationPipeline = [
      { $match: { _id: new mongoose.Types.ObjectId(req.params.id) } },
      {
        $lookup: {
          from: 'coffeeshops',
          localField: 'coffeeshop',
          foreignField: '_id',
          as: 'coffeeshopInfo'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'postedBy',
          foreignField: '_id',
          as: 'posterInfo',
          pipeline: [
            { $project: { name: 1, avatar: 1, isBusinessOwner: 1, businessInfo: 1 } }
          ]
        }
      },
      {
        $addFields: {
          coffeeshopInfo: { $arrayElemAt: ['$coffeeshopInfo', 0] },
          posterInfo: { $arrayElemAt: ['$posterInfo', 0] },
          isExpired: { $lt: ['$applicationDeadline', new Date()] },
          canEdit: req.user ? { $eq: ['$postedBy', req.user._id] } : false
        }
      }
    ];

    const result = await Job.aggregate(aggregationPipeline);
    const job = result[0];

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Increment view count
    await Job.findByIdAndUpdate(req.params.id, {
      $inc: { 'stats.viewsCount': 1 }
    });

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job'
    });
  }
});

// Create new job
router.post('/', authenticate, requireBusinessOwner, validateJob, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if user owns the coffeeshop
    const coffeeshop = await Coffeeshop.findById(req.body.coffeeshop);
    if (!coffeeshop) {
      return res.status(404).json({
        success: false,
        message: 'Coffeeshop not found'
      });
    }

    if (coffeeshop.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only post jobs for your own coffeeshops'
      });
    }

    const jobData = {
      ...req.body,
      postedBy: req.user._id
    };

    const job = new Job(jobData);
    await job.save();

    await job.populate([
      { path: 'coffeeshop', select: 'name address rating' },
      { path: 'postedBy', select: 'name avatar isBusinessOwner' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Job posted successfully',
      data: job
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating job'
    });
  }
});

// Update job
router.put('/:id', authenticate, validateJob, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check ownership
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own job postings'
      });
    }

    const allowedFields = [
      'title', 'description', 'company', 'locations', 'jobType', 'category',
      'experience', 'requirements', 'responsibilities', 'skills', 'salary',
      'schedule', 'benefits', 'tags', 'applicationDeadline', 'contactInfo',
      'applicationInstructions', 'logo'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate([
      { path: 'coffeeshop', select: 'name address rating' },
      { path: 'postedBy', select: 'name avatar isBusinessOwner' }
    ]);

    res.json({
      success: true,
      message: 'Job updated successfully',
      data: updatedJob
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating job'
    });
  }
});

// Delete job (soft delete)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check ownership
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own job postings'
      });
    }

    await Job.findByIdAndUpdate(req.params.id, { isActive: false });

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting job'
    });
  }
});

// Get jobs by coffeeshop
router.get('/coffeeshop/:coffeeshopId', async (req, res) => {
  try {
    const { page = 1, limit = 10, includeExpired = false } = req.query;
    const skip = (page - 1) * limit;

    let query = {
      coffeeshop: req.params.coffeeshopId,
      isActive: true
    };

    if (!includeExpired) {
      query.applicationDeadline = { $gte: new Date() };
    }

    const jobs = await Job.find(query)
      .populate('postedBy', 'name avatar isBusinessOwner')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments(query);

    res.json({
      success: true,
      data: jobs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get coffeeshop jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching coffeeshop jobs'
    });
  }
});

// Get user's posted jobs
router.get('/user/posted', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, includeInactive = false } = req.query;
    const skip = (page - 1) * limit;

    let query = { postedBy: req.user._id };

    if (!includeInactive) {
      query.isActive = true;
    }

    const jobs = await Job.find(query)
      .populate('coffeeshop', 'name address rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments(query);

    // Add expired status
    const jobsWithStatus = jobs.map(job => ({
      ...job.toObject(),
      isExpired: new Date() > job.applicationDeadline
    }));

    res.json({
      success: true,
      data: jobsWithStatus,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get user jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user jobs'
    });
  }
});

// Get featured/urgent jobs
router.get('/featured/list', async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const jobs = await Job.find({
      isActive: true,
      applicationDeadline: { $gte: new Date() },
      $or: [{ isFeatured: true }, { isUrgent: true }]
    })
    .populate('coffeeshop', 'name address rating images')
    .populate('postedBy', 'name avatar')
    .sort({ isFeatured: -1, isUrgent: -1, createdAt: -1 })
    .limit(parseInt(limit));

    res.json({
      success: true,
      data: jobs
    });
  } catch (error) {
    console.error('Get featured jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured jobs'
    });
  }
});

// Search job skills and categories
router.get('/meta/options', async (req, res) => {
  try {
    const skillsEnum = Job.schema.path('skills').enumValues;
    const categoriesEnum = Job.schema.path('category').enumValues;
    const jobTypesEnum = Job.schema.path('jobType').enumValues;
    const experienceEnum = Job.schema.path('experience').enumValues;

    // Get unique cities from job locations
    const cities = await Job.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$locations' },
      { $group: { _id: '$locations.city' } },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        skills: skillsEnum,
        categories: categoriesEnum,
        jobTypes: jobTypesEnum,
        experienceLevels: experienceEnum,
        cities: cities.map(c => c._id)
      }
    });
  } catch (error) {
    console.error('Get job options error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job options'
    });
  }
});

module.exports = router;