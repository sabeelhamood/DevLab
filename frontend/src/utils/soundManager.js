import { Howl } from 'howler'

export const correctSound = new Howl({ src: ['/sounds/correct.mp3'], volume: 0.6, preload: true })
export const wrongSound = new Howl({ src: ['/sounds/wrong.mp3'], volume: 0.6, preload: true })
export const gameOverSound = new Howl({ 
  src: ['/assets/sfx/game-over-417465.mp3'], 
  volume: 0.6, 
  preload: true,
  html5: true // Use HTML5 Audio for better compatibility
})

export const playFeedback = (isCorrect) => {
  try {
    if (isCorrect) {
      correctSound.play()
    } else {
      wrongSound.play()
    }
  } catch (error) {
    console.error('Audio playback failed:', error)
  }
}

export const preloadFeedbackSounds = () => {
  correctSound.load()
  wrongSound.load()
  gameOverSound.load()
}
// Sound Manager for Competition Pages
class SoundManager {
  constructor() {
    this.sounds = {};
    this.isEnabled = true;
    this.volume = 0.5;
    this.initializeSounds();
  }

  initializeSounds() {
    // Create audio elements for different sounds
    this.sounds = {
      background: new Audio('/sounds/background.mp3'),
      start: new Audio('/sounds/start.mp3'),
      countdown: new Audio('/sounds/countdown.mp3'),
      complete: new Audio('/sounds/complete.mp3'),
      correct: new Audio('/sounds/correct.mp3'),
      wrong: new Audio('/sounds/wrong.mp3'),
      timer: new Audio('/sounds/timer.mp3'),
      join: new Audio('/sounds/join.mp3')
    };

    // Set volume and loop settings
    const audioList = Object.values(this.sounds || {});
    audioList.forEach(audio => {
      if (!audio) return;
      audio.volume = this.volume;
      audio.preload = 'auto';
    });

    // Background music should loop
    if (this.sounds.background) {
      this.sounds.background.loop = true;
    }
  }

  playSound(soundType) {
    if (!this.isEnabled || !this.sounds[soundType]) return;
    
    try {
      const audio = this.sounds[soundType];
      audio.currentTime = 0; // Reset to beginning
      audio.play().catch(error => {
        console.log(`Could not play ${soundType} sound:`, error);
      });
    } catch (error) {
      console.log(`Error playing ${soundType} sound:`, error);
    }
  }

  playBackgroundMusic() {
    if (!this.isEnabled || !this.sounds.background) return;
    
    try {
      this.sounds.background.play().catch(error => {
        console.log('Could not play background music:', error);
      });
    } catch (error) {
      console.log('Error playing background music:', error);
    }
  }

  stopBackgroundMusic() {
    if (this.sounds.background) {
      this.sounds.background.pause();
      this.sounds.background.currentTime = 0;
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    const audioList = Object.values(this.sounds || {});
    audioList.forEach(audio => {
      if (!audio) return;
      audio.volume = this.volume;
    });
  }

  toggleSound() {
    this.isEnabled = !this.isEnabled;
    if (!this.isEnabled) {
      this.stopBackgroundMusic();
    }
    return this.isEnabled;
  }

  // Create fallback sounds using Web Audio API for browsers that don't support audio files
  createFallbackSound(frequency, duration, type = 'sine') {
    if (!this.isEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.log('Could not create fallback sound:', error);
    }
  }

  // Fallback sound methods
  playFallbackStart() {
    this.createFallbackSound(440, 0.2, 'sine'); // A4 note
  }

  playFallbackComplete() {
    this.createFallbackSound(523, 0.3, 'sine'); // C5 note
  }

  playFallbackCorrect() {
    this.createFallbackSound(659, 0.2, 'sine'); // E5 note
  }

  playFallbackWrong() {
    this.createFallbackSound(220, 0.3, 'sawtooth'); // A3 note
  }

  playFallbackTimer() {
    this.createFallbackSound(880, 0.1, 'square'); // A5 note
  }

  playFallbackJoin() {
    this.createFallbackSound(330, 0.4, 'sine'); // E4 note
  }
}

// Create a singleton instance
const soundManager = new SoundManager();

export default soundManager;
