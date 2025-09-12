import Badge from '../models/Badge.js';
import UserBadge from '../models/UserBadge.js';

export const listBadges = async (_req, res) => {
  const badges = await Badge.find({}).sort({ name: 1 });
  res.json({ badges });
};

export const listUserBadges = async (req, res) => {
  const items = await UserBadge.find({ user: req.user._id }).populate('badge');
  res.json({ badges: items.map((i) => i.badge) });
};

