import { LoginResponse } from './api';

const TOKEN_KEY = 'auth_token';
const USERNAME_KEY = 'username';

export const authService = {
  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  },

  setUsername(username: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USERNAME_KEY, username);
    }
  },

  getUsername(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(USERNAME_KEY);
    }
    return null;
  },

  saveAuthData(data: LoginResponse): void {
    this.setToken(data.accessToken);
    this.setUsername(data.username);
  },

  clearAuth(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USERNAME_KEY);
    }
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
