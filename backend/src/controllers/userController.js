export const profile = async (req, res) => {
  res.json({ user: req.user });
};

