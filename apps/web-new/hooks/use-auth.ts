import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient, LoginRequest, LoginResponse, ApiError } from '@/lib/api';
import { authService } from '@/lib/auth';

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

// Login mutation
export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation<LoginResponse, ApiError, LoginRequest>({
    mutationFn: (credentials) => apiClient.auth.login(credentials),
    onSuccess: (data) => {
      // Save auth data to localStorage
      authService.saveAuthData(data);
      
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
      
      // Redirect to dashboard
      router.push('/dashboard');
    },
  });
}

// Logout mutation
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Clear auth data from localStorage
      authService.clearAuth();
    },
    onSuccess: () => {
      // Clear all queries
      queryClient.clear();
      
      // Redirect to signin
      router.push('/signin');
    },
  });
}

// Get current user query
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: () => apiClient.auth.me(),
    enabled: authService.isAuthenticated(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
