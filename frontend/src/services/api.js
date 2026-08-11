// SceneCraft Frontend API Service
const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Helper to get headers with authentication token
const getHeaders = (isMultipart = false) => {
  const headers = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  const token = localStorage.getItem('scenecraft_access_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Handle response checks
const handleResponse = async (response) => {
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('scenecraft_access_token');
      localStorage.removeItem('scenecraft_refresh_token');
      localStorage.removeItem('scenecraft_user');
    }
    const data = await response.json().catch(() => ({}));
    const errorMsg = data.message || `API Error (Status ${response.status})`;
    throw new Error(errorMsg);
  }
  return response.json();
};

export const api = {
  // Authentication
  auth: {
    async register(name, email, password) {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name, email, password }),
      });
      const data = await handleResponse(res);
      if (data.success && data.data.tokens) {
        localStorage.setItem('scenecraft_access_token', data.data.tokens.accessToken);
        localStorage.setItem('scenecraft_refresh_token', data.data.tokens.refreshToken);
        localStorage.setItem('scenecraft_user', JSON.stringify(data.data.user));
      }
      return data.data;
    },

    async login(email, password) {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email, password }),
      });
      const data = await handleResponse(res);
      if (data.success && data.data.tokens) {
        localStorage.setItem('scenecraft_access_token', data.data.tokens.accessToken);
        localStorage.setItem('scenecraft_refresh_token', data.data.tokens.refreshToken);
        localStorage.setItem('scenecraft_user', JSON.stringify(data.data.user));
      }
      return data.data;
    },

    async logout() {
      const refreshToken = localStorage.getItem('scenecraft_refresh_token');
      if (refreshToken) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ refreshToken }),
        }).catch(() => {});
      }
      localStorage.removeItem('scenecraft_access_token');
      localStorage.removeItem('scenecraft_refresh_token');
      localStorage.removeItem('scenecraft_user');
    },

    getCurrentUser() {
      const userStr = localStorage.getItem('scenecraft_user');
      return userStr ? JSON.parse(userStr) : null;
    },

    isAuthenticated() {
      return !!localStorage.getItem('scenecraft_access_token');
    }
  },

  // Documents
  documents: {
    async list() {
      const res = await fetch(`${API_BASE}/documents`, {
        headers: getHeaders(),
      });
      const data = await handleResponse(res);
      return data.data;
    },

    async upload(file) {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/documents`, {
        method: 'POST',
        headers: getHeaders(true),
        body: formData,
      });
      const data = await handleResponse(res);
      return data.data;
    },

    async getById(id) {
      const res = await fetch(`${API_BASE}/documents/${id}`, {
        headers: getHeaders(),
      });
      const data = await handleResponse(res);
      return data.data;
    },

    async updateTitle(id, title) {
      const res = await fetch(`${API_BASE}/documents/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ title }),
      });
      const data = await handleResponse(res);
      return data.data;
    },

    async delete(id) {
      const res = await fetch(`${API_BASE}/documents/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await handleResponse(res);
      return data.data;
    }
  },

  // Pipeline/Jobs
  jobs: {
    async getStatus(documentId, signal) {
      const res = await fetch(`${API_BASE}/documents/${documentId}/jobs`, {
        headers: getHeaders(),
        signal,
      });
      const data = await handleResponse(res);
      return data.data;
    },

    async retryStage(documentId, stage) {
      const res = await fetch(`${API_BASE}/documents/${documentId}/jobs/${stage}/retry`, {
        method: 'POST',
        headers: getHeaders(),
      });
      const data = await handleResponse(res);
      return data.data;
    }
  },

  // Story Elements
  story: {
    async getScenes(documentId, page, limit) {
      let url = `${API_BASE}/documents/${documentId}/scenes`;
      const params = [];
      if (page) params.push(`page=${page}`);
      if (limit) params.push(`limit=${limit}`);
      if (params.length) url += `?${params.join('&')}`;

      const res = await fetch(url, { headers: getHeaders() });
      const data = await handleResponse(res);
      return data.data; // Note: returns list or paginated object depending on params
    },

    async getCharacters(documentId, page, limit) {
      let url = `${API_BASE}/documents/${documentId}/characters`;
      const params = [];
      if (page) params.push(`page=${page}`);
      if (limit) params.push(`limit=${limit}`);
      if (params.length) url += `?${params.join('&')}`;

      const res = await fetch(url, { headers: getHeaders() });
      const data = await handleResponse(res);
      return data.data;
    },

    async getRelationships(documentId) {
      const res = await fetch(`${API_BASE}/documents/${documentId}/story/relationships`, {
        headers: getHeaders(),
      });
      const data = await handleResponse(res);
      return data.data;
    },

    async getTimeline(documentId) {
      const res = await fetch(`${API_BASE}/documents/${documentId}/story/timeline`, {
        headers: getHeaders(),
      });
      const data = await handleResponse(res);
      return data.data;
    },

    async getDialogue(documentId, characterId = null) {
      let url = `${API_BASE}/documents/${documentId}/story/dialogue`;
      if (characterId) url += `?characterId=${characterId}`;
      const res = await fetch(url, { headers: getHeaders() });
      const data = await handleResponse(res);
      return data.data;
    },

    async getMood(documentId) {
      const res = await fetch(`${API_BASE}/documents/${documentId}/story/mood`, {
        headers: getHeaders(),
      });
      const data = await handleResponse(res);
      return data.data;
    },

    async getArc(documentId) {
      const res = await fetch(`${API_BASE}/documents/${documentId}/story/arc`, {
        headers: getHeaders(),
      });
      const data = await handleResponse(res);
      return data.data;
    },

    async getContinuity(documentId) {
      const res = await fetch(`${API_BASE}/documents/${documentId}/story/continuity`, {
        headers: getHeaders(),
      });
      const data = await handleResponse(res);
      return data.data;
    },

    async updateContinuityStatus(documentId, issueId, status) {
      const res = await fetch(`${API_BASE}/documents/${documentId}/story/continuity/${issueId}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      });
      const data = await handleResponse(res);
      return data.data;
    },

    async search(documentId, query, filters = {}) {
      let url = `${API_BASE}/documents/${documentId}/search?q=${encodeURIComponent(query)}`;
      if (filters.character) url += `&character=${encodeURIComponent(filters.character)}`;
      if (filters.mood) url += `&mood=${encodeURIComponent(filters.mood)}`;
      if (filters.sceneRangeFrom) url += `&sceneRangeFrom=${filters.sceneRangeFrom}`;
      if (filters.sceneRangeTo) url += `&sceneRangeTo=${filters.sceneRangeTo}`;
      
      const res = await fetch(url, { headers: getHeaders() });
      const data = await handleResponse(res);
      return data.data;
    },

    async ask(documentId, question) {
      const res = await fetch(`${API_BASE}/documents/${documentId}/search/ask`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ question }),
      });
      const data = await handleResponse(res);
      return data.data;
    }
  }
};
