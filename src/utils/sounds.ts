// Sound effects for the game
type SoundType = 'move' | 'rotate' | 'drop' | 'clear' | 'gameover';

class SoundManager {
  private sounds: Record<SoundType, HTMLAudioElement> = {
    move: new Audio('/sounds/move.mp3'),
    rotate: new Audio('/sounds/rotate.mp3'),
    drop: new Audio('/sounds/drop.mp3'),
    clear: new Audio('/sounds/clear.mp3'),
    gameover: new Audio('/sounds/gameover.mp3'),
  };
  private isMuted = false;

  constructor() {
    // Set volume levels
    this.sounds.move.volume = 0.3;
    this.sounds.rotate.volume = 0.3;
    this.sounds.drop.volume = 0.4;
    this.sounds.clear.volume = 0.5;
    this.sounds.gameover.volume = 0.6;
  }

  play(sound: SoundType) {
    if (this.isMuted) return;
    
    // Create a new audio instance to allow overlapping sounds
    const audio = new Audio(this.sounds[sound].src);
    audio.volume = this.sounds[sound].volume;
    audio.play().catch(e => console.warn('Audio play failed:', e));
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }
}

export const soundManager = new SoundManager();
