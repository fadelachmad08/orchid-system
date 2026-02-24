import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://fadelasiop-orchid-system.hf.space';

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================
// AUTH
// ============================================
export const login = async (username, password) => {
  const response = await api.post('/auth/login', { username, password });
  return response.data;
};

export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

// ============================================
// BATCHES
// ============================================
export const getBatches = async (token, params = {}) => {
  const response = await api.get('/batches', { 
    params,
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getBatch = async (token, id) => {
  const response = await api.get(`/batches/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const createBatch = async (token, data) => {
  const response = await api.post('/batches', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateBatch = async (token, id, data) => {
  const response = await api.put(`/batches/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const deleteBatch = async (token, id) => {
  const response = await api.delete(`/batches/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getBatchesReadyForTransition = async (token, phase = null) => {
  const params = phase ? { phase } : {};
  const response = await api.get('/phase-transitions/batches-ready', {
    params,
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getAvailableBatches = async (token, greenhouseId) => {
  const response = await api.get('/batches/available', {
    params: { greenhouse_id: greenhouseId },
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// ============================================
// BATCH TRACKING
// ============================================
export const getBatchTracking = async (token, params = {}) => {
  const response = await api.get('/reports/batch-tracking', {
    params,
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getLossSummary = async (token, params = {}) => {
  const response = await api.get('/reports/loss-summary', {
    params,
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const exportBatchTracking = async (token, params = {}) => {
  const response = await api.get('/reports/export/batch-tracking', {
    params,
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob'
  });
  return response.data;
};

// ============================================
// CONTAINERS
// ============================================
export const getContainers = async (token, params = {}) => {
  const response = await api.get('/containers', {
    params,
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getContainer = async (token, id) => {
  const response = await api.get(`/containers/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const createContainer = async (token, data) => {
  const response = await api.post('/containers', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateContainer = async (token, id, data) => {
  const response = await api.put(`/containers/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const deleteContainer = async (token, id) => {
  const response = await api.delete(`/containers/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getAgeGroups = async (token, containerId) => {
  const response = await api.get(`/containers/${containerId}/age-groups`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// ============================================
// SUPPLIERS
// ============================================
export const getSuppliers = async (token, params = {}) => {
  const response = await api.get('/suppliers', {
    params,
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getSupplier = async (token, id) => {
  const response = await api.get(`/suppliers/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const createSupplier = async (token, data) => {
  const response = await api.post('/suppliers', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateSupplier = async (token, id, data) => {
  const response = await api.put(`/suppliers/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const deleteSupplier = async (token, id) => {
  const response = await api.delete(`/suppliers/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// ============================================
// VARIETIES
// ============================================
export const getVarieties = async (token, params = {}) => {
  const response = await api.get('/varieties', {
    params,
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getVariety = async (token, id) => {
  const response = await api.get(`/varieties/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const createVariety = async (token, data) => {
  const response = await api.post('/varieties', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateVariety = async (token, id, data) => {
  const response = await api.put(`/varieties/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const deleteVariety = async (token, id) => {
  const response = await api.delete(`/varieties/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// ============================================
// GREENHOUSES
// ============================================
export const getGreenhouses = async (token, params = {}) => {
  const response = await api.get('/greenhouses', {
    params,
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getGreenhouse = async (token, id) => {
  const response = await api.get(`/greenhouses/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const createGreenhouse = async (token, data) => {
  const response = await api.post('/greenhouses', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateGreenhouse = async (token, id, data) => {
  const response = await api.put(`/greenhouses/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const deleteGreenhouse = async (token, id) => {
  const response = await api.delete(`/greenhouses/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const assignBatchToGreenhouse = async (token, greenhouseId, batchId) => {
  const response = await api.post(`/greenhouses/${greenhouseId}/assign-batch`, 
    { batch_id: batchId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

// ============================================
// PHASE TRANSITIONS / PHASE MANAGEMENT
// ============================================
export const getPhaseTransitions = async (token, params = {}) => {
  const response = await api.get('/phase-transitions', {
    params,
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getTransitionHistory = async (token, batchId) => {
  const response = await api.get(`/phase-transitions/history/${batchId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const movePhase = async (token, data) => {
  const response = await api.post('/phase-transitions/move', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const recordLoss = async (token, data) => {
  const response = await api.post('/phase-transitions/record-loss', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// ============================================
// USERS
// ============================================
export const getUsers = async (token, params = {}) => {
  const response = await api.get('/users', {
    params,
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getUser = async (token, id) => {
  const response = await api.get(`/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const createUser = async (token, data) => {
  const response = await api.post('/users', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateUser = async (token, id, data) => {
  const response = await api.put(`/users/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const deleteUser = async (token, id) => {
  const response = await api.delete(`/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// ============================================
// STATS / DASHBOARD
// ============================================
export const getDashboardStats = async (token) => {
  const response = await api.get('/stats/dashboard', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getPlantsByPhase = async (token) => {
  const response = await api.get('/stats/plants-by-phase', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getTopVarieties = async (token) => {
  const response = await api.get('/stats/top-varieties', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getLossTrend = async (token) => {
  const response = await api.get('/stats/loss-trend', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getGreenhouseUtilization = async (token) => {
  const response = await api.get('/stats/greenhouse-utilization', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getRecentActivities = async (token) => {
  const response = await api.get('/stats/recent-activities', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// ============================================
// NOTIFICATIONS
// ============================================
export const getNotifications = async (token, unreadOnly = false, limit = 20, offset = 0) => {
  const response = await api.get('/notifications', {
    params: { unread_only: unreadOnly, limit, offset },
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getUnreadCount = async (token) => {
  const response = await api.get('/notifications/unread-count', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const markAsRead = async (token, notificationId) => {
  const response = await api.put(`/notifications/${notificationId}/read`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const markAllAsRead = async (token) => {
  const response = await api.put('/notifications/read-all', {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const deleteNotification = async (token, notificationId) => {
  const response = await api.delete(`/notifications/${notificationId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// ============================================
// IMPORT / EXPORT (SESSION 15)
// ============================================
export const importBatchesPreview = async (token, file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/imports/batches/preview', formData, {
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const importBatchesExecute = async (token, file, skipErrors = true) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post(`/imports/batches/execute?skip_errors=${skipErrors}`, formData, {
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const downloadImportTemplate = async (token) => {
  const response = await api.get('/imports/templates/batches', {
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob'
  });
  return response.data;
};

export const exportBatches = async (token, params = {}) => {
  const response = await api.get('/exports/batches', {
    params,
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob'
  });
  return response.data;
};

export const exportContainers = async (token, params = {}) => {
  const response = await api.get('/exports/containers', {
    params,
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob'
  });
  return response.data;
};

export const exportPhaseTransitions = async (token, params = {}) => {
  const response = await api.get('/exports/phase-transitions', {
    params,
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob'
  });
  return response.data;
};

export const exportLossReport = async (token, params = {}) => {
  const response = await api.get('/exports/loss-report', {
    params,
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob'
  });
  return response.data;
};

export const exportInventorySummary = async (token) => {
  const response = await api.get('/exports/inventory-summary', {
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob'
  });
  return response.data;
};

// Default export for axios instance
export default api;
