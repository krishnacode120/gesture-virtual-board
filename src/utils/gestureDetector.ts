import { GestureMode, GestureResult, HandLandmark, Point } from '../types';

// Landmark indices
const WRIST = 0;
const THUMB_TIP = 4;
const INDEX_TIP = 8;
const INDEX_PIP = 6;
const MIDDLE_TIP = 12;
const MIDDLE_PIP = 10;
const RING_TIP = 16;
const RING_PIP = 14;
const PINKY_TIP = 20;
const PINKY_PIP = 18;

// ----------- Helpers -----------

function isFingerExtended(landmarks: HandLandmark[], tip: number, pip: number): boolean {
  return landmarks[tip].y < landmarks[pip].y;
}

function distance(a: HandLandmark, b: HandLandmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// ----------- Gesture Detection -----------

export function detectGesture(landmarks: HandLandmark[]): GestureResult {
  if (!landmarks || landmarks.length < 21) {
    return { mode: 'pause', indexTip: null, confidence: 0 };
  }

  const indexExtended = isFingerExtended(landmarks, INDEX_TIP, INDEX_PIP);
  const middleExtended = isFingerExtended(landmarks, MIDDLE_TIP, MIDDLE_PIP);
  const ringExtended = isFingerExtended(landmarks, RING_TIP, RING_PIP);
  const pinkyExtended = isFingerExtended(landmarks, PINKY_TIP, PINKY_PIP);

  const thumbTip = landmarks[THUMB_TIP];
  const indexTip = landmarks[INDEX_TIP];

  const thumbIndexDist = distance(thumbTip, indexTip);
  const palmSize = Math.max(distance(landmarks[WRIST], landmarks[MIDDLE_TIP]), 0.1);

  const normalizedDist = thumbIndexDist / palmSize;

  const indexTipPoint: Point = {
    x: indexTip.x,
    y: indexTip.y,
    timestamp: Date.now(),
  };

  // ----------- Improved Logic -----------

  // 🖐 Open palm → erase
  if (indexExtended && middleExtended && ringExtended && pinkyExtended) {
    return { mode: 'erase', indexTip: indexTipPoint, confidence: 0.95 };
  }

  // ✌️ Two fingers → drag (more forgiving dist)
  const fingerDist = distance(landmarks[INDEX_TIP], landmarks[MIDDLE_TIP]);
  if (indexExtended && middleExtended && fingerDist > 0.02) {
    return { mode: 'drag', indexTip: indexTipPoint, confidence: 0.9 };
  }

  // ✊ Closed fist → pause
  if (!indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
    return { mode: 'pause', indexTip: indexTipPoint, confidence: 0.9 };
  }

  // 🤏 Pinch → select (more forgiving)
  if (normalizedDist < 0.18) {
    return { mode: 'select', indexTip: indexTipPoint, confidence: 0.9 };
  }

  // ✍️ Draw → index finger only (more flexible)
  if (indexExtended && !middleExtended) {
    return { mode: 'draw', indexTip: indexTipPoint, confidence: 0.95 };
  }

  return { mode: 'pause', indexTip: indexTipPoint, confidence: 0.6 };
}

// ----------- Adaptive Smoothing -----------

export class PointSmoother {
  private prev: Point | null = null;

  smooth(point: Point): Point {
    if (!this.prev) {
      this.prev = point;
      return point;
    }

    const dx = Math.abs(point.x - this.prev.x);
    const dy = Math.abs(point.y - this.prev.y);
    const speed = dx + dy;

    // Correct adaptive alpha: 
    // Low speed -> higher alpha (more previous, stable)
    // High speed -> lower alpha (more current, responsive)
    const alpha = Math.max(0.05, Math.min(0.9, 0.95 - speed * 0.05));

    const smoothed: Point = {
      x: alpha * this.prev.x + (1 - alpha) * point.x,
      y: alpha * this.prev.y + (1 - alpha) * point.y,
      pressure: point.pressure,
      timestamp: point.timestamp,
    };

    this.prev = smoothed;
    return smoothed;
  }

  reset() {
    this.prev = null;
  }
}

// ----------- Time-based Debouncer -----------

export class GestureDebouncer {
  private lastMode: GestureMode = 'pause';
  private lastSwitchTime = 0;
  private delay = 120; // ms

  debounce(result: GestureResult): GestureResult {
    const now = Date.now();

    if (result.mode !== this.lastMode) {
      if (now - this.lastSwitchTime > this.delay) {
        this.lastMode = result.mode;
        this.lastSwitchTime = now;
      }
    }

    return { ...result, mode: this.lastMode };
  }
}