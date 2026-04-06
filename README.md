# ✦ GestureBoard

**Gesture-Based Virtual Writing Board** with MediaPipe Hand Tracking and TouchDesigner-style Effects.

---

## 🚀 Features

- **Real-time Hand Tracking** via MediaPipe Hands (21 landmarks)
- **5 Brush Styles**: Pen, Laser (glow+fade), Neon (animated), Calligraphy (pressure), Chalk (textured)
- **Gesture System**:
  - ✍️ Index finger → Draw
  - ✊ Closed fist → Erase
  - ✌️ Two fingers → Drag selected stroke
  - 🤏 Pinch → Select stroke
  - 🖐 Open palm → Pause tracking
- **Full Object Manipulation**: Select, drag, delete strokes
- **TouchDesigner Node Pipeline**: 5 live effect nodes (Glow, Trail, Smoothing, Blur, Distortion)
- **Board Themes**: Blackboard, Whiteboard, Grid, Glass
- **Layer System**: Multiple layers, visibility, lock, rename
- **Save/Load/Export**: localStorage, JSON import/export, PNG export
- **PiP Webcam**: Mirrored camera feed in corner while tracking
- **Mouse Fallback**: Full drawing works without hand tracking
- **Keyboard Shortcuts**: Ctrl+Z/Ctrl+Shift+Z (undo/redo), Delete (remove selected)

---

## 📁 Project Structure

```
gesture-board/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Board/
│   │   │   ├── Board.tsx          # Main canvas + gesture handler
│   │   │   └── Board.module.css
│   │   ├── NodePanel/
│   │   │   ├── NodePanel.tsx      # TouchDesigner-style effect nodes
│   │   │   └── NodePanel.module.css
│   │   ├── Sidebar/
│   │   │   ├── LeftSidebar.tsx    # Tools, brushes, colors, themes
│   │   │   ├── LeftSidebar.module.css
│   │   │   ├── RightSidebar.tsx   # Layers, notes, selection
│   │   │   └── RightSidebar.module.css
│   │   └── TopBar/
│   │       ├── TopBar.tsx         # Save/Load/Export controls
│   │       └── TopBar.module.css
│   ├── hooks/
│   │   ├── useHandTracking.ts     # MediaPipe integration hook
│   │   └── useCanvasExport.ts     # PNG/JSON export hooks
│   ├── store/
│   │   └── boardStore.ts          # Zustand global state
│   ├── types/
│   │   └── index.ts               # All TypeScript types
│   ├── utils/
│   │   ├── brushRenderer.ts       # All 5 brush renderers + hit testing
│   │   └── gestureDetector.ts     # Gesture logic + smoothing + debounce
│   ├── styles/
│   │   └── global.css
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── vite.config.ts
├── tsconfig.json
├── vercel.json
└── package.json
```

---

## ⚙️ Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Open in browser
# http://localhost:5173
```

> **Webcam required** for hand tracking. Grant camera permissions when prompted.

---

## 🚢 Deploy to Vercel

### Option A — Vercel CLI (recommended)

```bash
npm install -g vercel
vercel
```

Follow the prompts. The `vercel.json` already sets the required COOP/COEP headers for MediaPipe.

### Option B — GitHub + Vercel Dashboard

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. Framework: **Vite**
4. Build command: `npm run build`
5. Output dir: `dist`
6. Click Deploy ✓

---

## 🎮 Usage Guide

### Mouse Mode (no webcam needed)
- Click and drag on the canvas to draw
- Use the left sidebar to change brush, color, size
- Ctrl+Z / Ctrl+Shift+Z for undo/redo

### Hand Tracking Mode
1. Click **Hand OFF** button in left sidebar → turns green as **Hand ON**
2. Grant webcam permission
3. Wait ~2 seconds for MediaPipe to initialize
4. Use gestures:

| Gesture | Action |
|---------|--------|
| ✍️ Index finger up | Draw |
| ✊ Fist | Pause / Stop drawing |
| ✌️ Two fingers | Drag selected stroke |
| 🤏 Thumb+index pinch | Select stroke |
| 🖐 Open palm | Erase |

### Node Pipeline
- Click the **NODE PIPELINE** bar at the bottom to expand/collapse
- Toggle each effect node ON/OFF with the circle button
- Drag the track slider to adjust intensity
- Effects apply in real-time to all rendering

---

## 🖌️ Brush Styles

| Brush | Description |
|-------|-------------|
| **Pen** | Clean smooth stroke with optional glow |
| **Laser** | Glowing trail that fades over time (animated) |
| **Neon** | Multi-layer animated neon glow with white hot core |
| **Calligraphy** | Pressure-sensitive elliptical strokes (speed → width) |
| **Chalk** | Textured multi-offset strokes with grain particles |

---

## 🛠️ Tech Stack

- **React 18** + Vite + TypeScript
- **MediaPipe Hands** (JS) — 21 landmark hand tracking
- **Zustand** — global state management
- **Framer Motion** — animations
- **Canvas 2D API** — all rendering (no WebGL needed)
- **CSS Modules** — scoped styling

---

## ⚡ Performance Tips

- MediaPipe runs at 640×480 by default (good balance)
- Use `requestAnimationFrame` loop for smooth 60fps rendering
- Smoothing node reduces jitter without adding lag
- Laser/Neon brushes are most GPU-intensive — reduce glow if needed
- Each stroke stores raw points; very long sessions may accumulate data → use layers and export regularly

---

## 📄 License

MIT — use freely, credit appreciated.
