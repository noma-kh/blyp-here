export const notFound = (_req, res, _next) => {
  res.status(404).json({ message: 'Not Found' });
};

export const errorHandler = (err, _req, res, _next) => {
  const status = err.statusCode || 500;
  const message = err.message || 'Server Error';
  res.status(status).json({ message });
};

