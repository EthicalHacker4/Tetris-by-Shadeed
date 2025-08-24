import React from 'react';
import { Tetromino } from '../utils/tetrominoes';
import './SidePanel.css';

interface SidePanelProps {
  level: number;
  score: number;
  nextTetromino: Tetromino;
  isPaused: boolean;
}

const SidePanel: React.FC<SidePanelProps> = ({ level = 1, score = 0, nextTetromino, isPaused = false }: SidePanelProps) => {
  return (
    <div className="side-panel">
      <div className="level">LEVEL: {level}</div>
      <div className="score">SCORE: {score}</div>
      <div className="next-block-label">NEXT:</div>
      <div className="next-block-preview" style={{ width: 60, height: 60, display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto' }}>
        {nextTetromino && (() => {
          const shape = nextTetromino.shape;
          return (
            <div style={{
              display: 'grid',
              gridTemplateRows: `repeat(${shape.length}, 1fr)`,
              gridTemplateColumns: `repeat(${shape[0].length}, 1fr)`,
              gap: 2,
              transform: 'scale(0.8)'
            }}>
              {shape.map((row, y) =>
                row.map((cell, x) => (
                  <div
                    key={`next-${y}-${x}`}
                    style={{
                      width: 12,
                      height: 12,
                      background: cell ? nextTetromino.color : 'transparent',
                      borderRadius: 2,
                      boxShadow: cell ? '0 1px 3px #000, inset 0 1px 6px #fff8' : 'none',
                      opacity: cell ? 1 : 0
                    }}
                  />
                ))
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default SidePanel;
