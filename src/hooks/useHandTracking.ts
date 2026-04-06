import { useEffect, useRef, useCallback } from 'react';
import { HandLandmark } from '../types';

interface UseHandTrackingOptions {
  videoRef: React.RefObject<HTMLVideoElement>;
  onResults: (landmarks: HandLandmark[] | null) => void;
  onStatusChange?: (status: 'idle' | 'loading' | 'active' | 'error', message?: string) => void;
  enabled: boolean;
}

export function useHandTracking({
  videoRef,
  onResults,
  onStatusChange,
  enabled,
}: UseHandTrackingOptions) {
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameTime = useRef(0);

  const onResultsRef = useRef(onResults);
  onResultsRef.current = onResults;

  const onStatusRef = useRef(onStatusChange);
  onStatusRef.current = onStatusChange;

  const initMediaPipe = useCallback(async () => {
    if (!videoRef.current || !enabled) return;

    onStatusRef.current?.('loading', 'Initializing camera…');

    try {
      const handsModule = await import('@mediapipe/hands');
      const cameraModule = await import('@mediapipe/camera_utils');

      const Hands =
        (window as any).Hands ||
        (handsModule as any).Hands ||
        (handsModule as any).default;

      const Camera =
        (window as any).Camera ||
        (cameraModule as any).Camera ||
        (cameraModule as any).default;

      if (typeof Hands !== 'function') throw new Error('Hands not found');
      if (typeof Camera !== 'function') throw new Error('Camera not found');

      const hands = new Hands({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.75,
        minTrackingConfidence: 0.7,
      });

      hands.onResults((results: any) => {
        if (results.multiHandLandmarks?.length) {
          onResultsRef.current(results.multiHandLandmarks[0]);
        } else {
          onResultsRef.current(null);
        }
      });

      handsRef.current = hands;

      // ----------- CONTROLLED FRAME LOOP -----------

      const processFrame = async () => {
        const now = performance.now();

        // limit to ~30 FPS
        if (now - lastFrameTime.current > 33) {
          lastFrameTime.current = now;

          if (handsRef.current && videoRef.current) {
            await handsRef.current.send({
              image: videoRef.current,
            });
          }
        }

        rafRef.current = requestAnimationFrame(processFrame);
      };

      const camera = new Camera(videoRef.current, {
        onFrame: async () => {},
        width: 640,
        height: 480,
      });

      await camera.start();
      cameraRef.current = camera;

      processFrame(); // start loop

      onStatusRef.current?.('active', 'Camera active');
    } catch (err: any) {
      console.error('MediaPipe error:', err);
      onStatusRef.current?.('error', err.message);
    }
  }, [enabled, videoRef]);

  useEffect(() => {
    if (enabled) {
      initMediaPipe();
    } else {
      cleanup();
    }

    return () => cleanup();
  }, [enabled, initMediaPipe]);

  const cleanup = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }

    if (handsRef.current) {
      handsRef.current.close();
      handsRef.current = null;
    }

    onResultsRef.current(null);
    onStatusRef.current?.('idle');
  };

  return { handsRef, cameraRef };
}