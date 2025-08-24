import React, { useEffect, useRef, useState, useMemo } from 'react';
import { BOARD_WIDTH, BOARD_HEIGHT, createEmptyBoard, canMove, placeTetromino, clearLines, Board } from '../utils/gameLogic';
import { TETROMINOES, Tetromino } from '../utils/tetrominoes';
import './GameBoard.css';

interface Position {
  x: number;
  y: number;
  offsetY?: number;
}

const getRandomTetromino = (): Tetromino => {
  return TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)];
};

const INITIAL_POSITION = { x: 3, y: 0 };

interface GameBoardProps {
  board: { color: string | null; filled: boolean }[][];
  gameOver: boolean;
  onRestart?: () => void;
  isPaused: boolean;
  currentPiece?: {
    shape: number[][];
    position: Position;
    color: string;
  };
}

const GameBoard: React.FC<GameBoardProps> = ({ board, gameOver, onRestart, isPaused, currentPiece }) => {
  return (
    <div className={`game-board ${gameOver ? 'game-over-board' : ''}`}>
      {gameOver && (
        <div className="game-over-overlay">
          <div className="game-over-text">GAME OVER</div>
          <div className="game-over-instruction">Click Restart to play again!</div>
          <button 
            className="restart-button"
            onClick={(e) => {
              e.stopPropagation();
              onRestart?.();
            }}
          >
            Restart
          </button>
        </div>
      )}
      {board.map((row: { color: string | null; filled: boolean }[], rowIdx: number) =>
        row.map((cell: { color: string | null; filled: boolean }, colIdx: number) => {
          // Check if this cell is part of the current piece
          let isCurrentPiece = false;
          let pieceOffsetY = 0;
          
          if (currentPiece && !cell.filled) {
            const { shape, position, color } = currentPiece;
            const localX = colIdx - Math.floor(position.x);
            const localY = rowIdx - Math.floor(position.y);
            
            // Check if this cell is within the current piece's shape
            if (
              localY >= 0 && localY < shape.length &&
              localX >= 0 && localX < shape[0].length &&
              shape[localY]?.[localX]
            ) {
              isCurrentPiece = true;
              pieceOffsetY = position.offsetY || 0;
            }
          }
          
          const cellStyle: React.CSSProperties = {
            transition: !gameOver ? 'transform 0.05s ease-out' : 'none',
          };
          
          if (cell.filled) {
            // Styling for placed pieces
            cellStyle.background = cell.color || '#222';
            cellStyle.boxShadow = '0 2px 8px #000, inset 0 2px 12px #fff6';
            cellStyle.opacity = gameOver ? 0.7 : 1;
          } else if (isCurrentPiece) {
            // Styling for current moving piece with smooth offset
            cellStyle.background = currentPiece?.color || '#fff';
            cellStyle.boxShadow = '0 2px 8px #000, inset 0 2px 12px #fff6';
            cellStyle.transform = `translateY(${pieceOffsetY * 100}%)`;
            cellStyle.zIndex = 1; // Ensure current piece is above placed pieces
          }
          
          return (
            <div
              key={`${rowIdx}-${colIdx}`}
              className={`cell${cell.filled ? ' filled' : isCurrentPiece ? ' current-piece' : ''}`}
              style={cellStyle}
            />
          );
        })
      )}
    </div>
  );
};

export default GameBoard;
