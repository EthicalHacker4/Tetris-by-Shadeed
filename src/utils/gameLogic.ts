import { TetrominoShape } from './tetrominoes';

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export type Cell = {
  color: string | null;
  filled: boolean;
};

export type Board = Cell[][];

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_HEIGHT }, () =>
    Array.from({ length: BOARD_WIDTH }, () => ({ color: null, filled: false }))
  );
}

export function rotate(shape: TetrominoShape): TetrominoShape {
  // Rotate 90 degrees clockwise
  return shape[0].map((_: number, i: number) => 
    shape.map((row: number[]) => row[shape.length - 1 - i])
  );
}

export function rotateMatrix<T>(matrix: T[][], clockwise: boolean = true): T[][] {
  const N = matrix.length;
  const rotated = Array(N).fill(0).map(() => Array(N).fill(0));
  
  if (clockwise) {
    // Rotate 90 degrees clockwise
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        rotated[j][N - 1 - i] = matrix[i][j];
      }
    }
  } else {
    // Rotate 90 degrees counter-clockwise
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        rotated[N - 1 - j][i] = matrix[i][j];
      }
    }
  }
  
  return rotated;
}

export function canMove(
  board: Board,
  shape: TetrominoShape,
  posX: number,
  posY: number
): boolean {
  // First check if the entire shape is within the board boundaries
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x]) {
        const newY = posY + y;
        const newX = posX + x;
        
        // Check boundaries first
        if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
          return false;
        }
        
        // Check if position is already filled (only if within board height)
        if (newY >= 0 && board[newY] && board[newY][newX] && board[newY][newX].filled) {
          return false;
        }
      }
    }
  }
  return true;
}

export function placeTetromino(
  board: Board,
  shape: TetrominoShape,
  posX: number,
  posY: number,
  color: string
): Board {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x]) {
        const newY = posY + y;
        const newX = posX + x;
        if (newY >= 0 && newY < BOARD_HEIGHT && newX >= 0 && newX < BOARD_WIDTH) {
          if (!newBoard[newY][newX].filled) {
            newBoard[newY][newX] = { color, filled: true };
          }
        }
      }
    }
  }
  return newBoard;
}

export function clearLines(board: Board): { board: Board; linesCleared: number } {
  const newBoard = board.filter(row => !row.every(cell => cell.filled));
  const linesCleared = BOARD_HEIGHT - newBoard.length;
  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(Array.from({ length: BOARD_WIDTH }, () => ({ color: null, filled: false })));
  }
  return { board: newBoard, linesCleared };
}
