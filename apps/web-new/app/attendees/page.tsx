'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAttendees, useBulkDeleteAttendees, useImportAttendeesFromCsv, useBulkSendTickets } from '@/hooks/use-attendees';
import { useLogout } from '@/hooks/use-auth';
import { authService } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Attendee } from '@/types/attendee';

type TicketSentFilter = 'all' | 'sent' | 'not-sent';

export default function AttendeesPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSendTicketsConfirm, setShowSendTicketsConfirm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{ success: boolean; inserted: number; errors: any[] } | null>(null);
  const [ticketSentFilter, setTicketSentFilter] = useState<TicketSentFilter>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const limit = 10;

  const logoutMutation = useLogout();
  const bulkDeleteMutation = useBulkDeleteAttendees();
  const bulkSendTicketsMutation = useBulkSendTickets();
  const importCsvMutation = useImportAttendeesFromCsv();
  const { data: attendeesData, isLoading: isLoadingAttendees, isError, error } = useAttendees({
    page,
    limit,
    search: debouncedSearch || undefined,
    ticketSent: ticketSentFilter === 'all' ? undefined : ticketSentFilter === 'sent',
  });

  // Get current page attendee IDs for "select all" functionality
  const currentPageIds = useMemo(() => {
    return attendeesData?.data?.map((a) => a.id) || [];
  }, [attendeesData?.data]);

  // Check if all items on current page are selected
  const allSelected = useMemo(() => {
    return currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.has(id));
  }, [currentPageIds, selectedIds]);

  // Check if some items on current page are selected
  const someSelected = useMemo(() => {
    return currentPageIds.some((id) => selectedIds.has(id)) && !allSelected;
  }, [currentPageIds, selectedIds, allSelected]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Clear selection when page or search changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, debouncedSearch, ticketSentFilter]);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/signin');
      return;
    }
    setUsername(authService.getUsername());
    setIsLoading(false);
  }, [router]);

  const handleSignOut = () => {
    logoutMutation.mutate();
  };

  const handleSelectAll = () => {
    if (allSelected) {
      // Deselect all on current page
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        currentPageIds.forEach((id) => newSet.delete(id));
        return newSet;
      });
    } else {
      // Select all on current page
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        currentPageIds.forEach((id) => newSet.add(id));
        return newSet;
      });
    }
  };

  const handleSelectOne = (id: number) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    bulkDeleteMutation.mutate(Array.from(selectedIds), {
      onSuccess: () => {
        setSelectedIds(new Set());
        setShowDeleteConfirm(false);
      },
      onError: () => {
        setShowDeleteConfirm(false);
      },
    });
  };

  const handleSendTicketsSelected = () => {
    if (selectedIds.size === 0) return;
    setShowSendTicketsConfirm(true);
  };

  const confirmSendTickets = () => {
    bulkSendTicketsMutation.mutate(Array.from(selectedIds), {
      onSuccess: () => {
        setSelectedIds(new Set());
        setShowSendTicketsConfirm(false);
      },
      onError: () => {
        setShowSendTicketsConfirm(false);
      },
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleImportClick = () => {
    setShowImportModal(true);
    setSelectedFile(null);
    setImportResult(null);
  };

  const handleImportSubmit = () => {
    if (!selectedFile) return;
    
    importCsvMutation.mutate(selectedFile, {
      onSuccess: (data) => {
        setImportResult(data);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
      onError: (error: any) => {
        setImportResult({
          success: false,
          inserted: 0,
          errors: [error.message || 'Failed to import CSV'],
        });
      },
    });
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setSelectedFile(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600 dark:border-purple-900 dark:border-t-purple-400"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 shadow-lg shadow-purple-500/30 transition-transform hover:scale-105"
            >
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
                  d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">AWS Ticket</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Attendees Management</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                <svg
                  className="h-4 w-4 text-purple-600 dark:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{username}</span>
            </div>
            <Button variant="outline" onClick={handleSignOut} size="sm">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              Attendees
            </h2>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              View and manage event attendees
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleImportClick}>
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Import CSV
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Search and Stats */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <svg
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <Input
                    type="text"
                    placeholder="Search by name, email or phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {/* Ticket Sent Filter */}
                <select
                  value={ticketSentFilter}
                  onChange={(e) => {
                    setTicketSentFilter(e.target.value as TicketSentFilter);
                    setPage(1);
                  }}
                  className="h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="all">All Tickets</option>
                  <option value="sent">Ticket Sent</option>
                  <option value="not-sent">Ticket Not Sent</option>
                </select>
              </div>
              {attendeesData?.meta && (
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  {selectedIds.size > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-purple-600 dark:text-purple-400">
                        {selectedIds.size} selected
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSendTicketsSelected}
                        className="border-green-300 text-green-600 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950"
                        disabled={bulkSendTicketsMutation.isPending}
                      >
                        <svg
                          className="mr-1 h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        {bulkSendTicketsMutation.isPending ? 'Sending...' : 'Send Tickets'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeleteSelected}
                        className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950"
                        disabled={bulkDeleteMutation.isPending}
                      >
                        <svg
                          className="mr-1 h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        {bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  )}
                  <span>
                    Total: <strong className="text-gray-900 dark:text-white">{attendeesData.meta.total}</strong> attendees
                  </span>
                  <span>
                    Page <strong className="text-gray-900 dark:text-white">{attendeesData.meta.page}</strong> of{' '}
                    <strong className="text-gray-900 dark:text-white">{attendeesData.meta.totalPages || 1}</strong>
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Attendees Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <svg
                  className="h-5 w-5 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              Attendees List
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAttendees ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
              </div>
            ) : isError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-900 dark:bg-red-950/30">
                <p className="text-red-600 dark:text-red-400">
                  Error loading attendees: {(error as any)?.message || 'Unknown error'}
                </p>
              </div>
            ) : attendeesData?.data?.length === 0 ? (
              <div className="py-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No attendees found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {search ? 'Try a different search term.' : 'No attendees have been registered yet.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800">
                      <th className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = someSelected;
                          }}
                          onChange={handleSelectAll}
                          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800"
                        />
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">Name</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">Email</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">Phone</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">Food</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-900 dark:text-white">Status</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-900 dark:text-white">Lunch 1</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-900 dark:text-white">Lunch 2</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">Check-in Time</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-900 dark:text-white">Ticket</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendeesData?.data?.map((attendee: Attendee) => (
                      <tr
                        key={attendee.id}
                        className={`border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900 ${
                          selectedIds.has(attendee.id) ? 'bg-purple-50 dark:bg-purple-950/30' : ''
                        }`}
                      >
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(attendee.id)}
                            onChange={() => handleSelectOne(attendee.id)}
                            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {attendee.full_name}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {attendee.email}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {attendee.phone}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                            {attendee.food_preference || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {attendee.checked_in ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300">
                              <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Checked In
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {attendee.lunch ? (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400">
                              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </span>
                          ) : (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
                              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {attendee.lunch2 ? (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400">
                              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </span>
                          ) : (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
                              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {formatDate(attendee.check_in_time)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {attendee.ticket_sent ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300">
                              <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Sent
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                              Not Sent
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {attendeesData?.meta && attendeesData.meta.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-800">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {((attendeesData.meta.page - 1) * limit) + 1} to{' '}
                  {Math.min(attendeesData.meta.page * limit, attendeesData.meta.total)} of{' '}
                  {attendeesData.meta.total} results
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(1)}
                    disabled={!attendeesData.meta.hasPreviousPage}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <svg className="h-4 w-4 -ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!attendeesData.meta.hasPreviousPage}
                  >
                    <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </Button>
                  
                  {/* Page numbers */}
                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: Math.min(5, attendeesData.meta.totalPages) }, (_, i) => {
                      let pageNum: number;
                      const totalPages = attendeesData.meta.totalPages;
                      const currentPage = attendeesData.meta.page;
                      
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === currentPage ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                          className="w-9"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(attendeesData.meta.totalPages, p + 1))}
                    disabled={!attendeesData.meta.hasNextPage}
                  >
                    Next
                    <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(attendeesData.meta.totalPages)}
                    disabled={!attendeesData.meta.hasNextPage}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7" />
                    </svg>
                    <svg className="h-4 w-4 -ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7" />
                    </svg>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          
          {/* Modal */}
          <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <svg
                  className="h-6 w-6 text-red-600 dark:text-red-400"
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
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Delete Attendees
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Are you sure you want to delete{' '}
              <strong className="text-gray-900 dark:text-white">{selectedIds.size}</strong>{' '}
              attendee{selectedIds.size > 1 ? 's' : ''}? This will permanently remove their data.
            </p>
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={bulkDeleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                disabled={bulkDeleteMutation.isPending}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {bulkDeleteMutation.isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Deleting...
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeImportModal}
          />
          
          {/* Modal */}
          <div className="relative z-10 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                <svg
                  className="h-6 w-6 text-purple-600 dark:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Import Attendees from CSV
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Upload a CSV file to bulk import attendees
                </p>
              </div>
            </div>

            {/* Expected format info */}
            <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Expected CSV columns:</p>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                <li>• <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">Email Address</code></li>
                <li>• <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">Full Name</code></li>
                <li>• <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">Contact Number</code></li>
                <li>• <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">Select 4 (1 from each row) Breakout Session...</code> (comma-separated)</li>
              </ul>
            </div>
            
            {/* File input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select CSV File
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 dark:text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-purple-100 file:text-purple-700
                  hover:file:bg-purple-200
                  dark:file:bg-purple-900 dark:file:text-purple-300
                  dark:hover:file:bg-purple-800
                  cursor-pointer"
              />
              {selectedFile && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Selected: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {/* Import result */}
            {importResult && (
              <div className={`mb-4 rounded-lg border p-3 ${
                importResult.success 
                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30' 
                  : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30'
              }`}>
                <div className="flex items-start gap-2">
                  {importResult.success ? (
                    <svg className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  <div>
                    <p className={`text-sm font-medium ${
                      importResult.success 
                        ? 'text-green-800 dark:text-green-300' 
                        : 'text-red-800 dark:text-red-300'
                    }`}>
                      {importResult.success 
                        ? `Successfully imported ${importResult.inserted} attendee(s)` 
                        : 'Import failed'}
                    </p>
                    {importResult.errors && importResult.errors.length > 0 && (
                      <div className="mt-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {importResult.errors.length} error(s):
                        </p>
                        <ul className="mt-1 max-h-20 overflow-y-auto text-xs text-gray-500 dark:text-gray-400">
                          {importResult.errors.slice(0, 5).map((err, i) => (
                            <li key={i}>• {typeof err === 'string' ? err : JSON.stringify(err)}</li>
                          ))}
                          {importResult.errors.length > 5 && (
                            <li>... and {importResult.errors.length - 5} more</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={closeImportModal}
                disabled={importCsvMutation.isPending}
              >
                {importResult?.success ? 'Close' : 'Cancel'}
              </Button>
              {!importResult?.success && (
                <Button
                  onClick={handleImportSubmit}
                  disabled={!selectedFile || importCsvMutation.isPending}
                >
                  {importCsvMutation.isPending ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Importing...
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
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        />
                      </svg>
                      Import
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Send Tickets Confirmation Modal */}
      {showSendTicketsConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowSendTicketsConfirm(false)}
          />
          
          {/* Modal */}
          <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                <svg
                  className="h-6 w-6 text-purple-600 dark:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Send Tickets
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Email tickets to selected attendees
                </p>
              </div>
            </div>
            
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Are you sure you want to send ticket emails to{' '}
              <strong className="text-gray-900 dark:text-white">{selectedIds.size}</strong>{' '}
              attendee{selectedIds.size > 1 ? 's' : ''}? This will queue the emails for delivery.
            </p>
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowSendTicketsConfirm(false)}
                disabled={bulkSendTicketsMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmSendTickets}
                disabled={bulkSendTicketsMutation.isPending}
              >
                {bulkSendTicketsMutation.isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Sending...
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
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                    Send Tickets
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
