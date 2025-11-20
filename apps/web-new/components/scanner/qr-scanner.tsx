'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = 'qr-reader';

  useEffect(() => {
    // Get available cameras
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          const cameraList = devices.map((device) => ({
            id: device.id,
            label: device.label || `Camera ${device.id}`,
          }));
          setCameras(cameraList);
          // Prefer back camera on mobile
          const backCamera = cameraList.find((cam) =>
            cam.label.toLowerCase().includes('back') || 
            cam.label.toLowerCase().includes('rear')
          );
          setSelectedCamera(backCamera?.id || cameraList[0].id);
        }
      })
      .catch((err) => {
        console.error('Error getting cameras:', err);
        onError?.('Unable to access camera. Please check permissions.');
      });

    return () => {
      // Cleanup on unmount
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startScanning = async () => {
    if (!selectedCamera) {
      onError?.('No camera selected');
      return;
    }

    try {
      const scanner = new Html5Qrcode(scannerDivId, {
        formatsToSupport: undefined,
        verbose: false,
      });
      scannerRef.current = scanner;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.333333, // 4:3
        disableFlip: false,
      };

      await scanner.start(
        selectedCamera,
        config,
        (decodedText) => {
          // Success callback
          console.log('QR Code detected:', decodedText);
          onScan(decodedText);
        },
        (errorMessage) => {
          // Error callback (called frequently during scanning, so we don't show all errors)
          // This is normal behavior - it just means no QR code detected in current frame
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error('Error starting scanner:', err);
      onError?.(err.message || 'Failed to start camera');
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
        setIsScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>QR Code Scanner</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Camera selector */}
        {!isScanning && cameras.length > 1 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Camera</label>
            <select
              value={selectedCamera}
              onChange={(e) => setSelectedCamera(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
            >
              {cameras.map((camera) => (
                <option key={camera.id} value={camera.id}>
                  {camera.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Scanner view */}
        <div className="relative w-full">
          {/* The html5-qrcode library will inject video element here */}
          <div
            id={scannerDivId}
            className="w-full rounded-lg border-2 border-purple-600"
            style={{ 
              display: isScanning ? 'block' : 'none',
            }}
          />
          
          {!isScanning && (
            <div className="flex aspect-square w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
              <div className="text-center">
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
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                  />
                </svg>
                <p className="mt-2 text-sm text-gray-500">
                  Camera preview will appear here
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Control buttons */}
        <div className="flex gap-2">
          {!isScanning ? (
            <Button
              onClick={startScanning}
              disabled={!selectedCamera}
              className="w-full"
            >
              <svg
                className="mr-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Start Camera
            </Button>
          ) : (
            <Button onClick={stopScanning} variant="outline" className="w-full">
              <svg
                className="mr-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Stop Camera
            </Button>
          )}
        </div>

        {/* Instructions */}
        {isScanning && (
          <div className="rounded-md bg-blue-50 p-3 dark:bg-blue-950/30">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Instructions:</strong> Hold the QR code within the scanner frame. The app will automatically detect and process the ticket.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
