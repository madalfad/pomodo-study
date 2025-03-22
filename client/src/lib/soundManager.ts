// A simple sound manager using Web Audio API

// Map to store audio contexts and nodes
const audioContexts: Map<string, AudioContext> = new Map();
const audioSources: Map<string, MediaElementAudioSourceNode> = new Map();
const gainNodes: Map<string, GainNode> = new Map();
const audioElements: Map<string, HTMLAudioElement> = new Map();

// Initialize audio for a track
export const initializeSound = (id: string, url: string): void => {
  // Create audio element if it doesn't exist
  if (!audioElements.has(id)) {
    const audioElement = new Audio(url);
    audioElement.loop = true;
    audioElement.preload = 'auto';
    audioElements.set(id, audioElement);
    
    // Create audio context
    const audioContext = new AudioContext();
    audioContexts.set(id, audioContext);
    
    // Create source and gain nodes
    const source = audioContext.createMediaElementSource(audioElement);
    const gainNode = audioContext.createGain();
    
    // Connect nodes
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Store references
    audioSources.set(id, source);
    gainNodes.set(id, gainNode);
    
    // Set initial volume
    gainNode.gain.value = 0.5; // 50% volume
  }
};

// Play a sound track
export const playSound = (id: string, volume: number = 0.5): void => {
  const audioElement = audioElements.get(id);
  const audioContext = audioContexts.get(id);
  
  if (audioElement && audioContext) {
    // Resume audio context if it's suspended (browser autoplay policy)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    // Set volume
    setVolume(id, volume);
    
    // Play audio
    audioElement.play().catch(error => {
      console.error(`Error playing audio ${id}:`, error);
    });
  }
};

// Pause a sound track
export const pauseSound = (id: string): void => {
  const audioElement = audioElements.get(id);
  
  if (audioElement) {
    audioElement.pause();
  }
};

// Set volume for a sound track
export const setVolume = (id: string, volume: number): void => {
  const gainNode = gainNodes.get(id);
  
  if (gainNode) {
    // Ensure volume is between 0 and 1
    const normalizedVolume = Math.max(0, Math.min(1, volume));
    gainNode.gain.value = normalizedVolume;
  }
};

// Clean up resources
export const cleanup = (): void => {
  // Stop all audio elements
  audioElements.forEach((audioElement) => {
    audioElement.pause();
    audioElement.src = '';
  });
  
  // Close all audio contexts
  audioContexts.forEach((context) => {
    context.close();
  });
  
  // Clear all maps
  audioElements.clear();
  audioContexts.clear();
  audioSources.clear();
  gainNodes.clear();
};
