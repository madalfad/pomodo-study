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
      console.log(`Volume difference too small (${fromVolume} → ${toVolume}), setting directly`);
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
  
  // Track last volume to avoid unnecessary updates
  let lastVolume: number | null = null;
  
  // Store expected intermediate volume values for tracking progress
  const expectedVolumePoints: number[] = [];
  const totalSteps = Math.min(Math.abs(toVolume - fromVolume), 20); // Max 20 steps for larger gaps
  
  // Pre-calculate expected volume points for monitoring progress
  for (let i = 0; i <= totalSteps; i++) {
    const p = i / totalSteps;
    
    // Use the same easing as in the animation
    const easedP = p < 0.5 
      ? 2 * p * p 
      : 1 - Math.pow(-2 * p + 2, 2) / 2;
      
    const vol = Math.round(fromVolume + (toVolume - fromVolume) * easedP);
    expectedVolumePoints.push(vol);
  }
  
  console.log(`Volume transition map (${expectedVolumePoints.length} points):`, expectedVolumePoints.join(' → '));
  
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
    
    // Calculate current volume - use more precise values to ensure more intermediate steps
    const rawVolume = fromVolume + (toVolume - fromVolume) * easedProgress;
    const currentVolume = Math.round(rawVolume);
    
    // Only update if the volume actually changed from last update
    if (lastVolume === null || currentVolume !== lastVolume) {
      lastVolume = currentVolume;
      
      // Debug info at regular intervals
      if (progress === 0 || progress === 1 || progress % 0.1 < 0.01) {
        console.log(`${videoTitle} fade progress: ${(progress * 100).toFixed(0)}%, volume: ${currentVolume} (raw: ${rawVolume.toFixed(2)})`);
      }
      
      try {
        // Apply volume to player and update callback
        if (player && typeof player.setVolume === 'function') {
          player.setVolume(currentVolume);
        }
        
        if (onUpdate) {
          onUpdate(currentVolume);
        }
      } catch (error) {
        console.error(`Error setting volume: ${error}`);
        isCancelled = true;
      }
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