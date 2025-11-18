import axios from "axios";

// Dùng relative URL - nginx sẽ proxy /api -> backend:8386/api
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

export default apiClient;



