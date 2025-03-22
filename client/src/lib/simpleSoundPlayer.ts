// A simple sound player for one-off sounds (non-looping, like notifications)
// This is much simpler than the full soundManager and is used for notification sounds

// Use a single shared Audio context for better browser compatibility
let audioContext: AudioContext | null = null;

// Cache for loaded samples
const sampleCache: Map<string, AudioBuffer> = new Map();

/**
 * Initialize the audio context (must be done on user interaction)
 */
export const initAudio = (): void => {
  if (!audioContext) {
    try {
      // The AudioContext must be created as a result of user action to prevent autoplay policy issues
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('Audio context initialized');
    } catch (error) {
      console.error('Failed to create AudioContext:', error);
    }
  }
};

/**
 * Plays a sound once, with no looping
 * @param url The URL of the sound file to play
 * @param volume Volume from 0 to 1
 */
export const playSound = (url: string, volume = 0.5): void => {
  try {
    // Initialize audio context if it doesn't exist
    if (!audioContext) {
      initAudio();
      
      // If still null after initialization, use fallback
      if (!audioContext) {
        playFallbackSound(url, volume);
        return;
      }
    }
    
    // If we have a cached sample, play it
    if (sampleCache.has(url)) {
      playBuffer(sampleCache.get(url)!, volume);
      return;
    }
    
    // Otherwise, load and play
    fetch(url)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => audioContext!.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        // Cache for future use
        sampleCache.set(url, audioBuffer);
        // Play it
        playBuffer(audioBuffer, volume);
      })
      .catch(error => {
        console.error('Error loading sound:', error);
        // Fall back to regular Audio
        playFallbackSound(url, volume);
      });
  } catch (error) {
    console.error('Failed to play sound:', error);
    // Try fallback if Web Audio API fails
    playFallbackSound(url, volume);
  }
};

// Play using AudioBuffer (better mobile compatibility)
const playBuffer = (buffer: AudioBuffer, volume: number): void => {
  if (!audioContext) return;
  
  // Create source node
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  
  // Create gain node for volume
  const gainNode = audioContext.createGain();
  gainNode.gain.value = Math.max(0, Math.min(1, volume));
  
  // Connect nodes
  source.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  // Play sound
  source.start(0);
};

// Fallback to standard Audio API
const playFallbackSound = (url: string, volume = 0.5): void => {
  const audio = new Audio(url);
  audio.volume = Math.max(0, Math.min(1, volume));
  
  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.catch(error => {
      console.error('Error playing fallback sound:', error);
    });
  }
};

/**
 * Preloads a sound file for faster playback later
 * @param url The URL of the sound file to preload
 */
export const preloadSound = (url: string): void => {
  // Don't preload if we already have it in sample cache
  if (sampleCache.has(url)) return;
  
  // Initialize audio context if needed
  if (!audioContext) {
    try {
      initAudio();
    } catch (error) {
      console.error('Failed to initialize audio for preloading:', error);
      // Still proceed to fallback
    }
  }
  
  // If we have an audio context, preload with the Web Audio API
  if (audioContext) {
    fetch(url)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => audioContext!.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        sampleCache.set(url, audioBuffer);
        console.log(`Preloaded sound: ${url}`);
      })
      .catch(error => {
        console.error(`Error preloading sound ${url}:`, error);
      });
  } else {
    // Fallback to standard Audio element preloading
    try {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = url;
      audio.load();
    } catch (error) {
      console.error(`Error preloading sound ${url} with fallback:`, error);
    }
  }
};

/**
 * Clear audio cache and release memory
 */
export const cleanup = (): void => {
  // Clear sample cache
  sampleCache.clear();
  
  // Close audio context if it exists
  if (audioContext && audioContext.state !== 'closed') {
    try {
      audioContext.close().catch(error => {
        console.error('Error closing audio context:', error);
      });
      audioContext = null;
    } catch (error) {
      console.error('Error during audio cleanup:', error);
    }
  }
};