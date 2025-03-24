/**
 * Smoothly transitions the volume of a YouTube player from one level to another 
 * using setInterval to match the original implementation
 * 
 * @param player The YouTube player instance
 * @param fromVolume The starting volume (0-100)
 * @param toVolume The target volume (0-100)
 * @param duration The duration of the transition in milliseconds (default: 1000ms)
 * @param onUpdate Optional callback for volume updates during transition
 * @returns An object with a cancel method that can be used to stop the fade
 */
export function fadeVolume(
  player: any, 
  fromVolume: number, 
  toVolume: number, 
  duration: number = 1000,
  onUpdate?: (currentVolume: number) => void
): { cancel: () => void } {
  // Ensure volumes are numbers
  fromVolume = Number(fromVolume);
  toVolume = Number(toVolume);
  
  // Get information about the player if available for logging
  let videoTitle = 'Unknown';
  try {
    if (player && player.getVideoData) {
      videoTitle = player.getVideoData().title;
    }
  } catch (error) {
    // Couldn't get video data, use generic name
    videoTitle = 'Player';
  }
  
  console.log(`Fading volume for ${videoTitle} from ${fromVolume} to ${toVolume} over ${duration}ms`);
  
  // The original implementation uses fixed 100ms steps
  const stepTime = 100;
  const steps = duration / stepTime;
  const volumeStep = (toVolume - fromVolume) / steps;
  let currentVolume = fromVolume;
  let currentStep = 0;
  
  // Create interval
  const fadeInterval = setInterval(() => {
    // Update the volume value and apply it to the player
    currentVolume += volumeStep;
    
    // Apply to player
    try {
      if (player && typeof player.setVolume === 'function') {
        player.setVolume(currentVolume);
      }
    } catch (error) {
      console.error('Error setting player volume:', error);
      clearInterval(fadeInterval);
    }
    
    // Call update callback with the new volume
    if (onUpdate) {
      onUpdate(currentVolume);
    }
    
    // Increment step counter
    currentStep++;
    
    // Check if we're done
    if (currentStep >= steps) {
      clearInterval(fadeInterval);
      
      // Ensure we set the final volume exactly
      try {
        if (player && typeof player.setVolume === 'function') {
          player.setVolume(toVolume);
        }
      } catch (error) {
        console.error('Error setting final volume:', error);
      }
      
      // Final update callback
      if (onUpdate) {
        onUpdate(toVolume);
      }
      
      console.log(`Fade complete. Final volume for ${videoTitle}: ${toVolume}`);
    }
  }, stepTime);
  
  // Return an object with a cancel method
  return {
    cancel: () => {
      clearInterval(fadeInterval);
    }
  };
}