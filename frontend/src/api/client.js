const API_BASE_URL = 'http://localhost:8080';

async function request(endpoint, options = {}, token = null) {
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (response.status === 401) {
      localStorage.removeItem('smartops_token');
      localStorage.removeItem('smartops_user');
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error || `HTTP error ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  login: async (email) => {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  getProfile: async (token) => {
    return request('/users/me', { method: 'GET' }, token);
  },

  search: async (query, token) => {
    return request(`/search?q=${encodeURIComponent(query)}`, { method: 'GET' }, token);
  },

  createTask: async (task, token) => {
    return request('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    }, token);
  },

  triageTask: async (taskData, token) => {
    return request('/tasks/triage', {
      method: 'POST',
      body: JSON.stringify(taskData),
    }, token);
  },

  updateTask: async (taskId, taskData, token) => {
    return request(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    }, token);
  },

  deleteTask: async (taskId, token) => {
    return request(`/tasks/${taskId}`, {
      method: 'DELETE',
    }, token);
  },

  updateTaskStatus: async (taskId, status, token) => {
    return request(`/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }, token);
  },

  uploadAttachment: async (taskId, file, token) => {
    const formData = new FormData();
    formData.append('file', file);

    return request(`/tasks/${taskId}/attachments`, {
      method: 'POST',
      body: formData,
    }, token);
  },

  // Issue #1: Draft breakdown request & confirmation flow
  agenticBreakdown: async (taskId, token) => {
    return request(`/tasks/${taskId}/breakdown`, {
      method: 'POST',
    }, token);
  },

  confirmSubTasks: async (taskId, approvedDrafts, token) => {
    return request(`/tasks/${taskId}/breakdown/confirm`, {
      method: 'POST',
      body: JSON.stringify(approvedDrafts),
    }, token);
  },

  addComment: async (taskId, content, token) => {
    return request(`/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }, token);
  },

  getComments: async (taskId, token) => {
    return request(`/tasks/${taskId}/comments`, { method: 'GET' }, token);
  },

  getUnreadNotifications: async (token) => {
    return request('/notifications/unread', { method: 'GET' }, token);
  },

  markNotificationRead: async (notifId, token) => {
    return request(`/notifications/${notifId}/read`, { method: 'POST' }, token);
  },

  getCompletionRate: async (token) => {
    return request('/analytics/completion-rate', { method: 'GET' }, token);
  },

  getOverdueTasks: async (token) => {
    return request('/analytics/overdue', { method: 'GET' }, token);
  },

  updateUserSettings: async (settings, token) => {
    return request('/users/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }, token);
  },

  testTeamsWebhook: async (webhookUrl, token) => {
    return request('/notifications/test-teams-webhook', {
      method: 'POST',
      body: JSON.stringify({ webhook_url: webhookUrl }),
    }, token);
  },
};
