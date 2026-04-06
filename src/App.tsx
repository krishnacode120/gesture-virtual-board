import React, { useRef, useEffect, useCallback } from 'react';
import { Board, BoardHandle } from './components/Board/Board';
import { LeftSidebar } from './components/Sidebar/LeftSidebar';
import { RightSidebar } from './components/Sidebar/RightSidebar';
import { TopBar } from './components/TopBar/TopBar';
import { useBoardStore } from './store/boardStore';
import './styles/global.css';

function App() {
  const boardRef = useRef<BoardHandle>(null);
  const { loadFromStorage } = useBoardStore();

  useEffect(() => {
    loadFromStorage();
  }, []);

  const getCanvasRef = useCallback(() => {
    return boardRef.current?.getCanvas() ?? null;
  }, []);

  return (
    <div className="app-shell">
      <TopBar getCanvas={getCanvasRef} />

      <div className="app-body">
        <LeftSidebar />

        <div className="canvas-area">
          <Board ref={boardRef} />
        </div>

        <RightSidebar />
      </div>
    </div>
  );
}

export default App;
