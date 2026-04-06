import React, { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { useHandTracking } from '../../hooks/useHandTracking';
import { detectGesture, PointSmoother, GestureDebouncer } from '../../utils/gestureDetector';
import {
  renderStroke,
  drawEraserCursor,
  getStrokeBounds,
  drawSelectionBox,
  hitTestStroke,
} from '../../utils/brushRenderer';
import { HandLandmark, Point, Stroke } from '../../types';
import styles from './Board.module.css';

const smoother = new PointSmoother();
const debouncer = new GestureDebouncer();

export interface BoardHandle {
  getCanvas: () => HTMLCanvasElement | null;
}

export const Board = forwardRef<BoardHandle>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pipVideoRef = useRef<HTMLVideoElement>(null);
  const animFrameRef = useRef<number>(0);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const dragStartRef = useRef<Point | null>(null);
  const dragStrokeOriginRef = useRef<Point[] | null>(null);
  const lastPointRef = useRef<Point | null>(null);

  const [cursorPos, setCursorPos] = useState<Point | null>(null);
  const [gestureLabel, setGestureLabel] = useState<string>('');
  const [cameraStatus, setCameraStatus] = useState<string>('');

  const {
    layers, activeLayerId, theme, brush, color, brushSize, opacity,
    gestureMode, isTracking, effectNodes, selectedStrokeId,
    setGestureMode, addStroke, updateStroke, removeStroke,
    eraseAt, setSelectedStrokeId, pushHistory, undo, redo,
  } = useBoardStore();

  // Expose canvas ref to parent for PNG export
  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
  }));


  // --- Mirror camera stream to PiP video ---
  useEffect(() => {
    if (isTracking && videoRef.current && pipVideoRef.current) {
      const checkStream = setInterval(() => {
        const stream = videoRef.current?.srcObject as MediaStream | null;
        if (stream && pipVideoRef.current) {
          pipVideoRef.current.srcObject = stream;
          pipVideoRef.current.play().catch(() => {});
          clearInterval(checkStream);
        }
      }, 200);
      return () => clearInterval(checkStream);
    } else if (!isTracking && pipVideoRef.current) {
      pipVideoRef.current.srcObject = null;
    }
  }, [isTracking]);

  // --- MAIN RENDER LOOP ---
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const now = Date.now();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw board theme background
    drawBackground(ctx, canvas.width, canvas.height, theme);

    // Render all layers
    layers.forEach((layer) => {
      if (!layer.visible) return;
      layer.strokes.forEach((stroke) => {
        renderStroke(ctx, stroke, effectNodes, now);
      });
    });

    // Draw active stroke being drawn
    if (currentStrokeRef.current) {
      renderStroke(ctx, currentStrokeRef.current, effectNodes, now);
    }

    // Draw selection box
    if (selectedStrokeId) {
      const allStrokes = layers.flatMap((l) => l.strokes);
      const sel = allStrokes.find((s) => s.id === selectedStrokeId);
      if (sel) {
        const bounds = getStrokeBounds(sel);
        drawSelectionBox(ctx, bounds, now);
      }
    }

    animFrameRef.current = requestAnimationFrame(render);
  }, [layers, theme, effectNodes, selectedStrokeId]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [render]);

  // --- OVERLAY: cursor + eraser ---
  useEffect(() => {
    const overlay = overlayCanvasRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    if (cursorPos && gestureMode === 'erase') {
      drawEraserCursor(ctx, cursorPos, brushSize * 5);
    }

    // Gesture mode indicator dot
    if (cursorPos && gestureMode === 'draw') {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cursorPos.x, cursorPos.y, brushSize / 2 + 2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.restore();
    }
  }, [cursorPos, gestureMode, brushSize, color]);

  // --- RESIZE ---
  useEffect(() => {
    const handleResize = () => {
      [canvasRef, overlayCanvasRef].forEach((ref) => {
        if (ref.current && ref.current.parentElement) {
          ref.current.width = ref.current.parentElement.clientWidth;
          ref.current.height = ref.current.parentElement.clientHeight;
        }
      });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- KEYBOARD ---
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedStrokeId) { removeStroke(selectedStrokeId); setSelectedStrokeId(null); }
      }
      if (e.key === 'Escape') setSelectedStrokeId(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedStrokeId, undo, redo, removeStroke, setSelectedStrokeId]);

  // --- HAND LANDMARK → CANVAS POINT ---
  const landmarkToCanvas = useCallback((lm: { x: number; y: number }): Point => {
    const canvas = canvasRef.current!;
    return {
      x: (1 - lm.x) * canvas.width, // mirror X
      y: lm.y * canvas.height,
      timestamp: Date.now(),
    };
  }, []);

  // --- GESTURE HANDLING ---
  const handleLandmarks = useCallback((landmarks: HandLandmark[] | null) => {
    if (!landmarks) {
      setGestureMode('pause');
      setGestureLabel('No hand');
      if (currentStrokeRef.current) {
        addStroke(currentStrokeRef.current);
        pushHistory();
        currentStrokeRef.current = null;
      }
      smoother.reset();
      lastPointRef.current = null;
      return;
    }

    const rawResult = detectGesture(landmarks);
    const result = debouncer.debounce(rawResult);
    setGestureMode(result.mode);

    const labelMap: Record<string, string> = {
      draw: '✍️ Drawing',
      erase: '🖐 Erasing',
      drag: '✌️ Dragging',
      select: '🤏 Selecting',
      pause: '✊ Paused',
    };
    setGestureLabel(labelMap[result.mode] || '');

    if (!result.indexTip) return;
    const rawPoint = landmarkToCanvas(result.indexTip);
    const point = smoother.smooth(rawPoint);
    setCursorPos(point);

    // --- DRAW ---
    if (result.mode === 'draw') {
      dragStartRef.current = null;
      if (!currentStrokeRef.current) {
        currentStrokeRef.current = {
          id: `stroke-${Date.now()}`,
          points: [point],
          style: brush,
          color,
          size: brushSize,
          opacity,
        };
      } else {
        const last = lastPointRef.current;
        const minDist = 2;
        if (!last || Math.hypot(point.x - last.x, point.y - last.y) > minDist) {
          currentStrokeRef.current.points.push(point);
          lastPointRef.current = point;
        }
      }
    } else {
      // Finalize stroke when leaving draw mode
      if (currentStrokeRef.current && currentStrokeRef.current.points.length > 1) {
        addStroke(currentStrokeRef.current);
        pushHistory();
      }
      currentStrokeRef.current = null;
      lastPointRef.current = null;
    }

    // --- ERASE ---
    if (result.mode === 'erase') {
      eraseAt(point, brushSize * 5);
    }

    // --- DRAG ---
    if (result.mode === 'drag' && selectedStrokeId) {
      if (!dragStartRef.current) {
        dragStartRef.current = point;
        const allStrokes = layers.flatMap((l) => l.strokes);
        const sel = allStrokes.find((s) => s.id === selectedStrokeId);
        if (sel) dragStrokeOriginRef.current = sel.points.map((p) => ({ ...p }));
      } else if (dragStrokeOriginRef.current) {
        const dx = point.x - dragStartRef.current.x;
        const dy = point.y - dragStartRef.current.y;
        const newPoints = dragStrokeOriginRef.current.map((p) => ({
          ...p, x: p.x + dx, y: p.y + dy,
        }));
        updateStroke(selectedStrokeId, { points: newPoints });
      }
    } else if (result.mode !== 'drag') {
      dragStartRef.current = null;
      dragStrokeOriginRef.current = null;
    }

    // --- SELECT ---
    if (result.mode === 'select') {
      const allStrokes = layers.flatMap((l) => l.strokes);
      const hit = allStrokes.find((s) => hitTestStroke(s, point));
      if (hit) setSelectedStrokeId(hit.id);
    }
  }, [brush, color, brushSize, opacity, addStroke, pushHistory, eraseAt, layers, selectedStrokeId, updateStroke, setSelectedStrokeId, setGestureMode, landmarkToCanvas]);

  const handleCameraStatus = useCallback((status: string, message?: string) => {
    setCameraStatus(message || '');
  }, []);

  useHandTracking({
    videoRef: videoRef as React.RefObject<HTMLVideoElement>,
    onResults: handleLandmarks,
    onStatusChange: handleCameraStatus,
    enabled: isTracking,
  });

  // --- MOUSE FALLBACK ---
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isTracking) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const point: Point = { x: e.clientX - rect.left, y: e.clientY - rect.top, timestamp: Date.now() };
    currentStrokeRef.current = {
      id: `stroke-${Date.now()}`,
      points: [point],
      style: brush, color, size: brushSize, opacity,
    };
  }, [isTracking, brush, color, brushSize, opacity]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isTracking || !currentStrokeRef.current) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const point: Point = { x: e.clientX - rect.left, y: e.clientY - rect.top, timestamp: Date.now() };
    currentStrokeRef.current.points.push(point);
    setCursorPos(point);
  }, [isTracking]);

  const handleMouseUp = useCallback(() => {
    if (isTracking) return;
    if (currentStrokeRef.current && currentStrokeRef.current.points.length > 1) {
      addStroke(currentStrokeRef.current);
      pushHistory();
    }
    currentStrokeRef.current = null;
  }, [isTracking, addStroke, pushHistory]);

  return (
    <div className={styles.boardContainer}>
      <canvas ref={canvasRef} className={styles.mainCanvas} />
      <canvas
        ref={overlayCanvasRef}
        className={styles.overlayCanvas}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* Hidden video for MediaPipe processing only */}
      <video
        ref={videoRef as React.RefObject<HTMLVideoElement>}
        className={styles.hiddenVideo}
        playsInline
        muted
      />

      {/* PiP webcam preview — separate element, separate ref */}
      {isTracking && (
        <div className={styles.pipContainer}>
          <video
            ref={pipVideoRef as React.RefObject<HTMLVideoElement>}
            className={styles.pipVideo}
            playsInline
            muted
          />
          <div className={styles.gestureLabel}>{gestureLabel}</div>
        </div>
      )}

      {/* Gesture mode HUD */}
      <div className={styles.modeHud}>
        <span className={`${styles.modeDot} ${styles[gestureMode]}`} />
        <span>
          {cameraStatus && isTracking
            ? cameraStatus
            : gestureLabel || (isTracking ? 'Ready' : 'Mouse Mode')}
        </span>
      </div>
    </div>
  );
});

Board.displayName = 'Board';

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, theme: string) {
  ctx.save();
  switch (theme) {
    case 'whiteboard':
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, w, h);
      break;
    case 'blackboard':
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, 0, w, h);
      break;
    case 'grid': {
      ctx.fillStyle = '#0a0f1e';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.08)';
      ctx.lineWidth = 1;
      const size = 40;
      for (let x = 0; x < w; x += size) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += size) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      break;
    }
    case 'glass':
      ctx.fillStyle = 'rgba(10, 20, 40, 0.85)';
      ctx.fillRect(0, 0, w, h);
      break;
    default:
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}
