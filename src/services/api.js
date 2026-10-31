/**
 * Questify AI - Frontend REST API Client
 * Interfaces with backend endpoints with automatic Bearer token injection.
 */

const BASE_URL = '/api';

function getHeaders() {
  const token = localStorage.getItem('questify_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
  };

  const response = await fetch(url, config);
  if (!response.ok) {
    let errorMsg = `API request failed with status ${response.status}`;
    try {
      const errData = await response.json();
      if (errData.detail) errorMsg = errData.detail;
    } catch (_) {}
    throw new Error(errorMsg);
  }
  return response.json();
}

export const api = {
  // Auth
  async register(fullName, email, password) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ full_name: fullName, email, password }),
    });
  },

  async login(email, password) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async demoLogin() {
    return request('/auth/demo-login', {
      method: 'POST',
    });
  },

  async getMe() {
    return request('/auth/me');
  },

  // Dashboard
  async getDashboard() {
    return request('/dashboard');
  },

  // Connections
  async getConnections() {
    return request('/connections');
  },

  async connectSource(source, isDemo = true, accountEmail = null) {
    return request('/connections/connect', {
      method: 'POST',
      body: JSON.stringify({ source, is_demo: isDemo, account_email: accountEmail }),
    });
  },

  async disconnectSource(source) {
    return request(`/connections/${source}`, {
      method: 'DELETE',
    });
  },

  // Analysis & AI Engine
  async startAnalysis(source) {
    return request('/analysis/start', {
      method: 'POST',
      body: JSON.stringify({ source }),
    });
  },

  async getAnalysisResults(source) {
    return request(`/analysis/results?source=${encodeURIComponent(source)}`);
  },

  async correctClassification(classificationId, correctedCategory, userReason = '') {
    return request('/analysis/correct', {
      method: 'POST',
      body: JSON.stringify({
        classification_id: classificationId,
        corrected_category: correctedCategory,
        user_reason: userReason,
      }),
    });
  },

  // Actions & Execution Lifecycle
  async previewActions(itemIds, actionType, targetDestination = null, verdict = null, notes = null) {
    return request('/actions/preview', {
      method: 'POST',
      body: JSON.stringify({
        item_ids: itemIds,
        action_type: actionType,
        target_destination: targetDestination,
        verdict,
        notes,
      }),
    });
  },

  async approveActions(actionIds) {
    return request('/actions/approve', {
      method: 'POST',
      body: JSON.stringify({ action_ids: actionIds }),
    });
  },

  async getPendingActions() {
    return request('/actions/pending');
  },

  // Central Trash & Recovery
  async getCentralTrash(source = null) {
    const query = source ? `?source=${encodeURIComponent(source)}` : '';
    return request(`/trash${query}`);
  },

  async restoreTrashItem(itemId) {
    return request('/trash/restore', {
      method: 'POST',
      body: JSON.stringify({ item_id: itemId }),
    });
  },

  async permanentDelete(itemIds, confirmed = true) {
    return request('/trash/permanent-delete', {
      method: 'POST',
      body: JSON.stringify({ item_ids: itemIds, confirmed }),
    });
  },

  // Gamification: Rewards & Missions
  async getRewards() {
    return request('/rewards');
  },

  async getMissions() {
    return request('/missions');
  },

  // Financial Shield
  async getFinancialShield(bank = null) {
    const query = bank ? `?bank=${encodeURIComponent(bank)}` : '';
    return request(`/financial-shield${query}`);
  },

  async reviewFinancialItem(itemId, otpState, verdict = null) {
    return request('/financial-shield/review', {
      method: 'POST',
      body: JSON.stringify({
        item_id: itemId,
        otp_state: otpState,
        user_verdict: verdict,
      }),
    });
  },

  // Activity History
  async getActivityHistory(filter = null, search = null) {
    const params = new URLSearchParams();
    if (filter) params.append('event_filter', filter);
    if (search) params.append('search', search);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request(`/history${queryString}`);
  },

  // Settings & Reset
  async resetDemoData() {
    return request('/settings/reset-demo', {
      method: 'POST',
    });
  },
};
