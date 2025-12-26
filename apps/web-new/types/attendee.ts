// Attendee Types
export interface Attendee {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  food_preference: string;
  session_choice: string[];
  checked_in: boolean;
  check_in_time: Date | null;
  lunch: boolean;
  lunch2: boolean;
  ticket_sent: boolean;
  created_at: Date;
  updated_at: Date;
}

// Create Attendee DTO
export interface CreateAttendeeDto {
  full_name: string;
  email: string;
  phone: string;
  food_preference: string;
  session_choice?: string[];
  checked_in?: boolean;
  check_in_time?: string;
  lunch?: boolean;
  lunch2?: boolean;
}

// Pagination Meta
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Paginated Response
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// QR Code Data Structure
export interface QRTicketData {
  id: number;
  email: string;
  full_name: string;
}

// Validation result
export interface QRValidationResult {
  isValid: boolean;
  data?: QRTicketData;
  error?: string;
}
