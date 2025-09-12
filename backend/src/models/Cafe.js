import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    address: String,
    city: String,
    country: String,
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }
    }
  },
  { _id: false }
);

const cafeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    description: String,
    tags: [{ type: String, index: true }],
    location: locationSchema,
    images: [String],
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

cafeSchema.index({ 'location.coordinates': '2dsphere' });

export default mongoose.model('Cafe', cafeSchema);

