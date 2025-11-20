import axios, { AxiosError } from 'axios';
import { authService } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  username: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
}

// Create axios instance
export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const apiError: ApiError = {
        message: (error.response.data as any)?.message || error.message || 'An error occurred',
        statusCode: error.response.status,
      };
      return Promise.reject(apiError);
    }
    
    const networkError: ApiError = {
      message: 'Network error. Please check your connection.',
      statusCode: 0,
    };
    return Promise.reject(networkError);
  }
);

// API Client with methods
export const apiClient = {
  // Auth endpoints
  auth: {
    login: async (credentials: LoginRequest): Promise<LoginResponse> => {
      const response = await axiosInstance.post<LoginResponse>('/auth/login', credentials);
      return response.data;
    },
    
    me: async () => {
      const response = await axiosInstance.get('/auth/me');
      return response.data;
    },
  },
  
  // Attendees endpoints
  attendees: {
    getAll: async () => {
      const response = await axiosInstance.get('/attendees');
      return response.data;
    },
    
    getById: async (id: number) => {
      const response = await axiosInstance.get(`/attendees/${id}`);
      return response.data;
    },
    
    checkIn: async (id: number) => {
      const response = await axiosInstance.post(`/attendees/checkin/${id}`);
      return response.data;
    },
    
    isCheckedIn: async (id: number) => {
      const response = await axiosInstance.get(`/attendees/ischeckedin/${id}`);
      return response.data;
    },
    
    updateLunch: async (userId: number, lunchId: 1 | 2, value: boolean) => {
      const response = await axiosInstance.post('/attendees/update/lunch', {
        userId,
        lunchId,
        value,
      });
      return response.data;
    },
    
    sessionCheckIn: async (userId: number, session: string) => {
      const response = await axiosInstance.post('/attendees/session/checkin', {
        userId,
        session,
      });
      return response.data;
    },
  },
  
  // Tickets endpoints (placeholder for future use)
  tickets: {
    getAll: async () => {
      const response = await axiosInstance.get('/tickets');
      return response.data;
    },
    
    scan: async (ticketId: string) => {
      const response = await axiosInstance.post(`/tickets/${ticketId}/scan`);
      return response.data;
    },
  },
};

