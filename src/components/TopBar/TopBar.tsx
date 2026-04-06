import React, { useRef } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { useCanvasExport } from '../../hooks/useCanvasExport';
import styles from './TopBar.module.css';

interface TopBarProps {
  getCanvas: () => HTMLCanvasElement | null;
}

export const TopBar: React.FC<TopBarProps> = ({ getCanvas }) => {
  const { saveToStorage, loadFromStorage } = useBoardStore();
  const { exportPNG, exportJSON, importJSON } = useCanvasExport(getCanvas);

  const handleSave = () => {
    saveToStorage();
    showToast('Board saved!');
  };

  const handleLoad = () => {
    loadFromStorage();
    showToast('Board loaded!');
  };

  const showToast = (msg: string) => {
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = `
      position: fixed; top: 70px; left: 50%; transform: translateX(-50%);
      background: rgba(20, 24, 36, 0.92); border: 1px solid rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.85); padding: 8px 20px; border-radius: 8px;
      font-family: 'JetBrains Mono', monospace; font-size: 12px;
      z-index: 9999; backdrop-filter: blur(10px); transition: opacity 0.3s;
    `;
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 1800);
  };

  return (
    <header className={styles.topBar}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>◈</span>
        <span className={styles.logoText}>GESTURE<span className={styles.accent}>BOARD</span></span>
      </div>

      <div className={styles.controls}>
        <button className={styles.btn} onClick={handleSave}>
          <span>💾</span> Save
        </button>

        <button className={styles.btn} onClick={handleLoad}>
          <span>📂</span> Load
        </button>

        <div className={styles.separator} />

        <button className={styles.btn} onClick={exportJSON}>
          <span>⬇</span> Export JSON
        </button>

        <button className={styles.btn} onClick={importJSON}>
          <span>⬆</span> Import
        </button>

        <button
          className={`${styles.btn} ${styles.primaryBtn}`}
          onClick={exportPNG}
        >
          <span>🖼</span> Export PNG
        </button>
      </div>

      <div className={styles.meta}>
        <span className={styles.metaText}>Ctrl+Z / Ctrl+Shift+Z</span>
        <span className={styles.metaSep}>·</span>
        <span className={styles.metaText}>Del to remove selected</span>
      </div>
    </header>
  );
};
