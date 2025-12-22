import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Attendee, PaginatedResponse } from '@/types/attendee';

// Query keys
export const attendeeKeys = {
  all: ['attendees'] as const,
  lists: () => [...attendeeKeys.all, 'list'] as const,
  list: (filters?: { page?: number; limit?: number; search?: string; ticketSent?: boolean }) => [...attendeeKeys.lists(), filters] as const,
  details: () => [...attendeeKeys.all, 'detail'] as const,
  detail: (id: number) => [...attendeeKeys.details(), id] as const,
};

// Get all attendees with pagination
export function useAttendees(params?: { page?: number; limit?: number; search?: string; ticketSent?: boolean }) {
  return useQuery<PaginatedResponse<Attendee>>({
    queryKey: attendeeKeys.list(params),
    queryFn: () => apiClient.attendees.getAll(params),
    placeholderData: keepPreviousData,
  });
}

// Get attendee by ID
export function useAttendee(id: number) {
  return useQuery<Attendee>({
    queryKey: attendeeKeys.detail(id),
    queryFn: () => apiClient.attendees.getById(id),
    enabled: !!id && id > 0,
  });
}

// Check-in attendee mutation
export function useCheckInAttendee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiClient.attendees.checkIn(id),
    onSuccess: (_, id) => {
      // Invalidate the specific attendee query
      queryClient.invalidateQueries({ queryKey: attendeeKeys.detail(id) });
      // Also invalidate the list
      queryClient.invalidateQueries({ queryKey: attendeeKeys.lists() });
    },
  });
}

// Check if attendee is checked in
export function useIsCheckedIn(id: number) {
  return useQuery({
    queryKey: [...attendeeKeys.detail(id), 'checked-in'],
    queryFn: () => apiClient.attendees.isCheckedIn(id),
    enabled: !!id && id > 0,
  });
}

// Update lunch status mutation
export function useUpdateLunch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, lunchId, value }: { userId: number; lunchId: 1 | 2; value: boolean }) =>
      apiClient.attendees.updateLunch(userId, lunchId, value),
    onSuccess: (_, { userId }) => {
      // Invalidate the specific attendee query
      queryClient.invalidateQueries({ queryKey: attendeeKeys.detail(userId) });
      // Also invalidate the list
      queryClient.invalidateQueries({ queryKey: attendeeKeys.lists() });
    },
  });
}

// Session check-in mutation
export function useSessionCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, session }: { userId: number; session: string }) =>
      apiClient.attendees.sessionCheckIn(userId, session),
    onSuccess: (_, { userId }) => {
      // Invalidate the specific attendee query
      queryClient.invalidateQueries({ queryKey: attendeeKeys.detail(userId) });
      // Also invalidate the list
      queryClient.invalidateQueries({ queryKey: attendeeKeys.lists() });
    },
  });
}

// Delete attendee mutation
export function useDeleteAttendee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiClient.attendees.delete(id),
    onSuccess: (_, id) => {
      // Invalidate the specific attendee query
      queryClient.invalidateQueries({ queryKey: attendeeKeys.detail(id) });
      // Also invalidate the list
      queryClient.invalidateQueries({ queryKey: attendeeKeys.lists() });
    },
  });
}

// Bulk delete attendees mutation
export function useBulkDeleteAttendees() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: number[]) => apiClient.attendees.bulkDelete(ids),
    onSuccess: () => {
      // Invalidate all attendee queries
      queryClient.invalidateQueries({ queryKey: attendeeKeys.all });
    },
  });
}

// Import attendees from CSV
export function useImportAttendeesFromCsv() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => apiClient.attendees.importCsv(file),
    onSuccess: () => {
      // Invalidate all attendee queries to refresh the list
      queryClient.invalidateQueries({ queryKey: attendeeKeys.all });
    },
  });
}

// Bulk send tickets mutation
export function useBulkSendTickets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: number[]) => apiClient.attendees.bulkSendTickets(ids),
    onSuccess: () => {
      // Invalidate all attendee queries to refresh the list
      queryClient.invalidateQueries({ queryKey: attendeeKeys.all });
    },
  });
}

// Resend single ticket mutation
export function useResendTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiClient.attendees.resendTicket(id),
    onSuccess: (_, id) => {
      // Invalidate the specific attendee query
      queryClient.invalidateQueries({ queryKey: attendeeKeys.detail(id) });
      // Also invalidate the list
      queryClient.invalidateQueries({ queryKey: attendeeKeys.lists() });
    },
  });
}
