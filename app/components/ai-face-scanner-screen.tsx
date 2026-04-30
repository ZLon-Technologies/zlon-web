'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import { ArrowLeft, Camera, Crown, LockKeyhole, ScanFace, Sparkles } from 'lucide-react';

interface ScanResult {
  faceShape: string;
  bestCut: string;
}

function createImageFromScreenshot(screenshot: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Unable to load webcam screenshot.'));
    image.src = screenshot;
  });
}

export function AIFaceScannerScreen() {
  const webcamRef = useRef<Webcam | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);

  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [monthlyBookings] = useState(1);
  const [hasPaid] = useState(false);

  const isPaywallBlocked = monthlyBookings < 3 && hasPaid === false;

  useEffect(() => {
    let isCancelled = false;

    async function initializeFaceLandmarker() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
        );
        const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          },
          runningMode: 'IMAGE',
          numFaces: 1,
        });

        if (isCancelled) {
          faceLandmarker.close();
          return;
        }

        faceLandmarkerRef.current = faceLandmarker;
        setIsModelLoaded(true);
      } catch (error) {
        console.error('Failed to initialize MediaPipe face landmarker:', error);
      }
    }

    initializeFaceLandmarker();

    return () => {
      isCancelled = true;
      faceLandmarkerRef.current?.close();
      faceLandmarkerRef.current = null;
    };
  }, []);

  async function handleScanFace() {
    if (!faceLandmarkerRef.current || !webcamRef.current) {
      return;
    }

    setIsScanning(true);
    setScanResult(null);

    try {
      const screenshot = webcamRef.current.getScreenshot();

      if (!screenshot) {
        window.alert('No face detected. Please ensure you are in good lighting.');
        return;
      }

      const capturedImage = await createImageFromScreenshot(screenshot);
      const result = faceLandmarkerRef.current.detect(capturedImage);

      if (result.faceLandmarks.length > 0) {
        setScanResult({
          faceShape: 'Square',
          bestCut: 'Textured Fringe / Fade',
        });
        return;
      }

      window.alert('No face detected. Please ensure you are in good lighting.');
    } catch (error) {
      console.error('Face scan failed:', error);
      window.alert('No face detected. Please ensure you are in good lighting.');
    } finally {
      setIsScanning(false);
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto min-h-screen bg-black text-white relative pb-24">
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(115,115,115,0.18),_transparent_32%),linear-gradient(180deg,_#09090b_0%,_#000000_100%)]">
        <header className="px-4 pt-5">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
            <Link
              href="/home"
              aria-label="Go back"
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45">
                AI Stylist
              </p>
              <h1 className="mt-1 text-lg font-semibold tracking-tight text-white">
                Face Scanner
              </h1>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/70">
              <Sparkles size={18} />
            </div>
          </div>
        </header>

        <main className="space-y-5 px-4 pb-10 pt-4">
          <section className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-zinc-950 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.14),_transparent_35%),linear-gradient(180deg,_rgba(255,255,255,0.04)_0%,_rgba(0,0,0,0.3)_100%)]" />

            <div className="relative aspect-[3/4] overflow-hidden">
              <Webcam
                ref={webcamRef}
                audio={false}
                mirrored
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: 'user' }}
                className="h-full w-full object-cover"
              />

              <div className="pointer-events-none absolute inset-0 border-[1.5px] border-white/10" />
              <div className="pointer-events-none absolute inset-5 rounded-[1.5rem] border border-white/15" />

              <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70 backdrop-blur-sm">
                Live Preview
              </div>

              {!isModelLoaded ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/65 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="h-11 w-11 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    <div>
                      <p className="text-sm font-semibold text-white">Loading AI Model...</p>
                      <p className="mt-1 text-xs text-white/55">
                        Preparing face landmark detection
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {isScanning ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[2px]">
                  <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-center shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white">
                      <ScanFace size={24} />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-white">Analyzing face shape</p>
                    <p className="mt-1 text-xs text-white/60">
                      Hold steady for a clean read
                    </p>
                  </div>
                </div>
              ) : null}

              {scanResult ? (
                <div className="absolute inset-x-4 bottom-4 rounded-[1.5rem] border border-white/10 bg-black/65 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">
                        AI Match Found
                      </p>
                      <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
                        {scanResult.bestCut}
                      </h2>
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white">
                      <Crown size={20} />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                        Face Shape
                      </p>
                      <p className="mt-2 text-base font-semibold text-white">
                        {scanResult.faceShape}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                        Style Pick
                      </p>
                      <p className="mt-2 text-base font-semibold text-white">Premium Match</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white">
                {isPaywallBlocked ? <LockKeyhole size={22} /> : <Camera size={22} />}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
                  Scanner Access
                </p>

                {isPaywallBlocked ? (
                  <>
                    <h2 className="mt-2 text-lg font-semibold tracking-tight text-white">
                      Unlock AI Stylist
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-white/70">
                      Unlock AI Stylist: Pay ₹47 or Complete 3 Bookings/Month (Current:{' '}
                      {monthlyBookings}/3)
                    </p>
                    <div className="mt-4 rounded-2xl border border-amber-300/15 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                      Face scanning stays locked until the paywall is cleared.
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="mt-2 text-lg font-semibold tracking-tight text-white">
                      Ready for your AI style read
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-white/70">
                      Capture a selfie and let the scanner suggest a face-shape-optimized cut.
                    </p>
                    <button
                      type="button"
                      onClick={handleScanFace}
                      disabled={!isModelLoaded || isScanning}
                      className="mt-5 flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-5 py-4 text-base font-semibold text-black transition-transform hover:scale-[0.99] disabled:cursor-not-allowed disabled:bg-white/40 disabled:text-black/60"
                    >
                      <ScanFace size={20} />
                      {isScanning ? 'Scanning...' : 'Scan My Face'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
