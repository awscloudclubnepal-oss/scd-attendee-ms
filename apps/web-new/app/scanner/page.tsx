'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';
import { useLogout } from '@/hooks/use-auth';
import { useAttendee, useCheckInAttendee } from '@/hooks/use-attendees';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { QRScanner } from '@/components/scanner/qr-scanner';
import { AttendeeDetails } from '@/components/attendees/attendee-details';
import { validateQRData } from '@/lib/qr-validator';
import { QRTicketData } from '@/types/attendee';

export default function ScannerPage() {
  const router = useRouter();
  const logoutMutation = useLogout();
  const [username, setUsername] = useState<string | null>(null);
  const [scannedData, setScannedData] = useState<QRTicketData | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch attendee data when QR is scanned
  const attendeeQuery = useAttendee(scannedData?.id || 0);
  const checkInMutation = useCheckInAttendee();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/signin');
      return;
    }
    setUsername(authService.getUsername());
  }, [router]);

  const handleScan = (qrString: string) => {
    // Clear previous messages
    setValidationError(null);
    setSuccessMessage(null);

    // Validate QR data
    const validation = validateQRData(qrString);

    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid QR code');
      return;
    }

    // Set scanned data (this will trigger the attendee query)
    setScannedData(validation.data!);
  };

  const handleScanError = (error: string) => {
    setValidationError(error);
  };

  const handleCheckIn = () => {
    if (!scannedData) return;

    checkInMutation.mutate(scannedData.id, {
      onSuccess: () => {
        setSuccessMessage('Attendee checked in successfully!');
        // Clear scanned data after a delay
        setTimeout(() => {
          setScannedData(null);
          setSuccessMessage(null);
        }, 3000);
      },
      onError: (error: any) => {
        setValidationError(error.message || 'Failed to check in attendee');
      },
    });
  };

  const handleCloseDetails = () => {
    setScannedData(null);
    setValidationError(null);
    setSuccessMessage(null);
  };

  const handleSignOut = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 shadow-lg shadow-purple-500/30">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                Ticket Scanner
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Scan QR codes to check in
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {username}
              </span>
            </div>
            <Button variant="outline" onClick={handleSignOut} size="sm">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Success Message */}
          {successMessage && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
              <div className="flex items-center gap-3">
                <svg
                  className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  {successMessage}
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {validationError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
              <div className="flex items-center gap-3">
                <svg
                  className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    {validationError}
                  </p>
                  <button
                    onClick={() => setValidationError(null)}
                    className="mt-1 text-xs text-red-600 underline dark:text-red-400"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Attendee Details (if scanned and valid) */}
          {scannedData && attendeeQuery.data && (
            <AttendeeDetails
              attendee={attendeeQuery.data}
              onCheckIn={handleCheckIn}
              isCheckingIn={checkInMutation.isPending}
              onClose={handleCloseDetails}
            />
          )}

          {/* Loading attendee data */}
          {scannedData && attendeeQuery.isLoading && (
            <Card className="p-8">
              <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600 dark:border-purple-900 dark:border-t-purple-400"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Loading attendee data...
                </p>
              </div>
            </Card>
          )}

          {/* Attendee not found */}
          {scannedData && attendeeQuery.isError && (
            <Card className="border-red-200 p-6 dark:border-red-900">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                  Attendee Not Found
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  No attendee found with ID: {scannedData.id}
                </p>
                <Button onClick={handleCloseDetails} className="mt-4">
                  Scan Another Ticket
                </Button>
              </div>
            </Card>
          )}

          {/* QR Scanner */}
          {!scannedData && <QRScanner onScan={handleScan} onError={handleScanError} />}
        </div>
      </main>
    </div>
  );
}
