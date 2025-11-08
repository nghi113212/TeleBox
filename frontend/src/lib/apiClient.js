import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8386/api";

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

export default apiClient;



