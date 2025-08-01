import api from '../lib/api';

export const coffeeshopService = {
  // Get all coffeeshops with filters
  getCoffeeshops: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await api.get(`/coffeeshops?${queryString}`);
  },

  // Get single coffeeshop
  getCoffeeshop: async (id) => {
    return await api.get(`/coffeeshops/${id}`);
  },

  // Create new coffeeshop (business owners only)
  createCoffeeshop: async (coffeeshopData) => {
    return await api.post('/coffeeshops', coffeeshopData);
  },

  // Update coffeeshop
  updateCoffeeshop: async (id, coffeeshopData) => {
    return await api.put(`/coffeeshops/${id}`, coffeeshopData);
  },

  // Delete coffeeshop
  deleteCoffeeshop: async (id) => {
    return await api.delete(`/coffeeshops/${id}`);
  },

  // Get featured coffeeshops
  getFeaturedCoffeeshops: async (limit = 8) => {
    return await api.get(`/coffeeshops/featured/list?limit=${limit}`);
  },

  // Search coffeeshops near location
  searchNearby: async (latitude, longitude, maxDistance = 10, filters = {}) => {
    const params = {
      latitude,
      longitude,
      maxDistance,
      sortBy: 'distance',
      ...filters,
    };
    return coffeeshopService.getCoffeeshops(params);
  },

  // Search by vibe
  searchByVibe: async (vibes, filters = {}) => {
    const params = {
      vibes: Array.isArray(vibes) ? vibes : [vibes],
      ...filters,
    };
    return coffeeshopService.getCoffeeshops(params);
  },

  // Get coffeeshops by user
  getUserCoffeeshops: async (userId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await api.get(`/coffeeshops/user/${userId}?${queryString}`);
  },
};

export default coffeeshopService;