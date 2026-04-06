import { create } from 'zustand';
import { BoardState, BrushStyle, BoardTheme, GestureMode, Layer, Stroke, EffectNode, Point } from '../types';

const defaultLayer: Layer = {
  id: 'layer-1',
  name: 'Layer 1',
  visible: true,
  locked: false,
  strokes: [],
};

const defaultEffectNodes: EffectNode[] = [
  { id: 'glow', type: 'glow', label: 'Glow Intensity', value: 0.6, min: 0, max: 1, step: 0.01, enabled: true },
  { id: 'trail', type: 'trail', label: 'Trail Decay', value: 0.85, min: 0.5, max: 1, step: 0.01, enabled: true },
  { id: 'smoothing', type: 'smoothing', label: 'Brush Smoothing', value: 0.5, min: 0, max: 0.95, step: 0.01, unit: '', enabled: true },
  { id: 'blur', type: 'blur', label: 'Blur Radius', value: 0, min: 0, max: 20, step: 0.5, unit: 'px', enabled: false },
  { id: 'distortion', type: 'distortion', label: 'Distortion', value: 0, min: 0, max: 1, step: 0.01, enabled: false },
];

interface BoardStore extends BoardState {
  // Actions
  setBrush: (brush: BrushStyle) => void;
  setColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  setOpacity: (opacity: number) => void;
  setTheme: (theme: BoardTheme) => void;
  setGestureMode: (mode: GestureMode) => void;
  setIsTracking: (tracking: boolean) => void;
  setSelectedStrokeId: (id: string | null) => void;

  // Layer actions
  addLayer: () => void;
  removeLayer: (id: string) => void;
  toggleLayerVisibility: (id: string) => void;
  toggleLayerLock: (id: string) => void;
  setActiveLayer: (id: string) => void;
  renameLayer: (id: string, name: string) => void;

  // Stroke actions
  addStroke: (stroke: Stroke) => void;
  updateStroke: (id: string, updates: Partial<Stroke>) => void;
  removeStroke: (id: string) => void;
  clearBoard: () => void;
  eraseAt: (point: Point, radius: number) => void;

  // Effect node actions
  updateEffectNode: (id: string, value: number) => void;
  toggleEffectNode: (id: string) => void;

  // History
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  // Save/Load
  saveToStorage: () => void;
  loadFromStorage: () => void;
  exportAsJSON: () => string;
  importFromJSON: (json: string) => void;
}

export const useBoardStore = create<BoardStore>((set, get) => ({
  layers: [defaultLayer],
  activeLayerId: 'layer-1',
  theme: 'blackboard',
  brush: 'neon',
  color: '#00ffff',
  brushSize: 4,
  opacity: 1,
  gestureMode: 'pause',
  isTracking: false,
  effectNodes: defaultEffectNodes,
  selectedStrokeId: null,
  history: [[{ ...defaultLayer }]],
  historyIndex: 0,

  setBrush: (brush) => set({ brush }),
  setColor: (color) => set({ color }),
  setBrushSize: (brushSize) => set({ brushSize }),
  setOpacity: (opacity) => set({ opacity }),
  setTheme: (theme) => set({ theme }),
  setGestureMode: (gestureMode) => set({ gestureMode }),
  setIsTracking: (isTracking) => set({ isTracking }),
  setSelectedStrokeId: (selectedStrokeId) => set({ selectedStrokeId }),

  addLayer: () => {
    const id = `layer-${Date.now()}`;
    const newLayer: Layer = {
      id,
      name: `Layer ${get().layers.length + 1}`,
      visible: true,
      locked: false,
      strokes: [],
    };
    set((s) => ({ layers: [...s.layers, newLayer], activeLayerId: id }));
  },

  removeLayer: (id) => {
    const { layers, activeLayerId } = get();
    if (layers.length === 1) return;
    const newLayers = layers.filter((l) => l.id !== id);
    set({
      layers: newLayers,
      activeLayerId: activeLayerId === id ? newLayers[newLayers.length - 1].id : activeLayerId,
    });
  },

  toggleLayerVisibility: (id) =>
    set((s) => ({
      layers: s.layers.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)),
    })),

  toggleLayerLock: (id) =>
    set((s) => ({
      layers: s.layers.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l)),
    })),

  setActiveLayer: (id) => set({ activeLayerId: id }),

  renameLayer: (id, name) =>
    set((s) => ({
      layers: s.layers.map((l) => (l.id === id ? { ...l, name } : l)),
    })),

  addStroke: (stroke) => {
    const { activeLayerId, layers } = get();
    set({
      layers: layers.map((l) =>
        l.id === activeLayerId ? { ...l, strokes: [...l.strokes, stroke] } : l
      ),
    });
  },

  updateStroke: (id, updates) =>
    set((s) => ({
      layers: s.layers.map((l) => ({
        ...l,
        strokes: l.strokes.map((st) => (st.id === id ? { ...st, ...updates } : st)),
      })),
    })),

  removeStroke: (id) =>
    set((s) => ({
      layers: s.layers.map((l) => ({
        ...l,
        strokes: l.strokes.filter((st) => st.id !== id),
      })),
      selectedStrokeId: s.selectedStrokeId === id ? null : s.selectedStrokeId,
    })),

  clearBoard: () =>
    set((s) => ({
      layers: s.layers.map((l) =>
        l.id === s.activeLayerId ? { ...l, strokes: [] } : l
      ),
    })),

  eraseAt: (point, radius) =>
    set((s) => ({
      layers: s.layers.map((l) => {
        if (!l.visible || l.locked) return l;
        return {
          ...l,
          strokes: l.strokes.filter((st) => {
            return !st.points.some(
              (p) => Math.hypot(p.x - point.x, p.y - point.y) < radius
            );
          }),
        };
      }),
    })),

  updateEffectNode: (id, value) =>
    set((s) => ({
      effectNodes: s.effectNodes.map((n) => (n.id === id ? { ...n, value } : n)),
    })),

  toggleEffectNode: (id) =>
    set((s) => ({
      effectNodes: s.effectNodes.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n)),
    })),

  pushHistory: () => {
    const { layers, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(layers)));
    set({ history: newHistory.slice(-50), historyIndex: newHistory.length - 1 });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    set({ layers: JSON.parse(JSON.stringify(history[newIndex])), historyIndex: newIndex });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    set({ layers: JSON.parse(JSON.stringify(history[newIndex])), historyIndex: newIndex });
  },

  saveToStorage: () => {
    const { layers, effectNodes, theme } = get();
    localStorage.setItem('gesture-board-state', JSON.stringify({ layers, effectNodes, theme }));
  },

  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem('gesture-board-state');
      if (!raw) return;
      const { layers, effectNodes, theme } = JSON.parse(raw);
      set({ layers, effectNodes, theme, activeLayerId: layers[0]?.id ?? 'layer-1' });
    } catch (e) {
      console.warn('Failed to load board state', e);
    }
  },

  exportAsJSON: () => {
    const { layers, effectNodes, theme } = get();
    return JSON.stringify({ layers, effectNodes, theme }, null, 2);
  },

  importFromJSON: (json) => {
    try {
      const { layers, effectNodes, theme } = JSON.parse(json);
      set({ layers, effectNodes, theme, activeLayerId: layers[0]?.id });
    } catch (e) {
      console.warn('Invalid JSON', e);
    }
  },
}));
