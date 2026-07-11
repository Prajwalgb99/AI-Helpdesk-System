import axios from "axios";

// One shared axios instance. Every request automatically carries the
// JWT if we have one — that's the only reason this file exists instead
// of just calling axios directly everywhere.
const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
