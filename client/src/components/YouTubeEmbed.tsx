import { FC, useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { fadeVolume } from '@/lib/volumeFader';

interface YouTubeEmbedProps {
  defaultUrl: string;
  title: string;
  onVolumeChange: (volume: number) => void;
  initialVolume: number;
  breakVolume: number;
  onVideoChange: (url: string) => void;
}

const YouTubeEmbed: FC<YouTubeEmbedProps> = ({ 
  defaultUrl, 
  title, 
  onVolumeChange, 
  initialVolume,
  breakVolume,
  onVideoChange
}) => {
  const [url, setUrl] = useState(defaultUrl);
  const [inputUrl, setInputUrl] = useState(defaultUrl);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [volume, setVolume] = useState(initialVolume);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [timerType, setTimerType] = useState<'focus' | 'break' | 'longBreak'>('focus');
  const playerRef = useRef<any>(null);
  const fadeControlRef = useRef<{ cancel: () => void } | null>(null);
  
  // Extract YouTube video ID from URL
  useEffect(() => {
    const extractVideoId = (url: string): string | null => {
      // Handle different YouTube URL formats
      const regExp = /^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      
      if (match && match[2].length === 11) {
        return match[2];
      }
      
      // Handle YouTube live URLs
      const liveRegExp = /^.*(youtu.be\/|live\/)([^#\&\?]*).*/;
      const liveMatch = url.match(liveRegExp);
      
      if (liveMatch && liveMatch[2]) {
        return liveMatch[2];
      }
      
      return null;
    };
    
    const id = extractVideoId(url);
    setVideoId(id);
  }, [url]);
  
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
    };
  }, [videoId]);
  
  // Initialize the YouTube player
  const initializePlayer = () => {
    if (!videoId) return;
    
    // If a player already exists, destroy it
    if (playerRef.current) {
      playerRef.current.destroy();
    }
    
    const playerId = `youtube-player-${title.toLowerCase().replace(/\s/g, '-')}`;
    
    // Create container if it doesn't exist
    let playerContainer = document.getElementById(playerId);
    if (!playerContainer) {
      playerContainer = document.createElement('div');
      playerContainer.id = playerId;
      document.getElementById(`youtube-container-${title.toLowerCase().replace(/\s/g, '-')}`)?.appendChild(playerContainer);
    }
    
    // Create new player
    playerRef.current = new window.YT.Player(playerId, {
      height: '200',
      width: '100%',
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        controls: 1,
        rel: 0,
        showinfo: 0,
        mute: 0,
        loop: 1
      },
      events: {
        onReady: (event) => {
          event.target.setVolume(volume);
          // If it's a live stream, seek to the end
          if (url.includes('live')) {
            event.target.seekTo(event.target.getDuration(), true);
          }
        }
      }
    });
  };
  
  // Update player volume when the slider changes
  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      try {
        // Apply volume to YouTube player with a small delay
        // This helps with YouTube's API rate limiting
        const applyVolume = () => {
          if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
            try {
              console.log(`Setting ${title} player volume: ${volume}`);
              playerRef.current.setVolume(volume);
              
              // Double-check if volume was set correctly after a small delay
              setTimeout(() => {
                if (playerRef.current && typeof playerRef.current.getVolume === 'function') {
                  const actualVolume = playerRef.current.getVolume();
                  if (Math.abs(actualVolume - volume) > 3) {
                    console.log(`Volume mismatch detected for ${title}. Expected: ${volume}, Actual: ${actualVolume}. Retrying...`);
                    playerRef.current.setVolume(volume);
                  }
                }
              }, 50);
            } catch (error) {
              console.error('Error setting volume:', error);
            }
          }
        };
        
        applyVolume();
      } catch (error) {
        console.error('Error setting volume:', error);
      }
    }
    
    onVolumeChange(volume);
  }, [volume, onVolumeChange, title]);
  
  // Update URL and reinitialize player
  const handleUrlChange = () => {
    if (inputUrl !== url) {
      setUrl(inputUrl);
      onVideoChange(inputUrl);
      setShowUrlInput(false);
    }
  };
  
  // Toggle between focus and break volume manually with fade transition
  const toggleVolumeMode = () => {
    // Cancel any ongoing fade
    if (fadeControlRef.current) {
      fadeControlRef.current.cancel();
      fadeControlRef.current = null;
    }
    
    // Get current volume directly from player if possible
    let currentVol = volume;
    try {
      if (playerRef.current && typeof playerRef.current.getVolume === 'function') {
        const playerVolume = playerRef.current.getVolume();
        console.log(`${title} player reports current volume: ${playerVolume}`);
        // Only update if there's a significant difference to avoid confusion
        if (Math.abs(playerVolume - currentVol) > 2) {
          currentVol = playerVolume;
        }
      }
    } catch (error) {
      console.error('Error getting player volume:', error);
    }
    
    const newTimerType = timerType === 'focus' ? 'break' : 'focus';
    const targetVol = newTimerType === 'focus' ? initialVolume : breakVolume;
    
    console.log(`Manually toggling ${title} volume mode: ${timerType} -> ${newTimerType} (${currentVol} -> ${targetVol})`);
    
    // Update state first
    setTimerType(newTimerType);
    
    // Always perform the fade, even for small differences
    fadeControlRef.current = fadeVolume(
      playerRef.current,
      currentVol,
      targetVol,
      1000, // 1 second transition
      (newVolume) => {
        setVolume(newVolume);
      }
    );
  };
  
  // For external Pomodoro timer to control volume with smooth transition
  useEffect(() => {
    const handlePomodoroStateChange = (event: CustomEvent) => {
      // Cancel any ongoing fade
      if (fadeControlRef.current) {
        fadeControlRef.current.cancel();
        fadeControlRef.current = null;
      }
      
      const newTimerType = event.detail.timerType;
      const fromTimerType = event.detail.fromTimerType || timerType;
      
      // Skip if we're changing to the same timer type
      if (newTimerType === timerType && newTimerType === fromTimerType) {
        console.log(`${title} player: Skipping transition - already in ${newTimerType} mode`);
        return;
      }
      
      // Get current volume directly from player if possible
      let currentVolume = volume;
      try {
        if (playerRef.current && typeof playerRef.current.getVolume === 'function') {
          const playerVolume = playerRef.current.getVolume();
          console.log(`${title} player reports current volume (pomodoroStateChange): ${playerVolume}`);
          // Only update if there's a significant difference
          if (Math.abs(playerVolume - currentVolume) > 2) {
            currentVolume = playerVolume;
          }
        }
      } catch (error) {
        console.error('Error getting player volume:', error);
      }
      
      // Update timer type locally
      setTimerType(newTimerType);
      
      // Determine target volume based on new timer type
      const targetVolume = newTimerType === 'focus' ? initialVolume : breakVolume;
      
      console.log(`${title} player: Timer type changed to ${newTimerType}. Volume transition: ${currentVolume} -> ${targetVolume}`);
      
      // Always perform the fade for the pomodoro timer transitions
      fadeControlRef.current = fadeVolume(
        playerRef.current,
        currentVolume,
        targetVolume,
        1000,  // 1 second transition
        (newVolume) => {
          // Update the React state as the volume changes
          setVolume(newVolume);
        }
      );
    };
    
    window.addEventListener('pomodoroStateChange' as any, handlePomodoroStateChange);
    
    return () => {
      // Clean up event listener and any ongoing fade
      window.removeEventListener('pomodoroStateChange' as any, handlePomodoroStateChange);
      if (fadeControlRef.current) {
        fadeControlRef.current.cancel();
      }
    };
  }, [initialVolume, breakVolume, volume, title]);
  
  return (
    <div className="youtube-embed">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium text-amber-400">{title}</h3>
        <div className="flex items-center gap-2">
          <Button
            onClick={toggleVolumeMode}
            size="sm"
            variant="outline"
            className="h-8 px-2 text-xs bg-transparent border border-gray-600 hover:bg-gray-700"
          >
            <span className="mr-1">Mode:</span>
            <span className={timerType === 'focus' ? 'text-green-400' : 'text-amber-400'}>
              {timerType === 'focus' ? 'Focus' : 'Break'}
            </span>
          </Button>
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
      </div>
      
      {showUrlInput && (
        <div className="mb-3 bg-gray-700 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-200 mb-3">Settings</h4>
          
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
                  // Update work volume in parent component
                  onVolumeChange(newVolume);
                  // If we're currently in focus mode, also update the visible volume
                  if (timerType === 'focus' && playerRef.current) {
                    setVolume(newVolume);
                    playerRef.current.setVolume(newVolume);
                  }
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
                  // Dispatch event for parent component to update break volume
                  const event = new CustomEvent('breakVolumeChange', {
                    detail: { type: title.toLowerCase(), volume: newVolume }
                  });
                  window.dispatchEvent(event);
                  
                  // If we're currently in break mode, also update the visible volume
                  if (timerType !== 'focus' && playerRef.current) {
                    setVolume(newVolume);
                    playerRef.current.setVolume(newVolume);
                  }
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
            setVolume(newVolume);
            if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
              try {
                playerRef.current.setVolume(newVolume);
              } catch (error) {
                console.log('Error setting volume:', error);
              }
            }
            
            // Update the appropriate volume based on current timer mode
            if (timerType === 'focus') {
              onVolumeChange(newVolume); // Update focus/work volume
            } else {
              // Update break volume through the event system
              const event = new CustomEvent('breakVolumeChange', {
                detail: { type: title.toLowerCase(), volume: newVolume }
              });
              window.dispatchEvent(event);
            }
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
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}