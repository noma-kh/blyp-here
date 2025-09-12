import Badge from '../models/Badge.js';
import UserBadge from '../models/UserBadge.js';
import Review from '../models/Review.js';
import Suggestion from '../models/Suggestion.js';

export const awardBadgesForReview = async (userId) => {
  const count = await Review.countDocuments({ user: userId });
  const candidates = await Badge.find({
    $or: [
      { 'criteria.type': 'first_review' },
      { 'criteria.type': 'reviews_count', 'criteria.threshold': { $lte: count } }
    ]
  });
  await Promise.all(
    candidates.map((b) =>
      UserBadge.updateOne({ user: userId, badge: b._id }, {}, { upsert: true })
    )
  );
};

export const awardBadgesForSuggestionApproval = async (userId) => {
  const approved = await Suggestion.countDocuments({ submitter: userId, status: 'approved', type: 'suggest' });
  const candidates = await Badge.find({ 'criteria.type': 'suggestions_approved', 'criteria.threshold': { $lte: approved } });
  await Promise.all(
    candidates.map((b) =>
      UserBadge.updateOne({ user: userId, badge: b._id }, {}, { upsert: true })
    )
  );
};

