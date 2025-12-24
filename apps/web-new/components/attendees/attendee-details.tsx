'use client';

import { useState } from 'react';
import { Attendee } from '@/types/attendee';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useUpdateLunch, useSessionCheckIn } from '@/hooks/use-attendees';

interface AttendeeDetailsProps {
  attendee: Attendee;
  onCheckIn?: () => void;
  isCheckingIn?: boolean;
  onClose?: () => void;
}

// Hardcoded session list
const AVAILABLE_SESSIONS = [
  'Opening Keynote',
  'AWS Security Best Practices',
  'Serverless Architecture',
  'Machine Learning on AWS',
  'DevOps with AWS',
  'Closing Session',
];

export function AttendeeDetails({ 
  attendee, 
  onCheckIn, 
  isCheckingIn = false,
  onClose 
}: AttendeeDetailsProps) {
  const [selectedSession, setSelectedSession] = useState<string>('');
  const updateLunchMutation = useUpdateLunch();
  const sessionCheckInMutation = useSessionCheckIn();

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const handleLunchUpdate = async (lunchId: 1 | 2, value: boolean) => {
    try {
      await updateLunchMutation.mutateAsync({
        userId: attendee.id,
        lunchId,
        value,
      });
    } catch (error) {
      console.error('Failed to update lunch status:', error);
    }
  };

  const handleSessionCheckIn = async () => {
    if (!selectedSession) return;

    try {
      await sessionCheckInMutation.mutateAsync({
        userId: attendee.id,
        session: selectedSession,
      });
      setSelectedSession(''); // Reset selection
    } catch (error) {
      console.error('Failed to check in to session:', error);
    }
  };

  return (
    <Card className="border-purple-200 dark:border-purple-800">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">{attendee.full_name}</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ID: {attendee.id}
            </p>
          </div>
          {attendee.checked_in && (
            <div className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
              ✓ Checked In
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {/* Contact Information */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Contact Information
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
              <p className="text-sm font-medium">{attendee.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
              <p className="text-sm font-medium">{attendee.phone}</p>
            </div>
          </div>
        </div>

        {/* Event Details */}
        <div className="space-y-3 border-t pt-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Event Details
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Food Preference
              </p>
              <p className="text-sm font-medium capitalize">
                {attendee.food_preference || 'N/A'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Session Choices
              </p>
              <p className="text-sm font-medium">
                {attendee.session_choice?.length > 0
                  ? attendee.session_choice.join(', ')
                  : 'None'}
              </p>
            </div>
          </div>
        </div>

        {/* Check-in Status */}
        <div className="space-y-3 border-t pt-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Check-in Status
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Check-in Time
              </p>
              <p className="text-sm font-medium">
                {formatDate(attendee.check_in_time)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Registered
              </p>
              <p className="text-sm font-medium">
                {formatDate(attendee.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Meal Status */}
        <div className="space-y-3 border-t pt-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Meal Status
          </h3>
          {attendee.checked_in ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      attendee.lunch ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                  <span className="text-sm font-medium">Breakfast</span>
                </div>
                <Button
                  size="sm"
                  variant={attendee.lunch ? 'outline' : 'default'}
                  onClick={() => handleLunchUpdate(1, !attendee.lunch)}
                  disabled={updateLunchMutation.isPending}
                >
                  {attendee.lunch ? 'Unmark' : 'Mark Served'}
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      attendee.lunch2 ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                  <span className="text-sm font-medium">Lunch</span>
                </div>
                <Button
                  size="sm"
                  variant={attendee.lunch2 ? 'outline' : 'default'}
                  onClick={() => handleLunchUpdate(2, !attendee.lunch2)}
                  disabled={updateLunchMutation.isPending}
                >
                  {attendee.lunch2 ? 'Unmark' : 'Mark Served'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full ${
                    attendee.lunch ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
                <span className="text-sm">Lunch 1</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full ${
                    attendee.lunch2 ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
                <span className="text-sm">Lunch 2</span>
              </div>
            </div>
          )}
        </div>

        {/* Session Check-in (only shown when checked in) */}
        {attendee.checked_in && (
          <div className="space-y-3 border-t pt-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Session Check-in
            </h3>
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-sm text-gray-500 dark:text-gray-400">
                  Current Sessions
                </label>
                <div className="rounded-md bg-gray-50 p-3 dark:bg-gray-900">
                  {attendee.session_choice?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {attendee.session_choice.map((session, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                        >
                          {session}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No sessions checked in yet</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Select
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(e.target.value)}
                  className="flex-1"
                  disabled={sessionCheckInMutation.isPending}
                >
                  <option value="">Select a session...</option>
                  {AVAILABLE_SESSIONS.map((session) => (
                    <option key={session} value={session}>
                      {session}
                    </option>
                  ))}
                </Select>
                <Button
                  onClick={handleSessionCheckIn}
                  disabled={!selectedSession || sessionCheckInMutation.isPending}
                  className="whitespace-nowrap"
                >
                  {sessionCheckInMutation.isPending ? (
                    <>
                      <svg
                        className="mr-2 h-4 w-4 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Checking...
                    </>
                  ) : (
                    'Check In'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 border-t pt-4">
          {!attendee.checked_in && onCheckIn && (
            <Button
              onClick={onCheckIn}
              disabled={isCheckingIn}
              className="flex-1"
            >
              {isCheckingIn ? (
                <>
                  <svg
                    className="mr-2 h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Checking in...
                </>
              ) : (
                <>
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Check In Attendee
                </>
              )}
            </Button>
          )}
          {onClose && (
            <Button onClick={onClose} variant="outline" className="flex-1">
              {attendee.checked_in ? 'Done' : 'Cancel'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
