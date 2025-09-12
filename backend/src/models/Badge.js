import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, index: true },
    name: { type: String, required: true },
    description: String,
    icon: String, // optional URL
    criteria: {
      type: { type: String, enum: ['reviews_count', 'suggestions_approved', 'first_review'] },
      threshold: Number
    }
  },
  { timestamps: true }
);

export default mongoose.model('Badge', badgeSchema);

