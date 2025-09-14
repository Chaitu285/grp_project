// src/api.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000", // backend base URL
});

// Automatically add token for every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Spin wheel POST API call - no adminId needed in request body
const spinWheel = () => {
  return API.post("/spin-wheel/spin");
};

export default {
  ...API,
  spinWheel,
};
