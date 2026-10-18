// Global API Configuration
// Dynamically reads from VITE_API_URL in production or defaults to local backend (port 8001)
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";
