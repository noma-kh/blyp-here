import mongoose from 'mongoose';

const suggestionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['suggest', 'claim'], required: true },
    submitter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cafe: { type: mongoose.Schema.Types.ObjectId, ref: 'Cafe' },
    name: String,
    description: String,
    location: {
      address: String,
      city: String,
      country: String
    },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    notes: String
  },
  { timestamps: true }
);

export default mongoose.model('Suggestion', suggestionSchema);

