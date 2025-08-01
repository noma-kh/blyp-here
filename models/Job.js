const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  coffeeshop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coffeeshop',
    required: true
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  locations: [{
    district: { type: String, required: true },
    city: { type: String, required: true },
    address: String
  }],
  jobType: {
    type: String,
    required: true,
    enum: ['full-time', 'part-time', 'casual', 'internship', 'contract']
  },
  category: {
    type: String,
    required: true,
    enum: ['barista', 'manager', 'supervisor', 'kitchen-staff', 'server', 'cleaner', 'cashier', 'other']
  },
  experience: {
    type: String,
    enum: ['entry-level', '1-2-years', '3-5-years', '5+-years'],
    default: 'entry-level'
  },
  requirements: [{
    type: String,
    maxlength: [200, 'Requirement cannot exceed 200 characters']
  }],
  responsibilities: [{
    type: String,
    maxlength: [200, 'Responsibility cannot exceed 200 characters']
  }],
  skills: [{
    type: String,
    enum: ['coffee-knowledge', 'customer-service', 'cash-handling', 'food-prep', 'cleaning', 'teamwork', 'communication', 'multitasking', 'time-management']
  }],
  salary: {
    type: {
      type: String,
      enum: ['hourly', 'weekly', 'monthly', 'annual', 'negotiable'],
      default: 'hourly'
    },
    min: Number,
    max: Number,
    currency: { type: String, default: 'MNT' },
    isNegotiable: { type: Boolean, default: false }
  },
  schedule: {
    hoursPerWeek: { type: Number, min: 0, max: 60 },
    shifts: [{
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night', 'weekend', 'weekday', 'flexible']
    }],
    workDays: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }]
  },
  benefits: [{
    type: String,
    enum: ['free-coffee', 'staff-discount', 'flexible-hours', 'training-provided', 'career-growth', 'meal-allowance', 'transport-allowance', 'insurance']
  }],
  tags: [{
    type: String,
    enum: ['urgent', 'immediate-start', 'training-provided', 'no-experience', 'student-friendly', 'weekend-work', 'flexible-hours']
  }],
  applicationDeadline: {
    type: Date,
    required: true
  },
  contactInfo: {
    email: { type: String, required: true },
    phone: String,
    contactPerson: String,
    preferredContactMethod: {
      type: String,
      enum: ['email', 'phone', 'in-person'],
      default: 'email'
    }
  },
  applicationInstructions: {
    type: String,
    maxlength: [500, 'Instructions cannot exceed 500 characters']
  },
  logo: {
    url: String,
    backgroundColor: { type: String, default: '#8B5A2B' },
    text: String
  },
  stats: {
    viewsCount: { type: Number, default: 0 },
    applicationsCount: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isUrgent: {
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

// Indexes for efficient queries
jobSchema.index({ coffeeshop: 1, isActive: 1, createdAt: -1 });
jobSchema.index({ jobType: 1, category: 1, isActive: 1 });
jobSchema.index({ 'locations.city': 1, isActive: 1, createdAt: -1 });
jobSchema.index({ applicationDeadline: 1, isActive: 1 });
jobSchema.index({ postedBy: 1, createdAt: -1 });

// Text index for search
jobSchema.index({
  title: 'text',
  description: 'text',
  company: 'text',
  skills: 'text'
});

// Pre-save middleware to update updatedAt
jobSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual to check if job is expired
jobSchema.virtual('isExpired').get(function() {
  return new Date() > this.applicationDeadline;
});

// Virtual for formatted salary range
jobSchema.virtual('formattedSalary').get(function() {
  if (!this.salary.min && !this.salary.max) return 'Negotiable';
  if (this.salary.isNegotiable) return 'Negotiable';
  
  const min = this.salary.min ? this.salary.min.toLocaleString() : '';
  const max = this.salary.max ? this.salary.max.toLocaleString() : '';
  const currency = this.salary.currency;
  
  if (min && max) {
    return `${min} - ${max} ${currency} ${this.salary.type}`;
  } else if (min) {
    return `From ${min} ${currency} ${this.salary.type}`;
  } else if (max) {
    return `Up to ${max} ${currency} ${this.salary.type}`;
  }
  return 'Negotiable';
});

// Method to check if user can edit this job
jobSchema.methods.canBeEditedBy = function(userId) {
  return this.postedBy.toString() === userId.toString();
};

module.exports = mongoose.model('Job', jobSchema);