// A simple sound player for one-off sounds (non-looping, like notifications)
// This is much simpler than the full soundManager and is used for notification sounds

const audioCache: Map<string, HTMLAudioElement> = new Map();

/**
 * Plays a sound once, with no looping
 * @param url The URL of the sound file to play
 * @param volume Volume from 0 to 1
 */
export const playSound = (url: string, volume = 0.5): void => {
  try {
    // Create or retrieve audio element
    let audio = audioCache.get(url);
    
    if (!audio) {
      audio = new Audio(url);
      audioCache.set(url, audio);
    }
    
    // Set volume and reset position
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.currentTime = 0;
    
    // Play the sound with error handling
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error('Error playing sound:', error);
      });
    }
  } catch (error) {
    console.error('Failed to play sound:', error);
  }
};

/**
 * Preloads a sound file for faster playback later
 * @param url The URL of the sound file to preload
 */
export const preloadSound = (url: string): void => {
  if (!audioCache.has(url)) {
    const audio = new Audio(url);
    audio.preload = 'auto';
    audioCache.set(url, audio);
    
    // Force browser to load the file
    audio.load();
  }
};

/**
 * Clear audio cache and release memory
 */
export const cleanup = (): void => {
  audioCache.forEach((audio) => {
    audio.pause();
    audio.src = '';
  });
  audioCache.clear();
};