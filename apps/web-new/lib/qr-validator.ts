import { QRTicketData, QRValidationResult } from '@/types/attendee';

/**
 * Validates and parses QR code data
 * Expected format: JSON string with { id: number, email: string, full_name: string }
 */
export function validateQRData(qrString: string): QRValidationResult {
  try {
    // Check if string is empty
    if (!qrString || qrString.trim() === '') {
      return {
        isValid: false,
        error: 'QR code is empty',
      };
    }

    // Try to parse as JSON
    let data: any;
    try {
      data = JSON.parse(qrString);
    } catch (parseError) {
      return {
        isValid: false,
        error: 'Invalid QR code format. Expected JSON data.',
      };
    }

    // Check if data is an object
    if (typeof data !== 'object' || data === null) {
      return {
        isValid: false,
        error: 'Invalid QR code structure',
      };
    }

    // Validate required fields
    const { id, email, full_name } = data;

    // Check if all required fields exist
    if (!id && id !== 0) {
      return {
        isValid: false,
        error: 'Missing required field: id',
      };
    }

    if (!email) {
      return {
        isValid: false,
        error: 'Missing required field: email',
      };
    }

    if (!full_name) {
      return {
        isValid: false,
        error: 'Missing required field: full_name',
      };
    }

    // Validate id is a number
    const numericId = Number(id);
    if (isNaN(numericId) || !Number.isInteger(numericId) || numericId < 0) {
      return {
        isValid: false,
        error: 'Invalid ID: must be a positive integer',
      };
    }

    // Validate email format (basic check)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        isValid: false,
        error: 'Invalid email format',
      };
    }

    // Validate full_name is a non-empty string
    if (typeof full_name !== 'string' || full_name.trim() === '') {
      return {
        isValid: false,
        error: 'Invalid name: must be a non-empty string',
      };
    }

    // All validations passed
    const validatedData: QRTicketData = {
      id: numericId,
      email: email.trim(),
      full_name: full_name.trim(),
    };

    return {
      isValid: true,
      data: validatedData,
    };
  } catch (error) {
    // Catch any unexpected errors
    return {
      isValid: false,
      error: 'Unexpected error while validating QR code',
    };
  }
}
