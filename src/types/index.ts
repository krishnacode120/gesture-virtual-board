export type BrushStyle = 'pen' | 'laser' | 'neon' | 'calligraphy' | 'chalk';
export type GestureMode = 'draw' | 'erase' | 'drag' | 'pause' | 'select';
export type BoardTheme = 'whiteboard' | 'blackboard' | 'grid' | 'glass';

export interface Point {
  x: number;
  y: number;
  pressure?: number;
  timestamp?: number;
}

export interface Stroke {
  id: string;
  points: Point[];
  style: BrushStyle;
  color: string;
  size: number;
  opacity: number;
  selected?: boolean;
  transform?: {
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
  };
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  strokes: Stroke[];
}

export interface EffectNode {
  id: string;
  type: 'glow' | 'blur' | 'trail' | 'smoothing' | 'distortion';
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  enabled: boolean;
}

export interface BoardState {
  layers: Layer[];
  activeLayerId: string;
  theme: BoardTheme;
  brush: BrushStyle;
  color: string;
  brushSize: number;
  opacity: number;
  gestureMode: GestureMode;
  isTracking: boolean;
  effectNodes: EffectNode[];
  selectedStrokeId: string | null;
  history: Layer[][];
  historyIndex: number;
}

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface GestureResult {
  mode: GestureMode;
  indexTip: Point | null;
  confidence: number;
}
