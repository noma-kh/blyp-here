import Review from '../models/Review.js';
import Cafe from '../models/Cafe.js';

export const createReview = async (req, res) => {
  const { cafeId, rating, comment } = req.body || {};
  const review = await Review.create({
    user: req.user._id,
    cafe: cafeId,
    rating,
    comment
  });
  const agg = await Review.aggregate([
    { $match: { cafe: review.cafe } },
    { $group: { _id: '$cafe', ratingAvg: { $avg: '$rating' }, ratingCount: { $sum: 1 } } }
  ]);
  const { ratingAvg = 0, ratingCount = 0 } = agg[0] || {};
  await Cafe.findByIdAndUpdate(review.cafe, { ratingAvg, ratingCount });
  res.status(201).json({ review });
};

export const getReviews = async (req, res) => {
  const cafeId = req.params.cafeId;
  const reviews = await Review.find({ cafe: cafeId }).populate('user', 'name avatarUrl');
  res.json({ reviews });
};

