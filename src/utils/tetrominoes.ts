export type TetrominoShape = number[][];

export interface Tetromino {
  shape: TetrominoShape;
  color: string;
  name: string;
  rotationState?: number; // 0-3 representing the current rotation state
}

export const TETROMINOES: Tetromino[] = [
  // I
  {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: '#00f0f0',
    name: 'I',
  },
  // O
  {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: '#f8f000',
    name: 'O',
  },
  // T
  {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#a000f0',
    name: 'T',
  },
  // S
  {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: '#00f000',
    name: 'S',
  },
  // Z
  {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: '#f00000',
    name: 'Z',
  },
  // J
  {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#0000f0',
    name: 'J',
  },
  // L
  {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#f0a000',
    name: 'L',
  },
];
