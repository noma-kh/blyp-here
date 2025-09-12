import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    cafe: { type: mongoose.Schema.Types.ObjectId, ref: 'Cafe', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true }
  },
  { timestamps: true }
);

reviewSchema.index({ user: 1, cafe: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);

