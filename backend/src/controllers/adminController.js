import Suggestion from '../models/Suggestion.js';
import Cafe from '../models/Cafe.js';

export const listSuggestions = async (req, res) => {
  const { status = 'pending' } = req.query;
  const items = await Suggestion.find({ status }).populate('submitter', 'name email');
  res.json({ items });
};

export const approveSuggestion = async (req, res) => {
  const sug = await Suggestion.findById(req.params.id);
  if (!sug) return res.status(404).json({ message: 'Not found' });
  sug.status = 'approved';
  await sug.save();
  if (sug.type === 'suggest') {
    await Cafe.create({
      name: sug.name,
      description: sug.description,
      location: sug.location,
      owner: sug.submitter
    });
  }
  if (sug.type === 'claim' && sug.cafe) {
    await Cafe.findByIdAndUpdate(sug.cafe, { owner: sug.submitter });
  }
  res.json({ suggestion: sug });
};

export const rejectSuggestion = async (req, res) => {
  const sug = await Suggestion.findByIdAndUpdate(req.params.id, { status: 'rejected', notes: req.body.notes }, { new: true });
  if (!sug) return res.status(404).json({ message: 'Not found' });
  res.json({ suggestion: sug });
};

export const submitSuggestion = async (req, res) => {
  const payload = { ...req.body, submitter: req.user._id };
  const created = await Suggestion.create(payload);
  res.status(201).json({ suggestion: created });
};

