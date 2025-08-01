# Coffeeshop Discovery Backend API

A comprehensive backend API for a youth-oriented coffeeshop discovery platform in Mongolia. Built with Node.js, Express, and MongoDB, featuring geolocation-based search, user reviews, job postings, and community features.

## 🚀 Features

### Core Features
- **User Authentication** - JWT-based auth with registration, login, and profile management
- **Coffeeshop Management** - CRUD operations with geolocation support
- **Reviews & Ratings** - Comprehensive review system with helpful votes and replies
- **Bookmark System** - Save coffeeshops to custom collections
- **Job Board** - Post and browse job opportunities at coffeeshops
- **Search & Filtering** - Advanced search with location, vibes, and amenities

### Technical Features
- **Geospatial Queries** - MongoDB 2dsphere indexing for location-based search
- **Image Upload** - Cloudinary integration for image management
- **Data Validation** - Comprehensive input validation with express-validator
- **Security** - Rate limiting, CORS, helmet, and input sanitization
- **Scalable Architecture** - Modular design with proper separation of concerns

## 📋 Prerequisites

- Node.js 16+ 
- MongoDB 4.4+
- Cloudinary account (for image uploads)

## 🛠 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd coffeeshop-discovery-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/coffeeshop-discovery
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

4. **Start the server**
```bash
# Development
npm run dev

# Production
npm start
```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "isBusinessOwner": false
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Coffeeshop Endpoints

#### Get All Coffeeshops
```http
GET /api/coffeeshops
Query Parameters:
- page: number (default: 1)
- limit: number (default: 12)
- search: string
- city: string
- vibes: array
- latitude: number
- longitude: number
- maxDistance: number (km)
- sortBy: "rating" | "newest" | "reviews" | "distance"
```

#### Get Single Coffeeshop
```http
GET /api/coffeeshops/:id
```

#### Create Coffeeshop (Business Owner Only)
```http
POST /api/coffeeshops
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Bruco Coffee",
  "description": "A cozy coffee shop perfect for studying",
  "address": {
    "street": "123 Main St",
    "district": "Sukhbaatar",
    "city": "Ulaanbaatar"
  },
  "location": {
    "coordinates": [106.9057, 47.9184]
  },
  "vibes": ["study-friendly", "cozy"],
  "amenities": ["wifi", "power-outlets"],
  "priceRange": "$$"
}
```

### Review Endpoints

#### Get Reviews for Coffeeshop
```http
GET /api/reviews/coffeeshop/:coffeeshopId
Query Parameters:
- page: number
- limit: number
- sortBy: "newest" | "oldest" | "rating-high" | "rating-low" | "helpful"
```

#### Create Review
```http
POST /api/reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "coffeeshop": "coffeeshop_id",
  "rating": 5,
  "title": "Amazing coffee!",
  "comment": "Great atmosphere for studying...",
  "visitDate": "2024-01-15",
  "vibeRatings": {
    "ambiance": 5,
    "service": 4,
    "coffeeQuality": 5
  },
  "tags": ["great-coffee", "study-friendly"]
}
```

#### Mark Review as Helpful
```http
POST /api/reviews/:id/helpful
Authorization: Bearer <token>
```

### Bookmark Endpoints

#### Get User Bookmarks
```http
GET /api/bookmarks
Authorization: Bearer <token>
Query Parameters:
- collection: string
- page: number
- limit: number
```

#### Toggle Bookmark
```http
POST /api/bookmarks/toggle
Authorization: Bearer <token>
Content-Type: application/json

{
  "coffeeshopId": "coffeeshop_id",
  "collection": "favorites",
  "notes": "Great for weekend study sessions"
}
```

### Job Endpoints

#### Get All Jobs
```http
GET /api/jobs
Query Parameters:
- page: number
- limit: number
- search: string
- city: string
- jobType: "full-time" | "part-time" | "casual"
- category: "barista" | "manager" | "supervisor"
- sortBy: "newest" | "deadline" | "salary"
```

#### Create Job (Business Owner Only)
```http
POST /api/jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Barista",
  "description": "We're looking for an enthusiastic barista...",
  "company": "Bruco Coffee",
  "coffeeshop": "coffeeshop_id",
  "jobType": "part-time",
  "category": "barista",
  "locations": [
    {
      "district": "Sukhbaatar",
      "city": "Ulaanbaatar"
    }
  ],
  "applicationDeadline": "2024-02-15",
  "contactInfo": {
    "email": "jobs@bruco.coffee",
    "phone": "+976-12345678"
  }
}
```

## 🗂 Data Models

### User Schema
```javascript
{
  email: String (required, unique),
  password: String (required, hashed),
  name: String (required),
  avatar: String,
  bio: String,
  location: {
    city: String,
    district: String,
    coordinates: [Number] // [longitude, latitude]
  },
  preferences: {
    favoriteVibes: [String],
    workSchedule: String,
    coffeePreferences: [String]
  },
  isBusinessOwner: Boolean,
  businessInfo: {
    businessName: String,
    businessType: String,
    verificationStatus: String
  },
  stats: {
    reviewsCount: Number,
    bookmarksCount: Number,
    followersCount: Number
  }
}
```

### Coffeeshop Schema
```javascript
{
  name: String (required),
  description: String (required),
  address: {
    street: String (required),
    district: String (required),
    city: String (required)
  },
  location: {
    type: "Point",
    coordinates: [Number] // [longitude, latitude]
  },
  vibes: [String], // ["study-friendly", "cozy", "workspace"]
  amenities: [String], // ["wifi", "power-outlets", "parking"]
  specialties: [String],
  priceRange: String, // "$" | "$$" | "$$$"
  rating: {
    average: Number,
    count: Number
  },
  owner: ObjectId (User),
  verificationStatus: String
}
```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Rate Limiting** - Prevents API abuse (100 requests per 15 minutes)
- **Input Validation** - Comprehensive validation using express-validator
- **CORS Protection** - Configured for specific origins
- **Helmet Security** - HTTP security headers
- **Password Hashing** - bcryptjs with salt rounds
- **MongoDB Injection Protection** - Input sanitization

## 🌍 Geospatial Features

The API supports advanced location-based queries:

- **Proximity Search** - Find coffeeshops within specified distance
- **City/District Filtering** - Filter by administrative boundaries
- **Coordinate-based Search** - Search using latitude/longitude
- **Distance Calculation** - Calculate distances between points

Example geospatial query:
```javascript
// Find coffeeshops within 5km of Ulaanbaatar city center
GET /api/coffeeshops?latitude=47.9184&longitude=106.9057&maxDistance=5
```

## 📊 Database Indexes

Optimized indexes for performance:

```javascript
// Text search index
{ name: "text", description: "text", "address.city": "text" }

// Geospatial index
{ location: "2dsphere" }

// Rating index
{ "rating.average": -1, "rating.count": -1 }

// User activity indexes
{ user: 1, createdAt: -1 }
{ coffeeshop: 1, createdAt: -1 }
```

## 🚀 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secret
- [ ] Configure MongoDB Atlas or production database
- [ ] Set up Cloudinary production environment
- [ ] Configure proper CORS origins
- [ ] Set up SSL/TLS
- [ ] Configure rate limiting for production traffic
- [ ] Set up monitoring and logging

### Environment Variables
```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=your_production_secret_here
FRONTEND_URL=https://your-frontend-domain.com
CLOUDINARY_CLOUD_NAME=production_cloud_name
CLOUDINARY_API_KEY=production_api_key
CLOUDINARY_API_SECRET=production_api_secret
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📝 API Response Format

All API responses follow a consistent format:

```javascript
// Success Response
{
  "success": true,
  "data": {...},
  "pagination": { // For paginated endpoints
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10
  }
}

// Error Response
{
  "success": false,
  "message": "Error description",
  "errors": [...] // Validation errors if applicable
}
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@coffeeshop-discovery.com or join our Discord community.

---

Built with ❤️ for the Mongolia coffee community
