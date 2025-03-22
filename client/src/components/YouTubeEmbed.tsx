import { FC, useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

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
  const playerRef = useRef<any>(null);
  
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
        playerRef.current.setVolume(volume);
      } catch (error) {
        console.log('Error setting volume:', error);
      }
    }
    
    onVolumeChange(volume);
  }, [volume, onVolumeChange]);
  
  // Update URL and reinitialize player
  const handleUrlChange = () => {
    if (inputUrl !== url) {
      setUrl(inputUrl);
      onVideoChange(inputUrl);
      setShowUrlInput(false);
    }
  };
  
  // For external Pomodoro timer to control volume
  useEffect(() => {
    const handlePomodoroStateChange = (event: CustomEvent) => {
      if (event.detail.timerType === 'focus') {
        setVolume(initialVolume);
        if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
          try {
            playerRef.current.setVolume(initialVolume);
          } catch (error) {
            console.log('Error setting volume in pomodoro state change:', error);
          }
        }
      } else {
        setVolume(breakVolume);
        if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
          try {
            playerRef.current.setVolume(breakVolume);
          } catch (error) {
            console.log('Error setting volume in pomodoro state change:', error);
          }
        }
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
          className="text-sm text-gray-400 hover:text-amber-400 transition-colors"
        >
          Change
        </button>
      </div>
      
      {showUrlInput && (
        <div className="mb-3 flex gap-2">
          <Input
            type="text"
            placeholder="Enter YouTube URL"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="flex-grow bg-gray-700 border-gray-600 text-gray-200"
          />
          <Button 
            onClick={handleUrlChange}
            className="bg-amber-500 hover:bg-amber-600 text-gray-900"
          >
            Update
          </Button>
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
          onValueChange={([newVolume]) => setVolume(newVolume)}
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