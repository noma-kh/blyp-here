import api from '../lib/api';

export const jobService = {
  // Get all jobs with filters
  getJobs: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await api.get(`/jobs?${queryString}`);
  },

  // Get single job
  getJob: async (id) => {
    return await api.get(`/jobs/${id}`);
  },

  // Create new job (business owners only)
  createJob: async (jobData) => {
    return await api.post('/jobs', jobData);
  },

  // Update job
  updateJob: async (id, jobData) => {
    return await api.put(`/jobs/${id}`, jobData);
  },

  // Delete job
  deleteJob: async (id) => {
    return await api.delete(`/jobs/${id}`);
  },

  // Get featured jobs
  getFeaturedJobs: async (limit = 6) => {
    return await api.get(`/jobs/featured/list?limit=${limit}`);
  },

  // Get jobs by coffeeshop
  getJobsByCoffeeshop: async (coffeeshopId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await api.get(`/jobs/coffeeshop/${coffeeshopId}?${queryString}`);
  },

  // Get user's posted jobs
  getUserJobs: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await api.get(`/jobs/user/posted?${queryString}`);
  },

  // Get job options (categories, skills, etc.)
  getJobOptions: async () => {
    return await api.get('/jobs/meta/options');
  },
};

export default jobService;