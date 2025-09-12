import Cafe from '../models/Cafe.js';
import Review from '../models/Review.js';

export const listCafes = async (req, res) => {
  const { q, city, tags, minRating, lng, lat, radius } = req.query || {};
  const filter = {};
  if (q) filter.name = { $regex: q, $options: 'i' };
  if (city) filter['location.city'] = { $regex: `^${city}$`, $options: 'i' };
  if (tags) filter.tags = { $all: String(tags).split(',').map((t) => t.trim()) };
  if (minRating) filter.ratingAvg = { $gte: Number(minRating) };
  if (lng && lat && radius) {
    filter['location.coordinates'] = {
      $near: {
        $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
        $maxDistance: Number(radius)
      }
    };
  }
  const cafes = await Cafe.find(filter).sort({ ratingAvg: -1, ratingCount: -1 }).limit(100);
  res.json({ cafes });
};

export const getCafe = async (req, res) => {
  const cafe = await Cafe.findById(req.params.id);
  if (!cafe) return res.status(404).json({ message: 'Cafe not found' });
  const reviews = await Review.find({ cafe: cafe._id }).populate('user', 'name avatarUrl');
  res.json({ cafe, reviews });
};

export const createCafe = async (req, res) => {
  const payload = { ...req.body, owner: req.user._id };
  const cafe = await Cafe.create(payload);
  res.status(201).json({ cafe });
};

export const updateCafe = async (req, res) => {
  const cafe = await Cafe.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id },
    req.body,
    { new: true }
  );
  if (!cafe) return res.status(404).json({ message: 'Cafe not found or not owned by user' });
  res.json({ cafe });
};

