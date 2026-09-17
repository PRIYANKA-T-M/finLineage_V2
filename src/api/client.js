import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('finlineage_jwt');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password })
};

export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary')
};

export const institutionAPI = {
  getAll: () => api.get('/institutions'),
  getById: (id) => api.get(`/institutions/${id}`),
  create: (data) => api.post('/institutions', data),
  update: (id, data) => api.put(`/institutions/${id}`, data),
  delete: (id) => api.delete(`/institutions/${id}`)
};

export const speciesAPI = {
  getAll: () => api.get('/species'),
  getById: (id) => api.get(`/species/${id}`),
  create: (data) => api.post('/species', data),
  update: (id, data) => api.put(`/species/${id}`, data),
  delete: (id) => api.delete(`/species/${id}`)
};

export const specimenAPI = {
  getAll: (params) => api.get('/specimens', { params }),
  getById: (id) => api.get(`/specimens/${id}`),
  create: (data) => api.post('/specimens', data),
  update: (id, data) => api.put(`/specimens/${id}`, data),
  archive: (id) => api.delete(`/specimens/${id}`),
  addParent: (id, parentData) => api.post(`/specimens/${id}/parents`, parentData),
  getParents: (id) => api.get(`/specimens/${id}/parents`),
  retryFailedSyncs: () => api.post('/specimens/sync-failed')
};

export const pedigreeAPI = {
  getPedigree: (id, generations = 4) => api.get(`/specimens/${id}/pedigree`, { params: { generations } }),
  getAncestors: (id) => api.get(`/specimens/${id}/ancestors`),
  getDescendants: (id) => api.get(`/specimens/${id}/descendants`)
};

export const breedingAPI = {
  getAll: () => api.get('/breeding-events'),
  create: (data) => api.post('/breeding-events', data)
};

export const geneticBreedingAPI = {
  evaluatePair: (sireId, damId, maxGenerations = 5) => api.post('/breeding/evaluate', { sireId, damId, maxGenerations }),
  getEvaluations: () => api.get('/breeding/evaluations'),
  getEvaluationById: (id) => api.get(`/breeding/evaluations/${id}`),
  getCandidates: (specimenId) => api.get(`/breeding/candidates/${specimenId}`),
  getMatrix: (speciesId) => api.get('/breeding/matrix', { params: { speciesId } }),
  getPolicies: () => api.get('/breeding/policies'),
  updatePolicy: (speciesId, data) => api.put(`/breeding/policies/${speciesId}`, data),
  optimizePlan: (data) => api.post('/breeding/optimize', data),
  getPlans: () => api.get('/breeding/plans'),
  getPlanById: (id) => api.get(`/breeding/plans/${id}`),
  simulateScenario: (data) => api.post('/breeding/scenarios', data),
  compareScenarios: (speciesId) => api.post('/breeding/scenarios/compare', { speciesId }),
  getTransfers: (speciesId) => api.get('/breeding/transfers', { params: { speciesId } })
};

export const populationAPI = {
  getSummary: (speciesId) => api.get(`/populations/${speciesId}/summary`),
  getMeanKinship: (speciesId) => api.get(`/populations/${speciesId}/mean-kinship`),
  getFounders: (speciesId) => api.get(`/populations/${speciesId}/founders`),
  getAlerts: (speciesId) => api.get(`/populations/${speciesId}/alerts`)
};

export const auditAPI = {
  getAll: () => api.get('/audit-logs')
};

export const testAPI = {
  runTests: () => api.get('/tests/run')
};

export default api;
