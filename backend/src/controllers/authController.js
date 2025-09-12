import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';

export const signup = async (req, res) => {
  const { name, email, password } = req.body || {};
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: 'Email already used' });
  const user = await User.create({ name, email, password });
  const token = generateToken(user._id);
  res.status(201).json({ user: { ...user.toObject(), password: undefined }, token });
};

export const login = async (req, res) => {
  const { email, password } = req.body || {};
  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = generateToken(user._id);
  res.json({ user: { ...user.toObject(), password: undefined }, token });
};

