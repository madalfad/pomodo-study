/**
 * Smoothly transitions the volume of a YouTube player from one level to another using requestAnimationFrame
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
  fromVolume = Math.round(Number(fromVolume));
  toVolume = Math.round(Number(toVolume));
  const volumeDifference = Math.abs(toVolume - fromVolume);
  
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
  
  // If the difference is too small, just set the volume directly and return
  if (volumeDifference < 2) {
    try {
      if (player && typeof player.setVolume === 'function') {
        player.setVolume(toVolume);
      }
      if (onUpdate) {
        onUpdate(toVolume);
      }
    } catch (error) {
      console.error(`Error setting direct volume: ${error}`);
    }
    return { cancel: () => {} };
  }
  
  console.log(`Fading volume for ${videoTitle} from ${fromVolume} to ${toVolume} over ${duration}ms (diff: ${volumeDifference})`);
  
  // Force a first update immediately 
  try {
    if (player && typeof player.setVolume === 'function') {
      player.setVolume(fromVolume);
    }
    if (onUpdate) {
      onUpdate(fromVolume);
    }
  } catch (error) {
    console.error(`Error setting initial volume: ${error}`);
  }
  
  // Setup animation variables
  const startTime = Date.now();
  const endTime = startTime + duration;
  let animationFrameId: number | null = null;
  let isCancelled = false;
  
  // Function to update volume during animation
  const updateVolume = () => {
    if (isCancelled) return;
    
    const now = Date.now();
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Apply easing for smoother transitions (ease-in-out)
    const easedProgress = progress < 0.5 
      ? 2 * progress * progress 
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    
    // Calculate current volume
    const currentVolume = Math.round(fromVolume + (toVolume - fromVolume) * easedProgress);
    
    try {
      // Apply volume to player
      if (player && typeof player.setVolume === 'function') {
        player.setVolume(currentVolume);
      }
      
      // Update callback if provided
      if (onUpdate) {
        onUpdate(currentVolume);
      }
    } catch (error) {
      console.error(`Error setting volume: ${error}`);
      isCancelled = true;
    }
    
    // Continue animation if not complete
    if (now < endTime && !isCancelled) {
      animationFrameId = requestAnimationFrame(updateVolume);
    } else {
      // Ensure final volume is set
      try {
        if (player && typeof player.setVolume === 'function') {
          player.setVolume(toVolume);
        }
        if (onUpdate) {
          onUpdate(toVolume);
        }
        
        if (!isCancelled) {
          console.log(`Fade complete. Final volume for ${videoTitle}: ${toVolume}`);
        }
      } catch (error) {
        console.error(`Error setting final volume: ${error}`);
      }
    }
  };
  
  // Start the animation
  animationFrameId = requestAnimationFrame(updateVolume);
  
  // Return an object with a cancel method
  return {
    cancel: () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        isCancelled = true;
      }
    }
  };
}