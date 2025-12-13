const API_URL = '/api';

function getToken() {
  const session = localStorage.getItem('vivaponto_session');
  if (session) {
    try {
      const { token } = JSON.parse(session);
      return token;
    } catch {
      return null;
    }
  }
  return null;
}

async function request(endpoint: string, options: RequestInit = {}) {
  const token = getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || 'Erro na requisição');
  }

  return response.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    register: (data: {
      name: string;
      email: string;
      cpf: string;
      password: string;
      role: string;
      shift_id?: number;
    }) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  users: {
    getAll: () => request('/users'),
    getMe: () => request('/users/me'),
    getStats: () => request('/users/stats'),
    update: (id: number, data: { name: string; email: string; shift_id?: number }) =>
      request(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number) => request(`/users/${id}`, { method: 'DELETE' }),
  },

  shifts: {
    getAll: () => request('/shifts'),
    create: (data: {
      name: string;
      start_time: string;
      break_start: string;
      break_end: string;
      end_time: string;
      total_minutes: number;
    }) =>
      request('/shifts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: any) =>
      request(`/shifts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number) => request(`/shifts/${id}`, { method: 'DELETE' }),
  },

  timeRecords: {
    getAll: (params?: { user_id?: number; date?: string; start_date?: string; end_date?: string }) => {
      const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return request(`/time-records${query}`);
    },
    getToday: () => request('/time-records/today'),
    create: (type: string) =>
      request('/time-records', {
        method: 'POST',
        body: JSON.stringify({ type }),
      }),
    getReport: (params?: { user_id?: number; start_date?: string; end_date?: string }) => {
      const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return request(`/time-records/report${query}`);
    },
  },

  adjustmentRequests: {
    getAll: (status?: string) => {
      const query = status ? `?status=${status}` : '';
      return request(`/adjustment-requests${query}`);
    },
    create: (data: {
      date: string;
      old_time?: string;
      new_time: string;
      type: string;
      reason: string;
    }) =>
      request('/adjustment-requests', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    approve: (id: number) =>
      request(`/adjustment-requests/${id}/approve`, {
        method: 'PUT',
      }),
    reject: (id: number) =>
      request(`/adjustment-requests/${id}/reject`, {
        method: 'PUT',
      }),
  },

  manual: {
    getRecords: (userId: number, date: string) =>
      request(`/manual/records/${userId}/${date}`),
    add: (data: {
      user_id: number;
      date: string;
      time: string;
      type: string;
      justification: string;
    }) =>
      request('/manual/add', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    edit: (id: number, data: { time: string; justification: string }) =>
      request(`/manual/edit/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number, justification: string) =>
      request(`/manual/delete/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({ justification }),
      }),
  },

  debug: {
    seedScenarios: (user_id: number) =>
      request('/debug/seed-scenarios', {
        method: 'POST',
        body: JSON.stringify({ user_id }),
      }),
  },
};
