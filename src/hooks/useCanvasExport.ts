import { useCallback } from 'react';
import { useBoardStore } from '../store/boardStore';

export function useCanvasExport(getCanvas: () => HTMLCanvasElement | null) {
  const { exportAsJSON, importFromJSON } = useBoardStore();

  const exportPNG = useCallback(() => {
    const canvas = getCanvas();
    if (!canvas) {
      console.warn('No canvas available for export');
      return;
    }
    const link = document.createElement('a');
    link.download = `gesture-board-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [getCanvas]);

  const exportJSON = useCallback(() => {
    const json = exportAsJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `gesture-board-${Date.now()}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [exportAsJSON]);

  const importJSON = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        importFromJSON(text);
      };
      reader.readAsText(file);
    };
    input.click();
  }, [importFromJSON]);

  return { exportPNG, exportJSON, importJSON };
}
