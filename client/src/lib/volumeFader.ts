/**
 * Smoothly transitions the volume of a YouTube player from one level to another
 * 
 * @param player The YouTube player instance
 * @param fromVolume The starting volume (0-100)
 * @param toVolume The target volume (0-100)
 * @param duration The duration of the transition in milliseconds (default: 1000ms)
 * @param onUpdate Optional callback for volume updates during transition
 * @returns The interval ID used for the fade (can be used to cancel the fade)
 */
export function fadeVolume(
  player: any, 
  fromVolume: number, 
  toVolume: number, 
  duration: number = 1000,
  onUpdate?: (currentVolume: number) => void
): NodeJS.Timeout {
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
  
  // Setup fade parameters
  const stepTime = 20; // Update every 20ms for smoother transition
  const steps = duration / stepTime;
  const volumeStep = (toVolume - fromVolume) / steps;
  
  let currentVolume = fromVolume;
  let currentStep = 0;
  
  // Use setInterval for consistent timing
  const fadeInterval = setInterval(() => {
    currentVolume += volumeStep;
    
    // Ensure volume stays within bounds
    if ((volumeStep > 0 && currentVolume > toVolume) || 
        (volumeStep < 0 && currentVolume < toVolume)) {
      currentVolume = toVolume;
    }
    
    // Apply volume to player
    try {
      if (player && typeof player.setVolume === 'function') {
        player.setVolume(Math.round(currentVolume));
      }
    } catch (error) {
      console.error(`Error setting volume: ${error}`);
    }
    
    // Call update callback if provided
    if (onUpdate) {
      onUpdate(Math.round(currentVolume));
    }
    
    currentStep++;
    
    // Stop the interval when we've reached the target volume or completed all steps
    if (currentStep >= steps || Math.abs(currentVolume - toVolume) < 0.5) {
      clearInterval(fadeInterval);
      
      // Ensure final volume is exactly the target volume
      try {
        if (player && typeof player.setVolume === 'function') {
          player.setVolume(toVolume);
        }
      } catch (error) {
        console.error(`Error setting final volume: ${error}`);
      }
      
      if (onUpdate) {
        onUpdate(toVolume);
      }
      
      console.log(`Fade complete. Final volume for ${videoTitle}: ${toVolume}`);
    }
  }, stepTime);
  
  // Return the interval ID if needed for cancellation
  return fadeInterval;
}