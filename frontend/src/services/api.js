import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const listCafes = async (params = {}) => {
  const { data } = await api.get('/cafes', { params });
  return data;
};

export const getCafe = async (id) => {
  const { data } = await api.get(`/cafes/${id}`);
  return data;
};

export const createReview = async (payload, token) => {
  const { data } = await api.post('/reviews', payload, { headers: { Authorization: `Bearer ${token}` } });
  return data;
};

export const getProfile = async (token) => {
  const { data } = await api.get('/users/me', { headers: { Authorization: `Bearer ${token}` } });
  return data;
};

export const signup = async (name, email, password) => {
  const { data } = await api.post('/auth/signup', { name, email, password });
  return data;
};

export const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

