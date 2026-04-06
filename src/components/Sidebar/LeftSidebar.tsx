import React from 'react';
import { useBoardStore } from '../../store/boardStore';
import { BrushStyle, BoardTheme } from '../../types';
import styles from './LeftSidebar.module.css';

const brushes: { id: BrushStyle; label: string; icon: string; color: string }[] = [
  { id: 'pen', label: 'Pen', icon: '✒️', color: '#e0e0e0' },
  { id: 'laser', label: 'Laser', icon: '⚡', color: '#ff3366' },
  { id: 'neon', label: 'Neon', icon: '💫', color: '#00ffcc' },
  { id: 'calligraphy', label: 'Calligraphy', icon: '🖋', color: '#ffaa00' },
  { id: 'chalk', label: 'Chalk', icon: '🖍', color: '#b0c4de' },
];

const themes: { id: BoardTheme; label: string; icon: string }[] = [
  { id: 'blackboard', label: 'Dark', icon: '🌑' },
  { id: 'whiteboard', label: 'Light', icon: '☀️' },
  { id: 'grid', label: 'Grid', icon: '⊞' },
  { id: 'glass', label: 'Glass', icon: '🔷' },
];

const presetColors = [
  '#00ffcc', '#ff3366', '#ffaa00', '#00aaff', '#ff44ff',
  '#ffffff', '#44ff88', '#ff8844', '#aaaaff', '#ff4444',
];

export const LeftSidebar: React.FC = () => {
  const {
    brush, color, brushSize, opacity, theme,
    setBrush, setColor, setBrushSize, setOpacity, setTheme,
    isTracking, setIsTracking,
    clearBoard, undo, redo,
    effectNodes, updateEffectNode,
  } = useBoardStore();

  const glowNode = effectNodes.find((n) => n.id === 'glow');
  const trailNode = effectNodes.find((n) => n.id === 'trail');
  const smoothingNode = effectNodes.find((n) => n.id === 'smoothing');

  return (
    <aside className={styles.sidebar}>
      {/* Hand tracking toggle */}
      <div className={styles.section}>
        <button
          className={`${styles.trackingBtn} ${isTracking ? styles.active : ''}`}
          onClick={() => setIsTracking(!isTracking)}
        >
          <span className={styles.trackingDot} />
          {isTracking ? 'Hand ON' : 'Hand OFF'}
        </button>
      </div>

      <div className={styles.divider} />

      {/* Brush styles */}
      <div className={styles.section}>
        <span className={styles.sectionLabel}>BRUSH</span>
        <div className={styles.brushGrid}>
          {brushes.map((b) => (
            <button
              key={b.id}
              className={`${styles.brushBtn} ${brush === b.id ? styles.activeBrush : ''}`}
              onClick={() => setBrush(b.id)}
              style={{ '--brush-color': b.color } as React.CSSProperties}
            >
              <span className={styles.brushIcon}>{b.icon}</span>
              <span className={styles.brushLabel}>{b.label}</span>
              {brush === b.id && (
                <div className={styles.activeIndicator} />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.divider} />

      {/* Color */}
      <div className={styles.section}>
        <span className={styles.sectionLabel}>COLOR</span>
        <div className={styles.colorPresets}>
          {presetColors.map((c) => (
            <button
              key={c}
              className={`${styles.colorDot} ${color === c ? styles.activeColor : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className={styles.colorPicker}
        />
      </div>

      <div className={styles.divider} />

      {/* Brush size */}
      <div className={styles.section}>
        <span className={styles.sectionLabel}>SIZE · {brushSize}px</span>
        <input
          type="range" min={1} max={40} value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className={styles.slider}
        />
      </div>

      {/* Opacity */}
      <div className={styles.section}>
        <span className={styles.sectionLabel}>OPACITY · {Math.round(opacity * 100)}%</span>
        <input
          type="range" min={0.05} max={1} step={0.01} value={opacity}
          onChange={(e) => setOpacity(Number(e.target.value))}
          className={styles.slider}
        />
      </div>

      <div className={styles.divider} />

      {/* Effects */}
      <div className={styles.section}>
        <span className={styles.sectionLabel}>EFFECTS</span>
        {glowNode && (
          <div className={styles.effectRow}>
            <span className={styles.effectLabel}>Glow</span>
            <input
              type="range"
              min={glowNode.min} max={glowNode.max} step={glowNode.step}
              value={glowNode.value}
              onChange={(e) => updateEffectNode('glow', Number(e.target.value))}
              className={styles.slider}
            />
            <span className={styles.effectValue}>{Math.round(glowNode.value * 100)}%</span>
          </div>
        )}
        {trailNode && (
          <div className={styles.effectRow}>
            <span className={styles.effectLabel}>Trail</span>
            <input
              type="range"
              min={trailNode.min} max={trailNode.max} step={trailNode.step}
              value={trailNode.value}
              onChange={(e) => updateEffectNode('trail', Number(e.target.value))}
              className={styles.slider}
            />
            <span className={styles.effectValue}>{Math.round(trailNode.value * 100)}%</span>
          </div>
        )}
        {smoothingNode && (
          <div className={styles.effectRow}>
            <span className={styles.effectLabel}>Smooth</span>
            <input
              type="range"
              min={smoothingNode.min} max={smoothingNode.max} step={smoothingNode.step}
              value={smoothingNode.value}
              onChange={(e) => updateEffectNode('smoothing', Number(e.target.value))}
              className={styles.slider}
            />
            <span className={styles.effectValue}>{Math.round(smoothingNode.value * 100)}%</span>
          </div>
        )}
      </div>

      <div className={styles.divider} />

      {/* Themes */}
      <div className={styles.section}>
        <span className={styles.sectionLabel}>THEME</span>
        <div className={styles.themeGrid}>
          {themes.map((t) => (
            <button
              key={t.id}
              className={`${styles.themeBtn} ${theme === t.id ? styles.activeTheme : ''}`}
              onClick={() => setTheme(t.id)}
              title={t.label}
            >
              {t.icon}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.divider} />

      {/* Actions */}
      <div className={styles.section}>
        <span className={styles.sectionLabel}>ACTIONS</span>
        <div className={styles.actionGrid}>
          <button className={styles.actionBtn} onClick={undo} title="Undo">↩</button>
          <button className={styles.actionBtn} onClick={redo} title="Redo">↪</button>
          <button
            className={`${styles.actionBtn} ${styles.danger}`}
            onClick={clearBoard}
            title="Clear"
          >🗑</button>
        </div>
      </div>
    </aside>
  );
};
