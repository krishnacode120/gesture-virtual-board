import React, { useState } from 'react';
import { useBoardStore } from '../../store/boardStore';
import styles from './RightSidebar.module.css';

type Tab = 'layers' | 'notes';

export const RightSidebar: React.FC = () => {
  const [tab, setTab] = useState<Tab>('layers');
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState<{ id: string; text: string }[]>([]);

  const {
    layers, activeLayerId,
    addLayer, removeLayer, toggleLayerVisibility, toggleLayerLock,
    setActiveLayer, renameLayer, selectedStrokeId,
    removeStroke, setSelectedStrokeId,
  } = useBoardStore();

  const addNote = () => {
    if (!note.trim()) return;
    setNotes((n) => [...n, { id: Date.now().toString(), text: note }]);
    setNote('');
  };

  return (
    <aside className={styles.sidebar}>
      {/* Tabs */}
      <div className={styles.tabs}>
        {(['layers', 'notes'] as Tab[]).map((t) => (
          <button
            key={t}
            className={`${styles.tab} ${tab === t ? styles.activeTab : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'layers' ? '◫ Layers' : '📝 Notes'}
          </button>
        ))}
      </div>

      {tab === 'layers' && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>LAYERS</span>
            <button className={styles.addBtn} onClick={addLayer}>+</button>
          </div>

          <div className={styles.layerList}>
            {[...layers].reverse().map((layer) => (
              <div
                key={layer.id}
                className={`${styles.layerRow} ${layer.id === activeLayerId ? styles.activeLayer : ''}`}
                onClick={() => setActiveLayer(layer.id)}
              >
                <button
                  className={styles.layerIcon}
                  onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }}
                  title={layer.visible ? 'Hide' : 'Show'}
                >
                  {layer.visible ? '👁' : '○'}
                </button>
                <button
                  className={styles.layerIcon}
                  onClick={(e) => { e.stopPropagation(); toggleLayerLock(layer.id); }}
                  title={layer.locked ? 'Unlock' : 'Lock'}
                >
                  {layer.locked ? '🔒' : '🔓'}
                </button>
                <span
                  className={styles.layerName}
                  onDoubleClick={() => {
                    const name = prompt('Layer name:', layer.name);
                    if (name) renameLayer(layer.id, name);
                  }}
                >
                  {layer.name}
                </span>
                <span className={styles.strokeCount}>{layer.strokes.length}</span>
                {layers.length > 1 && (
                  <button
                    className={styles.removeBtn}
                    onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }}
                  >×</button>
                )}
              </div>
            ))}
          </div>

          {/* Selected stroke info */}
          {selectedStrokeId && (
            <div className={styles.selectionPanel}>
              <span className={styles.panelTitle}>SELECTED</span>
              <div className={styles.selectionActions}>
                <button
                  className={styles.selBtn}
                  onClick={() => { removeStroke(selectedStrokeId); setSelectedStrokeId(null); }}
                >🗑 Delete</button>
                <button className={styles.selBtn} onClick={() => setSelectedStrokeId(null)}>
                  ✕ Deselect
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'notes' && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>QUICK NOTES</span>
          </div>
          <div className={styles.noteInput}>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Type a note..."
              className={styles.textarea}
              rows={3}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addNote(); }}}
            />
            <button className={styles.addNoteBtn} onClick={addNote}>Add</button>
          </div>
          <div className={styles.noteList}>
            {notes.map((n) => (
              <div key={n.id} className={styles.noteCard}>
                <p>{n.text}</p>
                <button
                  className={styles.removeBtn}
                  onClick={() => setNotes((prev) => prev.filter((x) => x.id !== n.id))}
                >×</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};
