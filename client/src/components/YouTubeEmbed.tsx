import { FC, useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RefreshCcw } from 'lucide-react';

interface YouTubeEmbedProps {
  defaultUrl: string;
  title: string;
  onVolumeChange: (volume: number) => void;
  onBreakVolumeChange: (volume: number) => void;
  initialVolume: number;
  breakVolume: number;
  onVideoChange: (url: string) => void;
  onReset?: () => void; // Make optional to avoid errors
  onTitleChange?: (title: string) => void; // Add callback for title changes
}

const YouTubeEmbed: FC<YouTubeEmbedProps> = ({ 
  defaultUrl, 
  title, 
  onVolumeChange, 
  onBreakVolumeChange,
  initialVolume,
  breakVolume,
  onVideoChange,
  onReset,
  onTitleChange
}) => {
  const [url, setUrl] = useState(defaultUrl);
  const [inputUrl, setInputUrl] = useState(defaultUrl);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [volume, setVolume] = useState(initialVolume);
  const [videoId, setVideoId] = useState<string | null>(null);
  const playerRef = useRef<any>(null);
  const transitionRef = useRef<{ 
    animationId: number | null, 
    startVolume: number, 
    targetVolume: number, 
    startTime: number,
    forceStartVolume: boolean 
  }>({
    animationId: null,
    startVolume: initialVolume,
    targetVolume: initialVolume,
    startTime: 0,
    forceStartVolume: false
  });
  
  // Extract YouTube video ID from URL - defining outside useEffect for reuse
  const extractVideoId = (url: string): string | null => {
    // Check if URL is empty
    if (!url || url.trim() === '') {
      console.log('Empty URL provided');
      return null;
    }
    
    try {
      // Handle different YouTube URL formats
      // Standard video URL (youtube.com/watch?v=VIDEO_ID)
      const standardRegExp = /^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#\&\?]*).*/;
      const standardMatch = url.match(standardRegExp);
      
      if (standardMatch && standardMatch[2] && standardMatch[2].length === 11) {
        console.log(`Extracted standard video ID: ${standardMatch[2]}`);
        return standardMatch[2];
      }
      
      // Handle YouTube livestream URLs
      // Format 1: youtube.com/live/VIDEO_ID
      const liveRegExp = /^.*(?:youtube\.com\/live\/)([^#\&\?]*).*/;
      const liveMatch = url.match(liveRegExp);
      
      if (liveMatch && liveMatch[1]) {
        console.log(`Extracted livestream ID: ${liveMatch[1]}`);
        return liveMatch[1];
      }
      
      // Format 2: livestreams with channel IDs (youtube.com/channel/CHANNEL_ID/live)
      const channelLiveRegExp = /^.*(?:youtube\.com\/channel\/)([^\/]*)\/live.*/;
      const channelLiveMatch = url.match(channelLiveRegExp);
      
      if (channelLiveMatch && channelLiveMatch[1]) {
        console.log(`Extracted channel livestream: ${channelLiveMatch[1]}`);
        // For channel livestreams, we'll use the channel ID with /live
        return channelLiveMatch[1];
      }
      
      // Short URL format (youtu.be/VIDEO_ID) - more permissive matching
      const shortUrlRegExp = /^.*youtu\.be\/([^#\&\?]*).*/;
      const shortUrlMatch = url.match(shortUrlRegExp);
      
      if (shortUrlMatch && shortUrlMatch[1]) {
        const videoId = shortUrlMatch[1].split('?')[0].split('/')[0]; // Remove any additional path or query params
        console.log(`Extracted short URL video ID: ${videoId}`);
        return videoId;
      }
      
      console.log('No video ID found in URL:', url);
      return null;
    } catch (error) {
      console.error('Error extracting video ID:', error);
      return null;
    }
  };

  // Update videoId when URL changes
  useEffect(() => {
    const id = extractVideoId(url);
    setVideoId(id);
  }, [url]);
  
  // Make sure volume state syncs with props
  useEffect(() => {
    // Set current volume to the correct value for current timer state
    const currentTimerType = localStorage.getItem('currentTimerType') || 'focus';
    
    if (currentTimerType === 'focus') {
      setVolume(initialVolume);
      console.log(`Initial load: Setting to focus volume: ${initialVolume}%`);
    } else {
      setVolume(breakVolume);
      console.log(`Initial load: Setting to break volume: ${breakVolume}%`);
    }
  }, [initialVolume, breakVolume]);
  
  // Load YouTube API
  useEffect(() => {
    // Only load the API once
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
    
    // This function will be called when the API is ready
    window.onYouTubeIframeAPIReady = () => {
      if (videoId) {
        initializePlayer();
      }
    };
    
    // If the API is already loaded, initialize the player directly
    if (window.YT && window.YT.Player && videoId) {
      initializePlayer();
    }
    
    return () => {
      // Clean up the player
      if (playerRef.current) {
        playerRef.current.destroy();
      }
      
      // Cancel any ongoing volume transitions
      if (transitionRef.current.animationId !== null) {
        cancelAnimationFrame(transitionRef.current.animationId);
        transitionRef.current.animationId = null;
      }
    };
  }, [videoId]);
  
  // Initialize the YouTube player
  const initializePlayer = () => {
    if (!videoId) {
      console.error('Cannot initialize player: No video ID available');
      return;
    }
    
    try {
      console.log(`Initializing ${title} player with video ID: ${videoId}`);
      
      // If a player already exists, destroy it
      if (playerRef.current) {
        console.log(`Destroying existing ${title} player instance`);
        try {
          playerRef.current.destroy();
        } catch (error) {
          console.error(`Error destroying player:`, error);
        }
      }
      
      const playerId = `youtube-player-${title.toLowerCase().replace(/\s/g, '-')}`;
      const containerId = `youtube-container-${title.toLowerCase().replace(/\s/g, '-')}`;
      
      console.log(`Creating player with ID: ${playerId} in container: ${containerId}`);
      
      // Create container if it doesn't exist
      const containerElement = document.getElementById(containerId);
      if (!containerElement) {
        console.error(`Container element #${containerId} not found!`);
        return;
      }
      
      // Clear existing content in the container
      containerElement.innerHTML = '';
      
      // Create a new container for the player
      const playerContainer = document.createElement('div');
      playerContainer.id = playerId;
      containerElement.appendChild(playerContainer);
      
      // Determine if this is a livestream
      const isLivestream = url.toLowerCase().includes('live');
      console.log(`URL contains 'live'? ${isLivestream}`);
      
      // Configure player
      const playerConfig = {
        height: '200',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 1,
          rel: 0,
          showinfo: 0,
          mute: 0,
          loop: 1,
          enablejsapi: 1,
          origin: window.location.origin,
          playsinline: 1
        },
        events: {
          onReady: (event: any) => {
            console.log(`${title} player ready!`);
            try {
              // Store the player instance directly for easier access
              playerRef.current = event.target;
              
              // CRITICAL: Set initial volume with verification
              if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
                playerRef.current.setVolume(volume);
                console.log(`${title} player: Set initial volume to ${volume}%`);
                
                // Read back the volume to verify
                if (typeof playerRef.current.getVolume === 'function') {
                  try {
                    const actualVolume = playerRef.current.getVolume();
                    console.log(`${title} player: Verified volume is set to ${actualVolume}%`);
                    
                    // If there's a mismatch, try setting it again
                    if (actualVolume !== volume) {
                      console.log(`${title} player: Volume mismatch, resetting to ${volume}%`);
                      playerRef.current.setVolume(volume);
                    }
                  } catch (volError) {
                    console.error(`Error getting volume:`, volError);
                  }
                }
              } else {
                console.error(`${title} player: Cannot set volume - missing setVolume method`);
              }
              
              // Get video title and pass it to parent component
              const videoTitle = playerRef.current.getVideoData().title;
              if (videoTitle && onTitleChange) {
                console.log(`Retrieved video title for ${title}: ${videoTitle}`);
                onTitleChange(videoTitle);
              }
              
              // Special handling for livestreams
              if (isLivestream) {
                console.log(`${title} is a livestream, seeking to end`);
                
                // For livestreams: first check if we can get duration
                const duration = playerRef.current.getDuration();
                if (duration && duration > 0) {
                  console.log(`Seeking to end of livestream, duration: ${duration}`);
                  playerRef.current.seekTo(duration, true);
                } else {
                  console.log(`Cannot determine livestream duration, continuing without seeking`);
                }
              }
            } catch (error) {
              console.error(`Error in onReady handler:`, error);
            }
          },
          onError: (event: any) => {
            const errorCodes = {
              2: 'Invalid parameter',
              5: 'HTML5 player error',
              100: 'Video not found or removed',
              101: 'Video embedding not allowed',
              150: 'Video embedding not allowed (same as 101)'
            };
            const errorCode = event.data;
            console.error(`YouTube player error (${errorCode}): ${(errorCodes as any)[errorCode] || 'Unknown error'}`);
            
            // If video embedding is not allowed, show a message
            if (errorCode === 101 || errorCode === 150) {
              const container = document.getElementById(containerId);
              if (container) {
                container.innerHTML = `
                  <div class="flex items-center justify-center h-full bg-black text-white p-4 text-center">
                    <p>This video doesn't allow embedding. Please choose another video in settings.</p>
                  </div>
                `;
              }
            }
          }
        }
      };
      
      // Create new player
      console.log(`Creating new ${title} YouTube player instance`);
      playerRef.current = new window.YT.Player(playerId, playerConfig);
      
    } catch (error) {
      console.error(`Failed to initialize ${title} player:`, error);
    }
  };
  
  // Function to smoothly transition volume
  const smoothVolumeTransition = (targetVol: number) => {
    // Don't check current volume - we want to transition regardless
    // This prevents issues when the player's current volume is out of sync with our state
    console.log(`Request to transition volume to: ${targetVol}%`);
    
    // Cancel any ongoing transition
    if (transitionRef.current.animationId !== null) {
      cancelAnimationFrame(transitionRef.current.animationId);
      console.log('Cancelled ongoing volume transition');
    }
    
    // Set up the transition parameters
    const duration = 1000; // 1 second transition
    
    // Only use stored startVolume if it's been manually set by event handler,
    // otherwise use current volume
    if (!transitionRef.current.forceStartVolume) {
      transitionRef.current.startVolume = volume;
    }
    
    // Clear the force flag after using it
    transitionRef.current.forceStartVolume = false;
    
    transitionRef.current.targetVolume = targetVol;
    transitionRef.current.startTime = performance.now();
    
    console.log(`Starting volume transition: ${transitionRef.current.startVolume}% → ${targetVol}%`);
    
    // Define the animation step
    const animateVolume = (timestamp: number) => {
      // Calculate elapsed time
      const elapsed = timestamp - transitionRef.current.startTime;
      
      // Calculate progress (0 to 1)
      const progress = Math.min(elapsed / duration, 1);
      
      // Calculate current volume using linear interpolation
      const currentVol = Math.round(
        transitionRef.current.startVolume + 
        (transitionRef.current.targetVolume - transitionRef.current.startVolume) * progress
      );
      
      // Update state
      setVolume(currentVol);
      
      // CRITICAL: Update the actual player volume - this is the key part
      if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
        try {
          // Apply the volume directly to the player
          playerRef.current.setVolume(currentVol);
          
          // Log progress at key points
          if (progress === 0 || progress === 1 || progress % 0.25 < 0.01) {
            console.log(`${title} volume transition ${Math.round(progress * 100)}%: ${currentVol}%`);
          }
        } catch (error) {
          console.log('Error during volume transition:', error);
        }
      } else {
        // Try to find the player in the DOM as a fallback
        const containerId = `youtube-container-${title.toLowerCase().replace(/\s/g, '-')}`;
        const container = document.getElementById(containerId);
        if (container) {
          const iframe = container.querySelector('iframe');
          if (iframe) {
            try {
              // Try direct iframe API access
              const iframeWindow = (iframe as any).contentWindow;
              if (iframeWindow && iframeWindow.postMessage) {
                const message = JSON.stringify({
                  event: 'command',
                  func: 'setVolume',
                  args: [currentVol],
                  id: containerId
                });
                iframeWindow.postMessage(message, '*');
                if (progress === 1) {
                  console.log(`Completed volume transition via iframe API: ${currentVol}%`);
                }
              }
            } catch (e) {
              // Silent catch - we don't want to flood the console
            }
          }
        }
      }
      
      // Continue animation if not complete
      if (progress < 1) {
        transitionRef.current.animationId = requestAnimationFrame(animateVolume);
      } else {
        console.log(`Volume transition complete: now at ${targetVol}%`);
        transitionRef.current.animationId = null;
      }
    };
    
    // Start the animation
    transitionRef.current.animationId = requestAnimationFrame(animateVolume);
  };
  
  // Update player volume when the slider changes
  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      try {
        playerRef.current.setVolume(volume);
      } catch (error) {
        console.log('Error setting volume:', error);
      }
    }
  }, [volume]);
  
  // Handle slider volume change
  const handleVolumeChange = (newVolume: number) => {
    console.log(`Volume slider changed for ${title}: ${newVolume}%`);
    
    // For direct slider changes, update immediately (no transition)
    setVolume(newVolume);
    
    // CRITICAL: Directly set the player volume if available
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      try {
        playerRef.current.setVolume(newVolume);
        console.log(`Directly set ${title} player volume to ${newVolume}%`);
      } catch (error) {
        console.error(`Error setting ${title} player volume:`, error);
      }
    } else {
      console.warn(`${title} player reference not available for volume change`);
      
      // Try to find the player in the DOM as a fallback
      const containerId = `youtube-container-${title.toLowerCase().replace(/\s/g, '-')}`;
      const container = document.getElementById(containerId);
      if (container) {
        const iframe = container.querySelector('iframe');
        if (iframe) {
          console.log(`Found iframe for ${title} player, attempting direct access`);
          try {
            const player = (iframe as any).contentWindow.player;
            if (player && typeof player.setVolume === 'function') {
              player.setVolume(newVolume);
              console.log(`Set ${title} volume via iframe direct access: ${newVolume}%`);
            }
          } catch (e) {
            console.error(`Failed to access ${title} player via iframe:`, e);
          }
        }
      }
    }
    
    // Update parent state
    onVolumeChange(newVolume);
  };
  
  // Handle break volume change
  const handleBreakVolumeChange = (newVolume: number) => {
    onBreakVolumeChange(newVolume);
  };
  
  // Update URL and reinitialize player
  const handleUrlChange = () => {
    // Force player refresh even if URL hasn't changed
    // This helps when a video fails to load initially
    console.log(`Updating ${title} YouTube URL to: ${inputUrl}`);
    
    // Store current player for cleanup
    const oldPlayer = playerRef.current;
    
    // Clean up existing player immediately
    if (oldPlayer) {
      try {
        console.log(`Destroying existing ${title} player before URL update`);
        oldPlayer.destroy();
        playerRef.current = null;
      } catch (error) {
        console.error(`Error destroying ${title} player:`, error);
      }
    }
    
    // Clear the DOM container to ensure fresh rebuild
    const containerId = `youtube-container-${title.toLowerCase().replace(/\s/g, '-')}`;
    const containerElement = document.getElementById(containerId);
    if (containerElement) {
      containerElement.innerHTML = '';
      console.log(`Cleared ${title} container for clean rebuild`);
    }
    
    // Update the URL - use a temporary empty value first to force state change 
    // even if the same URL is entered again
    setUrl('');
    
    // Then set the actual URL after a small delay
    setTimeout(() => {
      setUrl(inputUrl);
      onVideoChange(inputUrl);
      
      // Force player initialization in next render cycle
      setTimeout(() => {
        console.log(`Triggering manual player refresh for ${title}`);
        const newVideoId = extractVideoId(inputUrl);
        if (newVideoId) {
          setVideoId(newVideoId);
          initializePlayer();
        } else {
          console.error(`Failed to extract video ID from ${inputUrl}`);
        }
      }, 100);
    }, 50);
    
    // Close settings panel
    setShowUrlInput(false);
  };
  
  // Reset to default values and force player refresh
  const handleReset = () => {
    console.log(`Resetting ${title} YouTube settings to defaults`);
    
    // Clean up existing player first
    if (playerRef.current) {
      try {
        console.log(`Destroying existing ${title} player for reset`);
        playerRef.current.destroy();
        playerRef.current = null;
      } catch (error) {
        console.error(`Error destroying ${title} player during reset:`, error);
      }
    }
    
    // Clear the DOM container to ensure fresh rebuild
    const containerId = `youtube-container-${title.toLowerCase().replace(/\s/g, '-')}`;
    const containerElement = document.getElementById(containerId);
    if (containerElement) {
      containerElement.innerHTML = '';
      console.log(`Cleared ${title} container for clean rebuild`);
    }
    
    // Reset to default values via parent callback
    if (onReset) {
      onReset();
    }
    
    // Update the input URL field in case it was changed but not applied
    setInputUrl(defaultUrl);
    
    // Clear videoId to force rebuild
    setVideoId(null);
    
    // Force a player refresh after a short delay to ensure defaults are loaded
    setTimeout(() => {
      console.log(`Forcing player refresh after reset for ${title}`);
      
      // Extract videoId from default URL and reinitialize
      const newVideoId = extractVideoId(defaultUrl);
      if (newVideoId) {
        setVideoId(newVideoId);
        setTimeout(() => {
          initializePlayer();
        }, 50);
      } else {
        console.error(`Failed to extract video ID from default URL`);
      }
    }, 100);
    
    // Close settings panel
    setShowUrlInput(false);
  };
  
  // For external Pomodoro timer to control volume
  useEffect(() => {
    const handlePomodoroStateChange = (event: CustomEvent) => {
      // Extract the timer type from the event
      const { timerType } = event.detail;
      
      // Debug logging to verify state change
      console.log(`Pomodoro state changed to: ${timerType}`);
      
      if (timerType === 'focus') {
        // Store current player volume before transitioning
        const currentVol = playerRef.current && 
          typeof playerRef.current.setVolume === 'function' ? 
          playerRef.current.getVolume?.() : volume;
          
        // Force a different start volume to ensure transition happens
        // For Music player when switching to focus mode, use the break volume as starting point
        // For Ambience player when switching to focus mode, use break volume as starting point
        transitionRef.current.startVolume = breakVolume;
        transitionRef.current.forceStartVolume = true;
        
        // Smooth transition to focus volume
        console.log(`Transitioning to focus volume: ${initialVolume}% from ${transitionRef.current.startVolume}%`);
        smoothVolumeTransition(initialVolume);
      } else if (timerType === 'break' || timerType === 'longBreak') {
        // Store current player volume before transitioning
        const currentVol = playerRef.current && 
          typeof playerRef.current.setVolume === 'function' ? 
          playerRef.current.getVolume?.() : volume;
          
        // Force a different start volume to ensure transition happens
        // When switching to break mode, use the focus volume as starting point
        transitionRef.current.startVolume = initialVolume;
        transitionRef.current.forceStartVolume = true;
        
        // Smooth transition to break volume
        console.log(`Transitioning to break volume: ${breakVolume}% from ${transitionRef.current.startVolume}%`);
        smoothVolumeTransition(breakVolume);
      }
    };
    
    window.addEventListener('pomodoroStateChange' as any, handlePomodoroStateChange);
    
    return () => {
      window.removeEventListener('pomodoroStateChange' as any, handlePomodoroStateChange);
    };
  }, [initialVolume, breakVolume]);
  
  return (
    <div className="youtube-embed">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium text-amber-400">{title}</h3>
        <button 
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-gray-400 hover:text-amber-400 transition-colors"
          aria-label="Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
      
      {showUrlInput && (
        <div className="mb-3 bg-gray-700 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-medium text-gray-200">Settings</h4>
            <Button 
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="text-xs flex items-center gap-1 text-amber-400 border-amber-400/30 hover:bg-amber-400/10"
            >
              <RefreshCcw className="h-3 w-3" />
              Reset defaults
            </Button>
          </div>
          
          <div className="mb-4">
            <label className="block text-xs text-gray-400 mb-1">YouTube URL</label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter YouTube URL"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="flex-grow bg-gray-800 border-gray-600 text-gray-200"
              />
              <Button 
                onClick={handleUrlChange}
                className="bg-amber-500 hover:bg-amber-600 text-gray-900"
              >
                Update
              </Button>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Focus Volume</label>
              <Slider
                value={[initialVolume]}
                onValueChange={([newVolume]) => {
                  // Preview the focus volume with a smooth transition
                  smoothVolumeTransition(newVolume);
                  // Update the stored focus volume
                  handleVolumeChange(newVolume);
                }}
                max={100}
                step={1}
                className="cursor-pointer"
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {initialVolume}%
              </div>
            </div>
            
            <div>
              <label className="block text-xs text-gray-400 mb-1">Break Volume</label>
              <Slider
                value={[breakVolume]}
                onValueChange={([newVolume]) => {
                  // Just update the break volume (no transition preview needed)
                  handleBreakVolumeChange(newVolume);
                }}
                max={100}
                step={1}
                className="cursor-pointer"
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {breakVolume}%
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="rounded-md overflow-hidden bg-black mb-3 aspect-video">
        <div id={`youtube-container-${title.toLowerCase().replace(/\s/g, '-')}`} className="w-full h-full" />
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Volume</span>
          <span>{volume}%</span>
        </div>
        <Slider
          value={[volume]}
          onValueChange={([newVolume]) => {
            console.log(`Slider for ${title} changed to ${newVolume}%`);
            
            // Update state
            setVolume(newVolume);
            
            // CRITICAL: Set player volume directly with logging
            if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
              try {
                playerRef.current.setVolume(newVolume);
                console.log(`${title} slider: Set player volume to ${newVolume}%`);
              } catch (error) {
                console.error(`Error setting ${title} player volume:`, error);
              }
            } else {
              console.warn(`${title} player not available for direct volume change via slider`);
              
              // Try to find the player in the DOM as a fallback
              const containerId = `youtube-container-${title.toLowerCase().replace(/\s/g, '-')}`;
              const container = document.getElementById(containerId);
              if (container) {
                const iframe = container.querySelector('iframe');
                if (iframe) {
                  console.log(`Found iframe for ${title} player, attempting direct access from slider`);
                  try {
                    // Try to access the iframe directly
                    const iframeWindow = (iframe as any).contentWindow;
                    if (iframeWindow && iframeWindow.postMessage) {
                      const message = JSON.stringify({
                        event: 'command',
                        func: 'setVolume',
                        args: [newVolume],
                        id: containerId
                      });
                      iframeWindow.postMessage(message, '*');
                      console.log(`Posted volume message to ${title} iframe: ${newVolume}%`);
                    }
                  } catch (e) {
                    console.error(`Failed to access ${title} player via iframe from slider:`, e);
                  }
                }
              }
            }
            
            // Update the work/focus volume in parent component
            onVolumeChange(newVolume);
          }}
          max={100}
          step={1}
          className="cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>During focus: {initialVolume}%</span>
          <span>During break: {breakVolume}%</span>
        </div>
      </div>
    </div>
  );
};

export default YouTubeEmbed;

// Type declaration for YouTube IFrame API
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        config: {
          height: string;
          width: string;
          videoId: string;
          playerVars: {
            autoplay: number;
            controls: number;
            rel: number;
            showinfo: number;
            mute: number;
            loop: number;
            enablejsapi?: number;
            origin?: string;
            playsinline?: number;
          };
          events: {
            onReady: (event: { target: any }) => void;
          };
        }
      ) => {
        destroy: () => void;
        setVolume: (volume: number) => void;
        getDuration: () => number;
        seekTo: (seconds: number, allowSeekAhead: boolean) => void;
        getVideoData: () => { title: string };
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}