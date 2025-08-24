import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import GameBoard from './components/GameBoard';
import SidePanel from './components/SidePanel';
import Controls from './components/Controls';
import './components/GameControls.css';
import { 
  BOARD_WIDTH, 
  BOARD_HEIGHT, 
  createEmptyBoard, 
  canMove, 
  placeTetromino, 
  clearLines, 
  rotateMatrix 
} from './utils/gameLogic';
import { soundManager } from './utils/sounds'; // Import sound manager
import { TETROMINOES, Tetromino } from './utils/tetrominoes';
import './App.css';

// Utility to deep copy a shape array
function deepCopyShape(shape: number[][]): number[][] {
  return shape.map(row => [...row]);
}

// Always return a new tetromino object with a deep-copied shape
const getRandomTetromino = (): Tetromino => {
  if (!TETROMINOES || TETROMINOES.length === 0) {
    console.error('TETROMINOES is not properly initialized');
    // Return a default tetromino (O shape) as fallback
    return {
      shape: [
        [1, 1],
        [1, 1],
      ],
      color: '#f8f000',
      name: 'O',
    };
  }
  
  const randomIndex = Math.floor(Math.random() * TETROMINOES.length);
  const t = TETROMINOES[randomIndex];
  
  if (!t || !t.shape) {
    console.error('Invalid tetromino at index', randomIndex, ':', t);
    throw new Error('Invalid tetromino data');
  }
  
  return { 
    ...t, 
    shape: deepCopyShape(t.shape) 
  };
};

const INITIAL_POSITION = { x: 3, y: 0 };

interface GameState {
  board: ReturnType<typeof createEmptyBoard>;
  current: Tetromino;
  position: { 
    x: number; 
    y: number;
    offsetY?: number; // For smooth sub-cell movement
  };
  nextTetromino: Tetromino;
  score: number;
  level: number;
  gameOver: boolean;
  isPaused: boolean;
  isPieceLanded: boolean;
  landedTime: number | null;
};

const initialGameState = (): GameState => {
  try {
    console.log('Creating initial game state...');
    
    // Create empty board
    const initialBoard = createEmptyBoard();
    console.log('Created empty board with size:', 
      `${initialBoard[0]?.length || 0}x${initialBoard.length}`);
    
    // Get random tetrominoes
    console.log('Generating random tetrominoes...');
    const newTetromino = getRandomTetromino();
    const nextTetromino = getRandomTetromino();
    
    console.log('Current tetromino:', newTetromino.name);
    console.log('Next tetromino:', nextTetromino.name);
    
    // Create initial state
    const initialState = {
      board: initialBoard,
      current: newTetromino,
      position: { x: Math.floor(BOARD_WIDTH / 2) - Math.floor(newTetromino.shape[0].length / 2), y: 0 },
      nextTetromino: nextTetromino,
      score: 0,
      level: 1,
      gameOver: false,
      isPaused: false,
      isPieceLanded: false,
      landedTime: null
    };
    
    console.log('Initial game state created successfully');
    return initialState;
    
  } catch (error) {
    console.error('Failed to create initial game state:', error);
    
    // Return a minimal valid state to prevent crashes
    return {
      board: createEmptyBoard(),
      current: {
        shape: [[1, 1], [1, 1]],
        color: '#f8f000',
        name: 'O'
      },
      position: { ...INITIAL_POSITION },
      nextTetromino: {
        shape: [[1, 1, 1, 1]],
        color: '#00f0f0',
        name: 'I'
      },
      score: 0,
      level: 1,
      gameOver: false,
      isPaused: false,
      isPieceLanded: false,
      landedTime: null
    };
  }
};

console.log('Initializing App component...');

const App: React.FC = () => {
  console.log('Setting up initial state...');
  // State and refs
  const [gameState, setGameState] = useState<GameState>({...initialGameState(), isPaused: false});
  const gameRef = useRef<GameState>(gameState);
  const [isMuted, setIsMuted] = useState(false);
  
  // Update the ref whenever game state changes
  useEffect(() => {
    gameRef.current = gameState;
  }, [gameState]);
  
  // Wrapper function to update both state and ref
  const setGame = useCallback((newState: GameState | ((prev: GameState) => GameState)) => {
    if (typeof newState === 'function') {
      setGameState(prev => {
        const updated = newState(prev);
        gameRef.current = updated;
        return updated;
      });
    } else {
      gameRef.current = newState;
      setGameState(newState);
    }
  }, []);

  // Track key states and movement timing
  const keysPressed = useRef<{[key: string]: boolean}>({});
  const lastMoveTime = useRef<{[key: string]: number}>({});
  const moveCooldown = 80; // ms between moves when holding a key (faster response)
  const initialCooldown = 100; // Initial delay before continuous movement starts (shorter for better responsiveness)
  const dropSpeed = useRef(1000); // Start with 1 second per drop
  const lastFrameTime = useRef(0);
  const dropAccumulator = useRef(0);
  const animationState = useRef({
    isRunning: false,
    frameId: 0 as number | undefined
  });
  
  // Initialize lastMoveTime refs
  useEffect(() => {
    lastMoveTime.current = {
      ArrowLeft: 0,
      ArrowRight: 0,
      ArrowDown: 0
    };
  }, []);

  // Toggle pause state
  const togglePause = useCallback(() => {
    setGame(prev => {
      const newPausedState = !prev.isPaused;
      console.log('Toggling pause state to:', newPausedState);
      return {
        ...prev,
        isPaused: newPausedState
      };
    });
  }, [setGame]);

  // Toggle mute state
  const toggleMute = useCallback(() => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  }, []);

  // Movement handlers with individual cooldowns
  const placeCurrentPiece = useCallback((prev: GameState) => {
    // Place the current piece and handle the next piece
    const placed = placeTetromino(
      prev.board,
      prev.current.shape,
      prev.position.x,
      prev.position.y,
      prev.current.color
    );
    
    const { board: clearedBoard, linesCleared } = clearLines(placed);
    
    // Calculate new score and level
    let newScore = prev.score;
    let newLevel = prev.level;
    if (linesCleared > 0) {
      soundManager.play('clear'); // Play clear sound when lines are cleared
      newScore += [0, 40, 100, 300, 1200][linesCleared] * prev.level;
      newLevel = Math.floor(newScore / 500) + 1;
    }
    
    // Get next tetromino
    const nextTetromino = getRandomTetromino();
    const startPos = { ...INITIAL_POSITION };
    
    // Check if game over
    if (!canMove(clearedBoard, prev.nextTetromino.shape, startPos.x, startPos.y)) {
      if (animationState.current.frameId) {
        cancelAnimationFrame(animationState.current.frameId);
        animationState.current.frameId = undefined;
      }
      
      return {
        ...prev,
        board: clearedBoard,
        gameOver: true,
        current: { ...prev.current, shape: [] },
        position: { x: -100, y: -100 },
        score: newScore,
        level: newLevel,
        isPieceLanded: false,
        landedTime: null
      };
    }
    
    // Continue with next piece
    return {
      ...prev,
      board: clearedBoard,
      current: prev.nextTetromino,
      nextTetromino: nextTetromino,
      position: startPos,
      score: newScore,
      level: newLevel,
      isPieceLanded: false,
      landedTime: null
    };
  }, []);

  const moveLeft = useCallback(() => {
    const now = Date.now();
    const key = 'ArrowLeft';
    
    // Check if enough time has passed since last move
    if (lastMoveTime.current[key] && 
        now - lastMoveTime.current[key] < (lastMoveTime.current[key] === 0 ? initialCooldown : moveCooldown)) {
      return;
    }
    
    soundManager.play('move');
    setGame(prev => {
      // Check if we can move left
      if (canMove(prev.board, prev.current.shape, prev.position.x - 1, prev.position.y)) {
        lastMoveTime.current[key] = now;
        return { 
          ...prev, 
          position: { ...prev.position, x: prev.position.x - 1 },
          // Reset landing state if we move the piece
          isPieceLanded: false,
          landedTime: null
        };
      } else {
        // Check if piece has landed (can't move down)
        const canMoveDown = canMove(prev.board, prev.current.shape, prev.position.x, prev.position.y + 1);
        if (!canMoveDown) {
          // Handle landing state
          if (prev.isPieceLanded && prev.landedTime && (now - prev.landedTime >= 1000)) {
            // Time's up, place the piece
            return placeCurrentPiece(prev);
          } else if (!prev.isPieceLanded) {
            // First frame of landing
            return { 
              ...prev, 
              isPieceLanded: true, 
              landedTime: now 
            };
          }
        }
        // Otherwise, keep the piece in place but don't place it yet
        return prev;
      }
    });
  }, [placeCurrentPiece]);

  const moveRight = useCallback(() => {
    const now = Date.now();
    const key = 'ArrowRight';
    
    // Check if enough time has passed since last move
    if (lastMoveTime.current[key] && 
        now - lastMoveTime.current[key] < (lastMoveTime.current[key] === 0 ? initialCooldown : moveCooldown)) {
      return;
    }
    
    soundManager.play('move');
    setGame(prev => {
      // Check if we can move right
      if (canMove(prev.board, prev.current.shape, prev.position.x + 1, prev.position.y)) {
        lastMoveTime.current[key] = now;
        return { 
          ...prev, 
          position: { ...prev.position, x: prev.position.x + 1 },
          // Reset landing state if we move the piece
          isPieceLanded: false,
          landedTime: null
        };
      } else {
        // Check if piece has landed (can't move down)
        const canMoveDown = canMove(prev.board, prev.current.shape, prev.position.x, prev.position.y + 1);
        if (!canMoveDown) {
          // Handle landing state
          if (prev.isPieceLanded && prev.landedTime && (now - prev.landedTime >= 1000)) {
            // Time's up, place the piece
            return placeCurrentPiece(prev);
          } else if (!prev.isPieceLanded) {
            // First frame of landing
            return { 
              ...prev, 
              isPieceLanded: true, 
              landedTime: now 
            };
          }
        }
        // Otherwise, keep the piece in place but don't place it yet
        return prev;
      }
    });
  }, [placeCurrentPiece]);

  const moveDown = useCallback(() => {
    const now = Date.now();
    const key = 'ArrowDown';
    
    // Check if enough time has passed since last move
    if (lastMoveTime.current[key] && 
        now - lastMoveTime.current[key] < (lastMoveTime.current[key] === 0 ? initialCooldown : moveCooldown)) {
      return;
    }
    
    soundManager.play('move');
    setGame(prev => {
      // Check if we can move down
      const currentY = Math.floor(prev.position.y);
      const canMoveToNextCell = canMove(prev.board, prev.current.shape, prev.position.x, currentY + 1);
      
      if (canMoveToNextCell) {
        lastMoveTime.current[key] = now;
        return { 
          ...prev, 
          position: { 
            ...prev.position, 
            y: currentY + 1,
            offsetY: 0
          },
          // Reset landing state when we move down
          isPieceLanded: false,
          landedTime: null
        };
      } else {
        // Can't move down, handle landing
        if (prev.isPieceLanded && prev.landedTime && (now - prev.landedTime >= 1000)) {
          // Time's up, place the piece
          return placeCurrentPiece(prev);
        } else if (!prev.isPieceLanded) {
          // First frame of landing
          return { 
            ...prev, 
            isPieceLanded: true, 
            landedTime: now 
          };
        }
        // Otherwise, keep the piece in place but don't place it yet
        return prev;
      }
    });
  }, [placeCurrentPiece]);

  // Handle continuous movement
  const handleContinuousMovement = useCallback(() => {
    const now = Date.now();
    
    // Process left/right movement
    if (keysPressed.current['ArrowLeft']) {
      if (!lastMoveTime.current['ArrowLeft'] || 
          now - lastMoveTime.current['ArrowLeft'] >= (lastMoveTime.current['ArrowLeft'] === 0 ? initialCooldown : moveCooldown)) {
        moveLeft();
        lastMoveTime.current['ArrowLeft'] = now;
      }
    } else {
      lastMoveTime.current['ArrowLeft'] = 0;
    }
    
    if (keysPressed.current['ArrowRight']) {
      if (!lastMoveTime.current['ArrowRight'] || 
          now - lastMoveTime.current['ArrowRight'] >= (lastMoveTime.current['ArrowRight'] === 0 ? initialCooldown : moveCooldown)) {
        moveRight();
        lastMoveTime.current['ArrowRight'] = now;
      }
    } else {
      lastMoveTime.current['ArrowRight'] = 0;
    }
    
    // Process soft drop
    if (keysPressed.current['ArrowDown']) {
      if (!lastMoveTime.current['ArrowDown'] || 
          now - lastMoveTime.current['ArrowDown'] >= moveCooldown / 2) { // Faster cooldown for soft drop
        moveDown();
        lastMoveTime.current['ArrowDown'] = now;
      }
    } else {
      lastMoveTime.current['ArrowDown'] = 0;
    }
  }, [moveLeft, moveRight, moveDown]);
  
  // Keyboard event handler - handles all keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only process if not paused or if it's the pause key
      if (gameState.isPaused && e.key !== 'p' && e.key !== 'P') return;
      
      // Track key state for continuous movement
      keysPressed.current[e.key] = true;
      
      // Handle single-press actions (no repeat for these)
      if (e.repeat) return;
      
      // Prevent default for movement and action keys to avoid scrolling
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '].includes(e.key)) {
        e.preventDefault();
      }
      
      const key = e.key.toLowerCase();
      switch (key) {
        case 'p':
          togglePause();
          break;
        case 'm':
          toggleMute();
          break;
        case 'arrowup':
          // Rotate clockwise - same as clicking the rotate button
          rotatePiece(true);
          break;
        case ' ':
          // Hard drop
          soundManager.play('drop');
          setGame(prev => {
            let y = prev.position.y;
            while (canMove(prev.board, prev.current.shape, prev.position.x, y + 1)) {
              y++;
            }
            
            if (y > prev.position.y) {
              return { ...prev, position: { ...prev.position, y } };
            }
            return prev;
          });
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
    };

    // Main game loop
    const gameLoop = (timestamp: number) => {
      if (gameState.isPaused || gameState.gameOver) {
        // Reset move timers when game is paused
        if (gameState.isPaused) {
          Object.keys(lastMoveTime.current).forEach(key => {
            lastMoveTime.current[key] = 0;
          });
        }
        animationState.current.frameId = requestAnimationFrame(gameLoop);
        return;
      }

      // Calculate delta time
      const now = timestamp || performance.now();
      const deltaTime = now - (lastFrameTime.current || now - 16);
      lastFrameTime.current = now;

      // Process continuous movement
      if (keysPressed.current['ArrowLeft']) {
        if (!lastMoveTime.current['ArrowLeft']) {
          lastMoveTime.current['ArrowLeft'] = 0;
        }
        moveLeft();
      } else {
        lastMoveTime.current['ArrowLeft'] = 0;
      }

      if (keysPressed.current['ArrowRight']) {
        if (!lastMoveTime.current['ArrowRight']) {
          lastMoveTime.current['ArrowRight'] = 0;
        }
        moveRight();
      } else {
        lastMoveTime.current['ArrowRight'] = 0;
      }

      // Process soft drop
      if (keysPressed.current['ArrowDown']) {
        if (!lastMoveTime.current['ArrowDown']) {
          lastMoveTime.current['ArrowDown'] = 0;
        }
        moveDown();
      } else {
        lastMoveTime.current['ArrowDown'] = 0;
      }

      // Process automatic dropping
      dropAccumulator.current += deltaTime;
      const dropSteps = Math.floor(dropAccumulator.current / dropSpeed.current);
      
      if (dropSteps > 0) {
        // Move down by whole cells first
        for (let i = 0; i < dropSteps; i++) {
          moveDown();
        }
        dropAccumulator.current = 0;
        
        // Reset the offset when we've moved a full cell
        setGame(prev => ({
          ...prev,
          position: {
            ...prev.position,
            offsetY: 0
          }
        }));
      } else if (dropAccumulator.current > 0) {
        // Calculate sub-cell offset for smooth movement
        const progress = dropAccumulator.current / dropSpeed.current;
        setGame(prev => ({
          ...prev,
          position: {
            ...prev.position,
            offsetY: -1 + progress // -1 to 0 range for smooth transition
          }
        }));
      } 

      // Schedule next frame
      animationState.current.frameId = requestAnimationFrame(gameLoop);
    };

    // Start the game loop
    animationState.current.frameId = requestAnimationFrame(gameLoop);
    
    // Set up event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Clean up function
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationState.current.frameId) {
        cancelAnimationFrame(animationState.current.frameId);
      }
    };
  }, [moveLeft, moveRight, moveDown, togglePause, toggleMute, gameState.isPaused, gameState.gameOver]);

  useEffect(() => {
    const currentAnimationFrame = animationState.current.frameId;
    return () => {
      if (currentAnimationFrame) {
        cancelAnimationFrame(currentAnimationFrame);
      }
    };
  }, [gameState.isPaused, gameState.gameOver]);

  // Update drop speed based on level
  useEffect(() => {
    dropSpeed.current = Math.max(100, 1000 - (gameState.level * 50)); // Faster as level increases
  }, [gameState.level]);

  const rotatePiece = useCallback((clockwise = true) => {
    soundManager.play('rotate');
    setGame(prev => {
      // If game is over or paused, don't rotate
      if (prev.gameOver || prev.isPaused) {
        return prev;
      }

      // If piece is landed and we're past the 1-second window, don't rotate
      if (prev.isPieceLanded && prev.landedTime && (Date.now() - prev.landedTime >= 1000)) {
        return prev;
      }

      // Get the current rotation state (0-3) or default to 0
      const currentRotation = prev.current.rotationState || 0;
      
      // Calculate the new rotation state (0-3)
      const newRotation = (currentRotation + (clockwise ? 1 : 3)) % 4;
      
      // Create a deep copy of the current tetromino
      const rotated = {
        ...prev.current,
        // Rotate the shape based on the new rotation state
        shape: (() => {
          let shape = [...prev.current.shape];
          // Rotate the shape to the target rotation
          for (let i = 0; i < newRotation; i++) {
            shape = rotateMatrix(shape, true);
          }
          return shape;
        })(),
        rotationState: newRotation
      };
      
      // Try to rotate in place first
      if (canMove(prev.board, rotated.shape, prev.position.x, prev.position.y)) {
        return { 
          ...prev, 
          current: rotated,
          // Reset landing state when we successfully rotate
          isPieceLanded: false,
          landedTime: null
        };
      }
      
      // Wall kick: Try different positions to make room for rotation
      const kickOffsets = [
        { x: 1, y: 0 },  // right
        { x: -1, y: 0 }, // left
        { x: 2, y: 0 },  // right x2
        { x: -2, y: 0 }, // left x2
        { x: 0, y: -1 }, // up
        { x: 1, y: -1 }, // up-right
        { x: -1, y: -1 } // up-left
      ];
      
      for (const offset of kickOffsets) {
        if (canMove(prev.board, rotated.shape, prev.position.x + offset.x, prev.position.y + offset.y)) {
          return {
            ...prev,
            current: rotated,
            position: { 
              x: prev.position.x + offset.x, 
              y: prev.position.y + offset.y 
            },
            // Reset landing state when we successfully rotate with wall kick
            isPieceLanded: false,
            landedTime: null
          };
        }
      }
      
      // If no valid position found, don't rotate
      return prev;
    });
  }, []);

  const handleHardDrop = useCallback(() => {
    soundManager.play('drop');
    setGame(prev => {
      let y = prev.position.y;
      while (canMove(prev.board, prev.current.shape, prev.position.x, y + 1)) {
        y++;
      }
      
      if (y > prev.position.y) {
        // Move the piece to the bottom
        const newState = { ...prev, position: { ...prev.position, y } };
        // Then place it
        return placeCurrentPiece(newState);
      }
      // If we couldn't move down at all, just place it
      return placeCurrentPiece(prev);
    });
  }, [placeCurrentPiece]);

  // Keyboard handling with continuous movement
  // All movement logic is now handled in the main keyboard event handler

  // Drop logic
  const droppingRef = useRef(false);
  const drop = useCallback(() => {
    if (droppingRef.current || gameState.gameOver) return;
    
    setGame((prev: GameState) => {
      // Move down if possible
      if (canMove(prev.board, prev.current.shape, prev.position.x, prev.position.y + 1)) {
        return { 
          ...prev, 
          position: { ...prev.position, y: prev.position.y + 1 } 
        };
      }
      
      // Place the tetromino and clear lines
      const placed = placeTetromino(
        prev.board,
        prev.current.shape,
        prev.position.x,
        prev.position.y,
        prev.current.color
      );
      
      const { board: clearedBoard, linesCleared } = clearLines(placed);
      
      // Calculate new score and level
      let newScore = prev.score;
      let newLevel = prev.level;
      if (linesCleared > 0) {
        newScore += [0, 40, 100, 300, 1200][linesCleared] * prev.level;
        newLevel = Math.floor(newScore / 500) + 1;
      }
      
      // Get next tetromino and check if game is over
      const nextTetromino = getRandomTetromino();
      const startPos = { ...INITIAL_POSITION };
      
      // Check if next piece can be placed
      if (!canMove(clearedBoard, prev.nextTetromino.shape, startPos.x, startPos.y)) {
        // Game over
        if (animationState.current.frameId) {
          cancelAnimationFrame(animationState.current.frameId);
          animationState.current.frameId = undefined;
        }
        
        droppingRef.current = false;
        return {
          ...prev,
          board: clearedBoard,
          gameOver: true,
          current: { ...prev.current, shape: [] },
          position: { x: -100, y: -100 },
          score: newScore,
          level: newLevel
        };
      }
      
      // Continue with next piece
      droppingRef.current = false;
      return {
        ...prev,
        board: clearedBoard,
        current: prev.nextTetromino,
        nextTetromino: nextTetromino,
        position: startPos,
        score: newScore,
        level: newLevel
      };
    });
  }, [gameState.gameOver]);

  // Game timing and loop state
  const lastUpdate = useRef(0);
  
  // Handle automatic piece locking after 1 second of landing
  useEffect(() => {
    if (!gameState.isPieceLanded || !gameState.landedTime) return;
    
    const timeSinceLanding = Date.now() - gameState.landedTime;
    const timeRemaining = Math.max(0, 1000 - timeSinceLanding);
    
    if (timeRemaining <= 0) return;
    
    const timer = setTimeout(() => {
      setGame(prev => {
        // Only place the piece if it's still landed and the time is up
        if (prev.isPieceLanded && prev.landedTime && (Date.now() - prev.landedTime >= 1000)) {
          return placeCurrentPiece(prev);
        }
        return prev;
      });
    }, timeRemaining);
    
    return () => clearTimeout(timer);
  }, [gameState.isPieceLanded, gameState.landedTime, placeCurrentPiece]);
  
  // Update drop speed based on level
  useEffect(() => {
    dropSpeed.current = Math.max(100, 1000 - (gameState.level * 50)); // Faster as level increases
  }, [gameState.level]);
  
  // Define game loop first to avoid circular dependencies
  const gameLoop = useCallback((timestamp: number) => {
    if (!animationState.current.isRunning) return;
    
    // Handle continuous movement
    handleContinuousMovement();
    
    // Get current game state from ref to avoid closure issues
    const currentGameState = gameRef.current;
    
    // If game is over or paused, don't update the game state
    if (currentGameState.gameOver || currentGameState.isPaused) {
      if (currentGameState.isPaused) {
        lastUpdate.current = 0; // Reset timer when paused
      }
      animationState.current.frameId = requestAnimationFrame(gameLoop);
      return;
    }
    
    // Initialize lastUpdate if not set
    const now = timestamp || performance.now();
    if (!lastUpdate.current) {
      lastUpdate.current = now;
      animationState.current.frameId = requestAnimationFrame(gameLoop);
      return;
    }
    
    // Calculate time delta and update game state
    const delta = now - lastUpdate.current;
    lastUpdate.current = now;
    
    // Handle piece dropping with sub-cell movement for smoother animation
    dropAccumulator.current += delta;
    const dropSteps = Math.floor(dropAccumulator.current / dropSpeed.current);
    
    if (dropSteps > 0) {
      // Move down by whole cells first
      for (let i = 0; i < dropSteps; i++) {
        moveDown();
      }
      dropAccumulator.current = 0;
      
      // Reset the offset when we've moved a full cell
      setGame(prev => {
        // Only update if the piece hasn't landed yet
        if (prev.isPieceLanded) return prev;
        return {
          ...prev,
          position: {
            ...prev.position,
            offsetY: 0
          }
        };
      });
    } else if (dropAccumulator.current > 0) {
      // Only update offset if the piece hasn't landed yet
      if (!currentGameState.isPieceLanded) {
        const progress = dropAccumulator.current / dropSpeed.current;
        setGame(prev => ({
          ...prev,
          position: {
            ...prev.position,
            offsetY: -1 + progress // -1 to 0 range for smooth transition
          }
        }));
      }
    } 
    
    // Schedule next frame
    animationState.current.frameId = requestAnimationFrame(gameLoop);
  }, [handleContinuousMovement, moveDown]);
  
  // Start/stop the game loop when needed
  useEffect(() => {
    // Clean up any existing animation frame
    if (animationState.current.frameId) {
      cancelAnimationFrame(animationState.current.frameId);
    }
    
    // Start the game loop
    animationState.current.isRunning = true;
    animationState.current.frameId = requestAnimationFrame(gameLoop);
    
    // Clean up on unmount
    return () => {
      animationState.current.isRunning = false;
      if (animationState.current.frameId) {
        cancelAnimationFrame(animationState.current.frameId);
      }
    };
  }, [gameLoop]);

// ...
  function isValidPosition(pos: {x: number, y: number}, shape: number[][]): boolean {
    return shape.every((row, y) => row.every((cell, x) => {
      if (!cell) return true;
      const newY = pos.y + y;
      const newX = pos.x + x;
      return newY >= 0 && newY < BOARD_HEIGHT && newX >= 0 && newX < BOARD_WIDTH;
    }));
  }

  // Define the cell type for the display board
  type DisplayCell = { color: string; filled: boolean };
  
  // Optimized board rendering
  const displayBoard = useMemo((): DisplayCell[][] => {
    const currentGame = gameState; // Use direct state instead of ref for rendering
    const board: DisplayCell[][] = [];
    
    // Initialize empty board
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      const row: DisplayCell[] = [];
      for (let x = 0; x < BOARD_WIDTH; x++) {
        row.push({ color: '#000000', filled: false });
      }
      board.push(row);
    }
    
    // Copy filled cells from the game board
    for (let y = 0; y < currentGame.board.length; y++) {
      for (let x = 0; x < currentGame.board[y].length; x++) {
        const cell = currentGame.board[y][x];
        if (cell.filled && cell.color) {
          board[y][x] = { 
            color: cell.color, 
            filled: true 
          };
        }
      }
    }
    
    // Add current tetromino if game is active
    if (!currentGame.gameOver && currentGame.current.shape.length > 0) {
      const { shape, color } = currentGame.current;
      const { x: tx, y: ty } = currentGame.position;
      
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x]) {
            const newY = ty + y;
            const newX = tx + x;
            if (newY >= 0 && newY < BOARD_HEIGHT && newX >= 0 && newX < BOARD_WIDTH) {
board[newY][newX] = { 
                color: color || '#000000', 
                filled: true 
              };
            }
          }
        }
      }
    }
    
    return board;
  }, [gameState]);

  // Secondary keyboard event handler for single-press actions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.isPaused && e.key !== 'p' && e.key !== 'P') return;
      
      // Prevent default for all movement keys to avoid scrolling
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' ', 'z', 'Z', 'x', 'X'].includes(e.key)) {
        e.preventDefault();
      }
      
      // Track key state for continuous movement
      keysPressed.current[e.key] = true;
      
      // Handle single-press actions
      if (e.repeat) return;
      
      switch (e.key.toLowerCase()) {
        case 'p':
          togglePause();
          break;
        case 'm':
          toggleMute();
          break;
        case 'arrowup':
        case 'x':
          // Rotate clockwise
          rotatePiece(true);
          break;
        case 'z':
          // Rotate counter-clockwise
          rotatePiece(false);
          break;
        case ' ':
          // Hard drop
          soundManager.play('drop');
          setGame(prev => {
            let y = prev.position.y;
            while (canMove(prev.board, prev.current.shape, prev.position.x, y + 1)) {
              y++;
            }
            
            if (y > prev.position.y) {
              return { ...prev, position: { ...prev.position, y } };
            }
            return prev;
          });
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [togglePause, toggleMute, gameState.isPaused]);

  // Handler for restarting the game
  const handleRestart = useCallback((): void => {
    const newGame = {
      ...initialGameState(),
      isPaused: false
    };
    
    // Reset game state
    setGame(newGame);
    
    // Reset game loop
    if (animationState.current.frameId) {
      cancelAnimationFrame(animationState.current.frameId);
    }
    
    // Reset timing
    lastUpdate.current = 0;
    dropAccumulator.current = 0;
    
    // Make sure we're not paused when restarting
    setGame(prev => ({
      ...prev,
      isPaused: false
    }));
    
    // Restart the game loop
    animationState.current.frameId = requestAnimationFrame((timestamp) => {
      lastUpdate.current = timestamp;
      gameLoop(timestamp);
    });
  }, [gameLoop, setGame]);

  // Play sound effects for line clears and game over
  useEffect(() => {
    if (gameState.gameOver) {
      soundManager.play('gameover');
    }
    // Add other sound effects here based on game state changes
  }, [gameState.gameOver]);

  console.log('Rendering with game state:', gameState);
  
  // Render the game UI
  return (
    <div className="tetris-app-wrapper">
      <div className="tetris-app">
        <div className="game-controls">
          <button 
            onClick={togglePause} 
            className="control-button pause-button"
            title={gameState.isPaused ? 'Resume (P)' : 'Pause (P)'}
            aria-label={gameState.isPaused ? 'Resume' : 'Pause'}
          >
            {gameState.isPaused ? '▶' : '⏸'}
          </button>
          <button 
            onClick={toggleMute} 
            className="control-button mute-button"
            title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
        <div className="main-content">
          <div className="game-container">
            {gameState.isPaused && (
              <div className="paused-overlay">
                <div className="paused-text">PAUSED</div>
                <button onClick={togglePause} className="resume-button">
                  Click or Press P to Resume
                </button>
              </div>
            )}
            <GameBoard 
              board={displayBoard}
              gameOver={gameState.gameOver}
              onRestart={handleRestart}
              isPaused={gameState.isPaused}
              currentPiece={!gameState.gameOver ? {
                shape: gameState.current.shape,
                position: gameState.position,
                color: gameState.current.color
              } : undefined}
            />
          </div>
          <div className="right-panel">
            <SidePanel 
              level={gameState.level} 
              score={gameState.score} 
              nextTetromino={gameState.nextTetromino} 
              isPaused={gameState.isPaused}
            />
            <h1 className="game-title">TETRIS <span className="by-shadeed">By Shadeed</span></h1>
            <Controls 
              onLeft={moveLeft} 
              onRight={moveRight} 
              onRotate={rotatePiece} 
              onDown={moveDown} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
