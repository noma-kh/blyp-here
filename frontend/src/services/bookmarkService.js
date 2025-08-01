import api from '../lib/api';

export const bookmarkService = {
  // Get user's bookmarks
  getBookmarks: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await api.get(`/bookmarks?${queryString}`);
  },

  // Toggle bookmark (add/remove)
  toggleBookmark: async (coffeeshopId, collection = 'favorites', notes = '') => {
    return await api.post('/bookmarks/toggle', {
      coffeeshopId,
      collection,
      notes
    });
  },

  // Update bookmark
  updateBookmark: async (bookmarkId, updateData) => {
    return await api.put(`/bookmarks/${bookmarkId}`, updateData);
  },

  // Delete bookmark
  deleteBookmark: async (bookmarkId) => {
    return await api.delete(`/bookmarks/${bookmarkId}`);
  },

  // Check if coffeeshop is bookmarked
  checkBookmarkStatus: async (coffeeshopId) => {
    return await api.get(`/bookmarks/check/${coffeeshopId}`);
  },

  // Get user's bookmark collections
  getCollections: async () => {
    return await api.get('/bookmarks/collections');
  },

  // Share bookmark collection
  shareCollection: async (collectionId) => {
    return await api.get(`/bookmarks/share/${collectionId}`);
  },
};

export default bookmarkService;