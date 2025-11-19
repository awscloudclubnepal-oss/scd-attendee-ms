// Authentication Types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  username: string;
}

export interface User {
  username: string;
  role?: string;
}

// API Error Types
export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
