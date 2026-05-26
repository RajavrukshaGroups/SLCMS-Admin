import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://server.bouncyboxstudio.in",
  // baseURL: import.meta.env.VITE_API_URL || "http://localhost:11000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔐 Attach token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 🚫 Handle unauthorized globally (EXCEPT login)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || "";

    // ❌ Skip redirect for login API
    if (status === 401 && !requestUrl.includes("/login")) {
      localStorage.removeItem("adminToken");
      window.location.href = "/admin/login";
    }

    return Promise.reject(error);
  },
);

export default api;
