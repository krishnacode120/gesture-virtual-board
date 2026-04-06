import { Point, Stroke, BrushStyle, EffectNode } from '../types';

function getEffectValue(nodes: EffectNode[], id: string): number {
  const node = nodes.find((n) => n.id === id);
  return node?.enabled ? node.value : 0;
}

// ----------- IMPROVED SMOOTH PATH -----------

function drawSmoothPath(ctx: CanvasRenderingContext2D, points: Point[]) {
  if (points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
  }

  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
  ctx.stroke();
}

// ----------- PEN (IMPROVED) -----------

function drawPen(ctx: CanvasRenderingContext2D, stroke: Stroke, effectNodes: EffectNode[]) {
  const glowVal = getEffectValue(effectNodes, 'glow');

  ctx.save();
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = stroke.opacity;

  if (glowVal > 0) {
    ctx.shadowColor = stroke.color;
    ctx.shadowBlur = glowVal * 15;
  }

  drawSmoothPath(ctx, stroke.points);
  ctx.restore();
}

// ----------- LASER (FIXED TRAIL) -----------

function drawLaser(ctx: CanvasRenderingContext2D, stroke: Stroke, effectNodes: EffectNode[], now: number) {
  const glowVal = getEffectValue(effectNodes, 'glow') || 0.8;
  const trailDecay = getEffectValue(effectNodes, 'trail') || 0.9;

  const points = stroke.points;
  if (points.length < 2) return;

  ctx.save();
  ctx.lineCap = 'round';

  for (let i = 1; i < points.length; i++) {
    const t = i / points.length;

    const alpha = t * trailDecay * stroke.opacity;
    const width = stroke.size * (0.5 + t);

    ctx.globalAlpha = alpha;
    ctx.strokeStyle = stroke.color;
    ctx.shadowColor = stroke.color;
    ctx.shadowBlur = glowVal * 25;
    ctx.lineWidth = width;

    ctx.beginPath();
    ctx.moveTo(points[i - 1].x, points[i - 1].y);
    ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
  }

  ctx.restore();
}

// ----------- NEON (STABLE GLOW) -----------

function drawNeon(ctx: CanvasRenderingContext2D, stroke: Stroke, effectNodes: EffectNode[], now: number) {
  const glowVal = getEffectValue(effectNodes, 'glow') || 0.7;
  const points = stroke.points;
  if (points.length < 2) return;

  ctx.save();
  ctx.lineCap = 'round';

  const pulse = 0.8 + 0.2 * Math.sin(now * 0.002);

  const layers = [
    { width: stroke.size * 3, alpha: 0.1 },
    { width: stroke.size * 2, alpha: 0.3 },
    { width: stroke.size, alpha: 0.8 },
  ];

  layers.forEach(({ width, alpha }) => {
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = width;
    ctx.globalAlpha = alpha * pulse;
    ctx.shadowColor = stroke.color;
    ctx.shadowBlur = glowVal * 20;
    drawSmoothPath(ctx, points);
  });

  ctx.restore();
}

// ----------- CALLIGRAPHY (STABLE WIDTH) -----------

function drawCalligraphy(ctx: CanvasRenderingContext2D, stroke: Stroke, effectNodes: EffectNode[]) {
  const points = stroke.points;
  if (points.length < 2) return;

  ctx.save();
  ctx.fillStyle = stroke.color;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];

    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    const speed = Math.sqrt(dx * dx + dy * dy);

    const pressure = Math.max(0.3, 1 - speed / 40);
    const size = stroke.size * pressure;

    ctx.beginPath();
    ctx.arc(curr.x, curr.y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ----------- CHALK (LESS NOISE) -----------

function drawChalk(ctx: CanvasRenderingContext2D, stroke: Stroke, effectNodes: EffectNode[]) {
  const points = stroke.points;
  if (points.length < 2) return;

  ctx.save();
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.size;
  ctx.globalAlpha = 0.7 * stroke.opacity;

  drawSmoothPath(ctx, points);

  ctx.restore();
}

// ----------- ERASER CURSOR -----------

export function drawEraserCursor(ctx: CanvasRenderingContext2D, point: Point, radius: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 80, 80, 0.9)';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.stroke();
  ctx.restore();
}

// ----------- SELECTION -----------

export function getStrokeBounds(stroke: Stroke) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  stroke.points.forEach((p) => {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  });

  const pad = 10;

  return {
    x: minX - pad,
    y: minY - pad,
    w: maxX - minX + pad * 2,
    h: maxY - minY + pad * 2,
  };
}

export function drawSelectionBox(ctx: CanvasRenderingContext2D, bounds: { x: number; y: number; w: number; h: number }, now: number) {
  const dash = (now / 100) % 10;
  ctx.save();
  ctx.strokeStyle = '#00d4ff';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.lineDashOffset = -dash;
  ctx.shadowColor = '#00d4ff';
  ctx.shadowBlur = 8;
  ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);

  // Handles
  const handles = [
    [bounds.x, bounds.y], [bounds.x + bounds.w / 2, bounds.y],
    [bounds.x + bounds.w, bounds.y], [bounds.x + bounds.w, bounds.y + bounds.h / 2],
    [bounds.x + bounds.w, bounds.y + bounds.h], [bounds.x + bounds.w / 2, bounds.y + bounds.h],
    [bounds.x, bounds.y + bounds.h], [bounds.x, bounds.y + bounds.h / 2],
  ];
  ctx.setLineDash([]);
  ctx.fillStyle = '#00d4ff';
  handles.forEach(([hx, hy]) => {
    ctx.beginPath();
    ctx.arc(hx, hy, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

// ----------- MASTER RENDER -----------

export function renderStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  effectNodes: EffectNode[],
  now: number
) {
  ctx.filter = getEffectValue(effectNodes, 'blur') > 0
    ? `blur(${getEffectValue(effectNodes, 'blur')}px)`
    : 'none';

  switch (stroke.style) {
    case 'pen':
      drawPen(ctx, stroke, effectNodes);
      break;
    case 'laser':
      drawLaser(ctx, stroke, effectNodes, now);
      break;
    case 'neon':
      drawNeon(ctx, stroke, effectNodes, now);
      break;
    case 'calligraphy':
      drawCalligraphy(ctx, stroke, effectNodes);
      break;
    case 'chalk':
      drawChalk(ctx, stroke, effectNodes);
      break;
    default:
      drawPen(ctx, stroke, effectNodes);
  }

  ctx.filter = 'none';
}

// ----------- HIT TEST -----------

export function hitTestStroke(stroke: Stroke, point: Point, threshold = 30) {
  return stroke.points.some((p) => Math.hypot(p.x - point.x, p.y - point.y) < threshold);
}