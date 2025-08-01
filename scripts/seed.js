const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Coffeeshop = require('../models/Coffeeshop');
const Review = require('../models/Review');
const Job = require('../models/Job');
const Bookmark = require('../models/Bookmark');

// Sample data
const sampleUsers = [
  {
    name: 'Sarah Kim',
    email: 'sarah@example.com',
    password: 'password123',
    bio: 'Coffee enthusiast and digital nomad from Seoul, living in UB',
    location: {
      city: 'Ulaanbaatar',
      district: 'Sukhbaatar',
      coordinates: [106.9057, 47.9184]
    },
    preferences: {
      favoriteVibes: ['study-friendly', 'cozy'],
      workSchedule: 'morning',
      coffeePreferences: ['latte', 'cappuccino']
    },
    isBusinessOwner: false
  },
  {
    name: 'Bold Batbayar',
    email: 'bold@brucocoffee.mn',
    password: 'password123',
    bio: 'Owner of Bruco Coffee. Passionate about creating spaces for community.',
    location: {
      city: 'Ulaanbaatar',
      district: 'Sukhbaatar',
      coordinates: [106.9157, 47.9284]
    },
    isBusinessOwner: true,
    businessInfo: {
      businessName: 'Bruco Coffee',
      businessType: 'coffeeshop',
      verificationStatus: 'verified'
    }
  },
  {
    name: 'Emma Thompson',
    email: 'emma@example.com',
    password: 'password123',
    bio: 'Student at NUM, love finding quiet places to study',
    location: {
      city: 'Ulaanbaatar',
      district: 'Bayangol',
      coordinates: [106.8757, 47.9084]
    },
    preferences: {
      favoriteVibes: ['quiet', 'study-friendly'],
      workSchedule: 'afternoon',
      coffeePreferences: ['americano', 'cold-brew']
    },
    isBusinessOwner: false
  },
  {
    name: 'Munkh-Erdene',
    email: 'munkh@erdenetcafe.mn',
    password: 'password123',
    bio: 'Running a family cafe in Erdenet for 10 years',
    location: {
      city: 'Erdenet',
      district: 'Center',
      coordinates: [104.0631, 49.0347]
    },
    isBusinessOwner: true,
    businessInfo: {
      businessName: 'Erdenet Family Cafe',
      businessType: 'cafe',
      verificationStatus: 'verified'
    }
  }
];

const sampleCoffeeshops = [
  {
    name: 'Bruco Coffee',
    description: 'A modern coffeeshop in the heart of Ulaanbaatar, perfect for digital nomads and students. We serve specialty coffee and provide a comfortable workspace environment.',
    address: {
      street: 'Peace Avenue 23',
      district: 'Sukhbaatar',
      city: 'Ulaanbaatar',
      province: 'Mongolia'
    },
    location: {
      type: 'Point',
      coordinates: [106.9157, 47.9284]
    },
    contact: {
      phone: '+976-11-123456',
      email: 'hello@bruco.coffee',
      website: 'https://bruco.coffee'
    },
    hours: {
      monday: { open: '07:00', close: '22:00' },
      tuesday: { open: '07:00', close: '22:00' },
      wednesday: { open: '07:00', close: '22:00' },
      thursday: { open: '07:00', close: '22:00' },
      friday: { open: '07:00', close: '23:00' },
      saturday: { open: '08:00', close: '23:00' },
      sunday: { open: '08:00', close: '21:00' }
    },
    vibes: ['study-friendly', 'cozy', 'workspace'],
    amenities: ['wifi', 'power-outlets', 'outdoor-seating'],
    specialties: ['specialty-coffee', 'local-roast', 'pastries'],
    priceRange: '$$',
    verificationStatus: 'verified',
    isFeatured: true
  },
  {
    name: 'Erdenet Family Cafe',
    description: 'Traditional Mongolian cafe serving excellent coffee and local pastries. A warm, family-friendly environment perfect for casual meetings.',
    address: {
      street: 'Baga Toiruu 45',
      district: 'Center',
      city: 'Erdenet',
      province: 'Mongolia'
    },
    location: {
      type: 'Point',
      coordinates: [104.0631, 49.0347]
    },
    contact: {
      phone: '+976-70-234567'
    },
    hours: {
      monday: { open: '06:00', close: '20:00' },
      tuesday: { open: '06:00', close: '20:00' },
      wednesday: { open: '06:00', close: '20:00' },
      thursday: { open: '06:00', close: '20:00' },
      friday: { open: '06:00', close: '21:00' },
      saturday: { open: '07:00', close: '21:00' },
      sunday: { open: '07:00', close: '19:00' }
    },
    vibes: ['traditional', 'family-friendly', 'cozy'],
    amenities: ['wifi', 'parking', 'takeaway'],
    specialties: ['local-roast', 'pastries', 'light-meals'],
    priceRange: '$',
    verificationStatus: 'verified'
  },
  {
    name: 'Green Bean Studio',
    description: 'Hip coffeeshop popular with creatives and freelancers. Known for excellent espresso and artistic atmosphere.',
    address: {
      street: 'Seoul Street 12',
      district: 'Chingeltei',
      city: 'Ulaanbaatar',
      province: 'Mongolia'
    },
    location: {
      type: 'Point',
      coordinates: [106.8957, 47.9384]
    },
    vibes: ['trendy', 'workspace', 'socializing'],
    amenities: ['wifi', 'power-outlets', 'group-seating'],
    specialties: ['specialty-coffee', 'international-coffee'],
    priceRange: '$$',
    verificationStatus: 'pending'
  }
];

const sampleReviews = [
  {
    rating: 5,
    title: 'Perfect study spot!',
    comment: 'Love coming here to study. Great wifi, comfortable seating, and the staff is very friendly. The latte art is beautiful too!',
    visitDate: new Date('2024-01-15'),
    vibeRatings: {
      ambiance: 5,
      service: 5,
      coffeeQuality: 4,
      valueForMoney: 4,
      cleanliness: 5
    },
    tags: ['study-friendly', 'great-coffee', 'friendly-staff'],
    recommendedFor: ['studying', 'working']
  },
  {
    rating: 4,
    title: 'Great coffee, can get busy',
    comment: 'Really good coffee and atmosphere. Sometimes gets quite crowded during peak hours, but that just shows how popular it is!',
    visitDate: new Date('2024-01-10'),
    vibeRatings: {
      ambiance: 4,
      service: 4,
      coffeeQuality: 5,
      valueForMoney: 4,
      cleanliness: 4
    },
    tags: ['great-coffee', 'busy'],
    recommendedFor: ['casual-hangout']
  }
];

const sampleJobs = [
  {
    title: 'Barista',
    description: 'We are looking for an enthusiastic barista to join our team at Bruco Coffee. Experience with espresso machines preferred but we provide training for the right candidate.',
    company: 'Bruco Coffee',
    locations: [
      {
        district: 'Sukhbaatar',
        city: 'Ulaanbaatar',
        address: 'Peace Avenue 23'
      }
    ],
    jobType: 'part-time',
    category: 'barista',
    experience: 'entry-level',
    requirements: [
      'Excellent customer service skills',
      'Ability to work in fast-paced environment',
      'Flexible schedule including weekends'
    ],
    responsibilities: [
      'Prepare coffee and other beverages',
      'Maintain clean work environment',
      'Provide excellent customer service',
      'Handle cash transactions'
    ],
    skills: ['customer-service', 'teamwork', 'communication'],
    salary: {
      type: 'hourly',
      min: 5000,
      max: 8000,
      currency: 'MNT'
    },
    schedule: {
      hoursPerWeek: 25,
      shifts: ['morning', 'afternoon'],
      workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    },
    benefits: ['free-coffee', 'staff-discount', 'flexible-hours', 'training-provided'],
    tags: ['training-provided', 'student-friendly', 'flexible-hours'],
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    contactInfo: {
      email: 'jobs@bruco.coffee',
      phone: '+976-11-123456',
      contactPerson: 'Bold Batbayar',
      preferredContactMethod: 'email'
    },
    applicationInstructions: 'Please send your CV and a brief cover letter explaining why you want to work with us.',
    logo: {
      backgroundColor: '#8B5A2B',
      text: 'B'
    },
    isActive: true,
    isFeatured: true
  }
];

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coffeeshop-discovery');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

async function clearDatabase() {
  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Coffeeshop.deleteMany({}),
    Review.deleteMany({}),
    Job.deleteMany({}),
    Bookmark.deleteMany({})
  ]);
  console.log('Database cleared');
}

async function seedUsers() {
  console.log('Seeding users...');
  const users = [];
  
  for (const userData of sampleUsers) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const user = new User({
      ...userData,
      password: hashedPassword
    });
    await user.save();
    users.push(user);
  }
  
  console.log(`Created ${users.length} users`);
  return users;
}

async function seedCoffeeshops(users) {
  console.log('Seeding coffeeshops...');
  const coffeeshops = [];
  
  // Assign owners to coffeeshops
  const businessOwners = users.filter(user => user.isBusinessOwner);
  
  for (let i = 0; i < sampleCoffeeshops.length; i++) {
    const coffeeshopData = sampleCoffeeshops[i];
    const owner = businessOwners[i % businessOwners.length];
    
    const coffeeshop = new Coffeeshop({
      ...coffeeshopData,
      owner: owner._id
    });
    await coffeeshop.save();
    coffeeshops.push(coffeeshop);
  }
  
  console.log(`Created ${coffeeshops.length} coffeeshops`);
  return coffeeshops;
}

async function seedReviews(users, coffeeshops) {
  console.log('Seeding reviews...');
  const reviews = [];
  
  // Create reviews from non-business users
  const reviewers = users.filter(user => !user.isBusinessOwner);
  
  for (let i = 0; i < sampleReviews.length; i++) {
    const reviewData = sampleReviews[i];
    const reviewer = reviewers[i % reviewers.length];
    const coffeeshop = coffeeshops[0]; // Review for first coffeeshop
    
    const review = new Review({
      ...reviewData,
      user: reviewer._id,
      coffeeshop: coffeeshop._id
    });
    await review.save();
    reviews.push(review);
  }
  
  console.log(`Created ${reviews.length} reviews`);
  return reviews;
}

async function seedJobs(users, coffeeshops) {
  console.log('Seeding jobs...');
  const jobs = [];
  
  const businessOwners = users.filter(user => user.isBusinessOwner);
  
  for (let i = 0; i < sampleJobs.length; i++) {
    const jobData = sampleJobs[i];
    const owner = businessOwners[0]; // Posted by first business owner
    const coffeeshop = coffeeshops[0]; // Job at first coffeeshop
    
    const job = new Job({
      ...jobData,
      postedBy: owner._id,
      coffeeshop: coffeeshop._id
    });
    await job.save();
    jobs.push(job);
  }
  
  console.log(`Created ${jobs.length} jobs`);
  return jobs;
}

async function seedBookmarks(users, coffeeshops) {
  console.log('Seeding bookmarks...');
  const bookmarks = [];
  
  // Create some bookmarks for non-business users
  const regularUsers = users.filter(user => !user.isBusinessOwner);
  
  for (const user of regularUsers) {
    for (let i = 0; i < Math.min(2, coffeeshops.length); i++) {
      const bookmark = new Bookmark({
        user: user._id,
        coffeeshop: coffeeshops[i]._id,
        collection: i === 0 ? 'favorites' : 'study-spots',
        notes: `Great place for ${i === 0 ? 'hanging out' : 'studying'}`
      });
      await bookmark.save();
      bookmarks.push(bookmark);
    }
  }
  
  console.log(`Created ${bookmarks.length} bookmarks`);
  return bookmarks;
}

async function updateStats() {
  console.log('Updating statistics...');
  
  // Update user stats
  const users = await User.find({});
  for (const user of users) {
    const reviewsCount = await Review.countDocuments({ user: user._id, isHidden: false });
    const bookmarksCount = await Bookmark.countDocuments({ user: user._id });
    
    await User.findByIdAndUpdate(user._id, {
      'stats.reviewsCount': reviewsCount,
      'stats.bookmarksCount': bookmarksCount
    });
  }
  
  // Update coffeeshop stats
  const coffeeshops = await Coffeeshop.find({});
  for (const coffeeshop of coffeeshops) {
    const reviews = await Review.find({ coffeeshop: coffeeshop._id, isHidden: false });
    const reviewsCount = reviews.length;
    const averageRating = reviewsCount > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewsCount 
      : 0;
    const bookmarksCount = await Bookmark.countDocuments({ coffeeshop: coffeeshop._id });
    
    await Coffeeshop.findByIdAndUpdate(coffeeshop._id, {
      'rating.average': Math.round(averageRating * 10) / 10,
      'rating.count': reviewsCount,
      'stats.reviewsCount': reviewsCount,
      'stats.bookmarksCount': bookmarksCount
    });
  }
  
  console.log('Statistics updated');
}

async function seedDatabase() {
  try {
    await connectDB();
    await clearDatabase();
    
    const users = await seedUsers();
    const coffeeshops = await seedCoffeeshops(users);
    const reviews = await seedReviews(users, coffeeshops);
    const jobs = await seedJobs(users, coffeeshops);
    const bookmarks = await seedBookmarks(users, coffeeshops);
    
    await updateStats();
    
    console.log('\n🎉 Database seeded successfully!');
    console.log('\nSample login credentials:');
    console.log('Regular User - Email: sarah@example.com, Password: password123');
    console.log('Business Owner - Email: bold@brucocoffee.mn, Password: password123');
    
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;