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
}

const YouTubeEmbed: FC<YouTubeEmbedProps> = ({ 
  defaultUrl, 
  title, 
  onVolumeChange, 
  onBreakVolumeChange,
  initialVolume,
  breakVolume,
  onVideoChange,
  onReset
}) => {
  const [url, setUrl] = useState(defaultUrl);
  const [inputUrl, setInputUrl] = useState(defaultUrl);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [volume, setVolume] = useState(initialVolume);
  const [videoId, setVideoId] = useState<string | null>(null);
  const playerRef = useRef<any>(null);
  const transitionRef = useRef<{ animationId: number | null, startVolume: number, targetVolume: number, startTime: number }>({
    animationId: null,
    startVolume: initialVolume,
    targetVolume: initialVolume,
    startTime: 0
  });
  
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
  
  // Make sure volume state syncs with props
  useEffect(() => {
    setVolume(initialVolume);
  }, [initialVolume]);
  
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
  
  // Function to smoothly transition volume
  const smoothVolumeTransition = (targetVol: number) => {
    // Cancel any ongoing transition
    if (transitionRef.current.animationId !== null) {
      cancelAnimationFrame(transitionRef.current.animationId);
    }
    
    // Set up the transition parameters
    const duration = 1000; // 1 second transition
    transitionRef.current.startVolume = volume;
    transitionRef.current.targetVolume = targetVol;
    transitionRef.current.startTime = performance.now();
    
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
      
      // Set the volume
      setVolume(currentVol);
      if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
        try {
          playerRef.current.setVolume(currentVol);
        } catch (error) {
          console.log('Error during volume transition:', error);
        }
      }
      
      // Continue animation if not complete
      if (progress < 1) {
        transitionRef.current.animationId = requestAnimationFrame(animateVolume);
      } else {
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
    // For direct slider changes, update immediately (no transition)
    setVolume(newVolume);
    onVolumeChange(newVolume);
  };
  
  // Handle break volume change
  const handleBreakVolumeChange = (newVolume: number) => {
    onBreakVolumeChange(newVolume);
  };
  
  // Update URL and reinitialize player
  const handleUrlChange = () => {
    if (inputUrl !== url) {
      setUrl(inputUrl);
      onVideoChange(inputUrl);
      setShowUrlInput(false);
    }
  };
  
  // Reset to default values
  const handleReset = () => {
    if (onReset) {
      onReset();
    }
    setShowUrlInput(false);
  };
  
  // For external Pomodoro timer to control volume
  useEffect(() => {
    const handlePomodoroStateChange = (event: CustomEvent) => {
      if (event.detail.timerType === 'focus') {
        // Smooth transition to focus volume
        smoothVolumeTransition(initialVolume);
      } else {
        // Smooth transition to break volume
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
            // Apply smooth transition for main volume slider too
            smoothVolumeTransition(newVolume);
            // Also update the work/focus volume setting
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