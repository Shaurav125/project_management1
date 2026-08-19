import axios from 'axios';

// In our full-stack container environment, the Express server serves both the
// frontend SPA and all /api/* routes on port 3000.
// Setting baseURL to '' ensures all requests are relative and avoid CORS/Network errors.
const api = axios.create({
  baseURL: '',
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log helpful diagnostic warning without crashing
    console.warn(
      'API Request Notice:',
      error?.config?.url,
      error?.response?.status || error?.code || error?.message
    );
    return Promise.reject(error);
  }
);

export default api;
