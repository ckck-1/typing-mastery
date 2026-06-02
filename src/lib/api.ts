import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://typing-academy-api.onrender.com/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        // The new token should be in the cookie/response depending on backend implementation
        // If it's in the response data:
        if (data.accessToken) {
            localStorage.setItem("auth_token", data.accessToken);
            api.defaults.headers.common["Authorization"] = `Bearer ${data.accessToken}`;
            return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem("auth_token");
        // window.location.href = "/auth";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
