import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Attendee } from '@/types/attendee';

// Query keys
export const attendeeKeys = {
  all: ['attendees'] as const,
  lists: () => [...attendeeKeys.all, 'list'] as const,
  list: (filters?: any) => [...attendeeKeys.lists(), filters] as const,
  details: () => [...attendeeKeys.all, 'detail'] as const,
  detail: (id: number) => [...attendeeKeys.details(), id] as const,
};

// Get all attendees
export function useAttendees() {
  return useQuery({
    queryKey: attendeeKeys.lists(),
    queryFn: () => apiClient.attendees.getAll(),
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
