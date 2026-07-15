import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// REQUEST INTERCEPTOR: attach access token from localStorage
api.interceptors.request.use((config) => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    } catch (e) {
      console.error("Error parsing user from localStorage", e);
    }
  }
  return config;
}, (error) => Promise.reject(error));

// RESPONSE INTERCEPTOR: on 401, try refreshing the token once
let isRefreshing = false;
let refreshQueue = [];

const processQueue = (error, token = null) => {
  refreshQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  refreshQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only handle 401 and don't retry the refresh endpoint itself
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        // Queue this request until the refresh is done
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;

        if (!user?.refresh_token) {
          throw new Error('No refresh token available');
        }

        // Call the new /auth/refresh endpoint
        const { data } = await axios.post('http://localhost:5000/api/auth/refresh', {
          refresh_token: user.refresh_token
        });

        // Save the new tokens
        const updatedUser = { ...user, token: data.token, refresh_token: data.refresh_token };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

        processQueue(null, data.token);
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Refresh failed — clear storage and redirect to login
        console.error('Session expired. Logging out.', refreshError);
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
