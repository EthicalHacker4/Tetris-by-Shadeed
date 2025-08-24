import React from 'react';
import './Controls.css';

interface ControlsProps {
  onLeft?: () => void;
  onRight?: () => void;
  onRotate?: (clockwise: boolean) => void;
  onDown?: () => void;
}

const Controls: React.FC<ControlsProps> = ({ onLeft, onRight, onRotate, onDown }: ControlsProps) => {
  return (
    <div className="controls">
      <div className="rotate-controls">
        <button className="controls-btn rotate" onClick={() => onRotate?.(true)}>⟳</button>
      </div>
      <div className="movement-controls">
        <button className="controls-btn left" onClick={onLeft}>◀</button>
        <button className="controls-btn down" onClick={onDown}>▼</button>
        <button className="controls-btn right" onClick={onRight}>▶</button>
      </div>
    </div>
  );
};

export default Controls;
