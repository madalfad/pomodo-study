import { FC, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useLocalStorage } from "@/lib/useLocalStorage";
import YouTubeEmbed from "./YouTubeEmbed";
import { motion } from "framer-motion";

// Helper function to extract YouTube video ID from URL
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
    
    // Short URL format (youtu.be/VIDEO_ID)
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

// Default settings
const DEFAULT_SETTINGS = {
  musicUrl: "https://youtu.be/jfKfPfyJRdk",
  ambienceUrl: "https://youtu.be/0QKdqm5TX6c",
  musicWorkVolume: 70,
  musicBreakVolume: 30,
  ambienceWorkVolume: 30,
  ambienceBreakVolume: 70,
  musicTitle: "",
  ambienceTitle: ""
};

interface VideoSettings {
  musicUrl: string;
  ambienceUrl: string;
  musicWorkVolume: number;
  musicBreakVolume: number;
  ambienceWorkVolume: number;
  ambienceBreakVolume: number;
  musicTitle?: string;
  ambienceTitle?: string;
}

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

const SoundMixer: FC = () => {
  const [videoSettings, setVideoSettings] = useLocalStorage<VideoSettings>(
    "videoSettings", 
    DEFAULT_SETTINGS
  );
  
  // Create refs to directly access the YouTube player instances
  const musicPlayerRef = useRef<any>(null);
  const ambiencePlayerRef = useRef<any>(null);
  
  // Initialize both music and ambience players on initial load
  useEffect(() => {
    // Initialize music player explicitly - it doesn't initialize automatically like ambience player
    const musicVideoId = extractVideoId(videoSettings.musicUrl);
    if (musicVideoId) {
      console.log("Initializing Music player with video ID:", musicVideoId);
      
      // Make sure container exists
      const musicContainer = document.getElementById('youtube-container-music');
      if (musicContainer) {
        // Clear container first to ensure clean initialization
        musicContainer.innerHTML = '';
        
        // Create player element
        const musicPlayerElement = document.createElement('div');
        musicPlayerElement.id = 'youtube-player-music';
        musicContainer.appendChild(musicPlayerElement);
        
        // Initialize the YouTube player if the API is ready
        if (window.YT && window.YT.Player) {
          console.log("Creating new Music YouTube player instance");
          new window.YT.Player('youtube-player-music', {
            height: '200',
            width: '100%',
            videoId: musicVideoId,
            playerVars: {
              autoplay: 1,
              controls: 1,
              rel: 0,
              showinfo: 0,
              mute: 0,
              loop: 1,
              origin: window.location.origin,
              playsinline: 1
            },
            events: {
              onReady: (event: any) => {
                console.log("Music player ready!");
                // Store player reference for direct volume control
                musicPlayerRef.current = event.target;
                
                // Set initial volume
                musicPlayerRef.current.setVolume(videoSettings.musicWorkVolume);
                console.log(`Set music volume directly to ${videoSettings.musicWorkVolume}%`);
                
                // Get video title and update state
                const videoTitle = musicPlayerRef.current.getVideoData().title;
                if (videoTitle) {
                  updateMusicTitle(videoTitle);
                }
              }
            }
          });
        }
      }
    }
    
    // Auto-refresh both players after a delay to ensure reliable loading
    const autoRefreshTimeout = setTimeout(() => {
      console.log("Auto-refreshing videos on initial load");
      refreshVideos();
    }, 100); // .1 second delay to ensure main players have a chance to initialize
    
    return () => clearTimeout(autoRefreshTimeout);
  }, []);

  // Update music focus volume
  const updateMusicVolume = (volume: number) => {
    // Update state
    setVideoSettings(prev => ({
      ...prev,
      musicWorkVolume: volume
    }));
    
    // Update the actual player volume directly
    const musicPlayer = document.getElementById('youtube-player-music');
    if (musicPlayer && window.YT && window.YT.Player) {
      try {
        // Find the player instance already operating in the DOM
        const players = document.querySelectorAll('iframe[src*="youtube.com"]');
        for (let i = 0; i < players.length; i++) {
          const player = players[i] as HTMLIFrameElement;
          if (player.id.includes('music')) {
            // Get the YouTube player instance from the iframe
            const playerInstance = (player as any).getIFrameApiPlayer?.();
            if (playerInstance && typeof playerInstance.setVolume === 'function') {
              playerInstance.setVolume(volume);
              console.log(`Direct volume change applied to music player: ${volume}%`);
            }
          }
        }
      } catch (e) {
        console.error('Error setting music volume directly:', e);
      }
    }
  };

  // Update music break volume
  const updateMusicBreakVolume = (volume: number) => {
    setVideoSettings(prev => ({
      ...prev,
      musicBreakVolume: volume
    }));
    console.log(`Music break volume updated to ${volume}%`);
  };

  // Update ambience focus volume
  const updateAmbienceVolume = (volume: number) => {
    // Update state
    setVideoSettings(prev => ({
      ...prev,
      ambienceWorkVolume: volume
    }));
    
    // Update the actual player volume directly
    const ambiencePlayer = document.getElementById('youtube-player-ambience');
    if (ambiencePlayer && window.YT && window.YT.Player) {
      try {
        // Find the player instance already operating in the DOM
        const players = document.querySelectorAll('iframe[src*="youtube.com"]');
        for (let i = 0; i < players.length; i++) {
          const player = players[i] as HTMLIFrameElement;
          if (player.id.includes('ambience')) {
            // Get the YouTube player instance from the iframe
            const playerInstance = (player as any).getIFrameApiPlayer?.();
            if (playerInstance && typeof playerInstance.setVolume === 'function') {
              playerInstance.setVolume(volume);
              console.log(`Direct volume change applied to ambience player: ${volume}%`);
            }
          }
        }
      } catch (e) {
        console.error('Error setting ambience volume directly:', e);
      }
    }
  };

  // Update ambience break volume
  const updateAmbienceBreakVolume = (volume: number) => {
    setVideoSettings(prev => ({
      ...prev,
      ambienceBreakVolume: volume
    }));
    console.log(`Ambience break volume updated to ${volume}%`);
  };

  // Update music URL
  const updateMusicUrl = (url: string) => {
    setVideoSettings(prev => ({
      ...prev,
      musicUrl: url
    }));
  };

  // Update ambience URL
  const updateAmbienceUrl = (url: string) => {
    setVideoSettings(prev => ({
      ...prev,
      ambienceUrl: url
    }));
  };
  
  // Update music title
  const updateMusicTitle = (title: string) => {
    setVideoSettings(prev => ({
      ...prev,
      musicTitle: title
    }));
    console.log(`Updated music title: ${title}`);
  };
  
  // Update ambience title
  const updateAmbienceTitle = (title: string) => {
    setVideoSettings(prev => ({
      ...prev,
      ambienceTitle: title
    }));
    console.log(`Updated ambience title: ${title}`);
  };

  // Reset music settings to defaults with force rebuild
  const resetMusicSettings = () => {
    // First clear the music URL to trigger a full rebuild
    setVideoSettings(prev => ({
      ...prev,
      musicUrl: '',
      musicTitle: '' // Clear the title as well
    }));
    
    // Save current ambience settings
    const ambienceSettings = {
      ambienceUrl: videoSettings.ambienceUrl,
      ambienceWorkVolume: videoSettings.ambienceWorkVolume,
      ambienceBreakVolume: videoSettings.ambienceBreakVolume,
      ambienceTitle: videoSettings.ambienceTitle
    };
    
    // Force clear localStorage to ensure defaults are applied
    try {
      localStorage.removeItem('videoSettings');
      console.log("Cleared video settings from localStorage for music reset");
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
    }
    
    // Then apply the actual defaults after a short delay
    setTimeout(() => {
      setVideoSettings({
        musicUrl: DEFAULT_SETTINGS.musicUrl,
        musicWorkVolume: DEFAULT_SETTINGS.musicWorkVolume,
        musicBreakVolume: DEFAULT_SETTINGS.musicBreakVolume,
        musicTitle: DEFAULT_SETTINGS.musicTitle, // Reset title to default (empty)
        // Restore ambience settings
        ...ambienceSettings
      });
      console.log("Music settings reset to defaults");
    }, 100);
  };

  // Reset ambience settings to defaults with force rebuild
  const resetAmbienceSettings = () => {
    // First clear the ambience URL to trigger a full rebuild
    setVideoSettings(prev => ({
      ...prev,
      ambienceUrl: '',
      ambienceTitle: '' // Clear the title as well
    }));
    
    // Save current music settings
    const musicSettings = {
      musicUrl: videoSettings.musicUrl,
      musicWorkVolume: videoSettings.musicWorkVolume,
      musicBreakVolume: videoSettings.musicBreakVolume,
      musicTitle: videoSettings.musicTitle
    };
    
    // Force clear localStorage to ensure defaults are applied
    try {
      localStorage.removeItem('videoSettings');
      console.log("Cleared video settings from localStorage for ambience reset");
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
    }
    
    // Then apply the actual defaults after a short delay
    setTimeout(() => {
      setVideoSettings({
        ambienceUrl: DEFAULT_SETTINGS.ambienceUrl,
        ambienceWorkVolume: DEFAULT_SETTINGS.ambienceWorkVolume,
        ambienceBreakVolume: DEFAULT_SETTINGS.ambienceBreakVolume,
        ambienceTitle: DEFAULT_SETTINGS.ambienceTitle, // Reset title to default (empty)
        // Restore music settings
        ...musicSettings
      });
      console.log("Ambience settings reset to defaults");
    }, 100);
  };

  // Refresh the video players without changing any settings
  const refreshVideos = () => {
    console.log("Refreshing YouTube players with current settings");
    
    // Clean up existing players
    const musicContainer = document.getElementById('youtube-container-music');
    const ambienceContainer = document.getElementById('youtube-container-ambience');
    
    // Clear containers to ensure fresh rebuild
    if (musicContainer) {
      musicContainer.innerHTML = '';
      console.log("Cleared music container for refresh");
    }
    
    if (ambienceContainer) {
      ambienceContainer.innerHTML = '';
      console.log("Cleared ambience container for refresh");
    }
    
    // Short delay to ensure DOM is updated
    setTimeout(() => {
      // Create temporary player elements
      if (musicContainer) {
        const musicPlayerElement = document.createElement('div');
        musicPlayerElement.id = 'youtube-player-music';
        musicContainer.appendChild(musicPlayerElement);
      }
      
      if (ambienceContainer) {
        const ambiencePlayerElement = document.createElement('div');
        ambiencePlayerElement.id = 'youtube-player-ambience';
        ambienceContainer.appendChild(ambiencePlayerElement);
      }
      
      // Extract videoId from current URLs
      const musicVideoId = extractVideoId(videoSettings.musicUrl);
      const ambienceVideoId = extractVideoId(videoSettings.ambienceUrl);
      
      console.log(`Extracted current IDs for refresh - Music: ${musicVideoId}, Ambience: ${ambienceVideoId}`);
      
      // Initialize players if YouTube API is available
      if (window.YT && window.YT.Player) {
        // Initialize music player
        if (musicVideoId && musicContainer) {
          console.log("Refreshing music player with current settings");
          new window.YT.Player('youtube-player-music', {
            height: '200',
            width: '100%',
            videoId: musicVideoId,
            playerVars: {
              autoplay: 1,
              controls: 1,
              rel: 0,
              showinfo: 0,
              mute: 0,
              loop: 1,
              origin: window.location.origin,
              playsinline: 1
            },
            events: {
              onReady: (event: any) => {
                console.log("Music player refreshed and ready");
                
                // Set volume directly using the API
                const volume = videoSettings.musicWorkVolume;
                event.target.setVolume(volume);
                console.log(`Applied refresh music volume: ${volume}%`);
                
                // Get video title and update state
                const videoTitle = event.target.getVideoData().title;
                if (videoTitle) {
                  updateMusicTitle(videoTitle);
                }
              }
            }
          });
        }
        
        // Initialize ambience player
        if (ambienceVideoId && ambienceContainer) {
          console.log("Refreshing ambience player with current settings");
          new window.YT.Player('youtube-player-ambience', {
            height: '200',
            width: '100%',
            videoId: ambienceVideoId,
            playerVars: {
              autoplay: 1,
              controls: 1,
              rel: 0,
              showinfo: 0,
              mute: 0,
              loop: 1,
              origin: window.location.origin,
              playsinline: 1
            },
            events: {
              onReady: (event: any) => {
                console.log("Ambience player refreshed and ready");
                
                // Set volume directly using the API
                const volume = videoSettings.ambienceWorkVolume;
                event.target.setVolume(volume);
                console.log(`Applied refresh ambience volume: ${volume}%`);
                
                // Get video title and update state
                const videoTitle = event.target.getVideoData().title;
                if (videoTitle) {
                  updateAmbienceTitle(videoTitle);
                }
              }
            }
          });
        }
      } else {
        console.log("YouTube API not available, players cannot be refreshed");
      }
    }, 100);
  };
  
  // Reset all settings and force player rebuilds
  const resetAllSettings = () => {
    console.log("Performing complete reset of all sound mixer settings");
    
    // First clear URL values to trigger full rebuild
    setVideoSettings(prev => ({
      ...prev,
      musicUrl: '',
      ambienceUrl: '',
      musicTitle: '',
      ambienceTitle: ''
    }));
    
    // Force clear localStorage to ensure defaults are applied
    try {
      localStorage.removeItem('videoSettings');
      console.log("Cleared video settings from localStorage");
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
    }
    
    // Clean up existing players
    const musicContainer = document.getElementById('youtube-container-music');
    const ambienceContainer = document.getElementById('youtube-container-ambience');
    
    // Clear containers to ensure fresh rebuild
    if (musicContainer) {
      musicContainer.innerHTML = '';
      console.log("Cleared music container for clean rebuild");
    }
    
    if (ambienceContainer) {
      ambienceContainer.innerHTML = '';
      console.log("Cleared ambience container for clean rebuild");
    }
    
    // Then after a short delay, apply the actual defaults 
    setTimeout(() => {
      setVideoSettings(DEFAULT_SETTINGS);
      console.log("All settings reset to defaults with new YouTube URLs");
      
      // Force player initialization in next render cycle
      setTimeout(() => {
        console.log("Triggering manual YouTube players rebuild after reset");
        
        // Create temporary player elements
        if (musicContainer) {
          const musicPlayerElement = document.createElement('div');
          musicPlayerElement.id = 'youtube-player-music';
          musicContainer.appendChild(musicPlayerElement);
        }
        
        if (ambienceContainer) {
          const ambiencePlayerElement = document.createElement('div');
          ambiencePlayerElement.id = 'youtube-player-ambience';
          ambienceContainer.appendChild(ambiencePlayerElement);
        }
        
        // Extract videoId from default URLs
        const musicVideoId = extractVideoId(DEFAULT_SETTINGS.musicUrl);
        const ambienceVideoId = extractVideoId(DEFAULT_SETTINGS.ambienceUrl);
        
        console.log(`Extracted IDs for rebuild - Music: ${musicVideoId}, Ambience: ${ambienceVideoId}`);
        
        // Initialize players if YouTube API is available
        if (window.YT && window.YT.Player) {
          // Initialize music player
          if (musicVideoId && musicContainer) {
            console.log("Rebuilding music player with default settings");
            new window.YT.Player('youtube-player-music', {
              height: '200',
              width: '100%',
              videoId: musicVideoId,
              playerVars: {
                autoplay: 1,
                controls: 1,
                rel: 0,
                showinfo: 0,
                mute: 0,
                loop: 1,
                origin: window.location.origin,
                playsinline: 1
              },
              events: {
                onReady: (event: any) => {
                  console.log("Music player rebuilt and ready");
                  
                  // Set volume directly using the API
                  const volume = DEFAULT_SETTINGS.musicWorkVolume;
                  event.target.setVolume(volume);
                  console.log(`Applied rebuild music volume: ${volume}%`);
                  
                  // Get video title and update state
                  const videoTitle = event.target.getVideoData().title;
                  if (videoTitle) {
                    updateMusicTitle(videoTitle);
                  }
                }
              }
            });
          }
          
          // Initialize ambience player
          if (ambienceVideoId && ambienceContainer) {
            console.log("Rebuilding ambience player with default settings");
            new window.YT.Player('youtube-player-ambience', {
              height: '200',
              width: '100%',
              videoId: ambienceVideoId,
              playerVars: {
                autoplay: 1,
                controls: 1,
                rel: 0,
                showinfo: 0,
                mute: 0,
                loop: 1,
                origin: window.location.origin,
                playsinline: 1
              },
              events: {
                onReady: (event: any) => {
                  console.log("Ambience player rebuilt and ready");
                  
                  // Set volume directly using the API
                  const volume = DEFAULT_SETTINGS.ambienceWorkVolume;
                  event.target.setVolume(volume);
                  console.log(`Applied rebuild ambience volume: ${volume}%`);
                  
                  // Get video title and update state
                  const videoTitle = event.target.getVideoData().title;
                  if (videoTitle) {
                    updateAmbienceTitle(videoTitle);
                  }
                }
              }
            });
          }
        } else {
          console.log("YouTube API not available, players will rebuild on their own");
        }
      }, 100);
    }, 100);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="shadow-lg bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <h2 className="text-xl font-poppins font-semibold mb-5 text-amber-400 flex items-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="mr-2 h-5 w-5" 
              fill="currentColor" 
              viewBox="0 0 512 512"
            >
              <g>
                <rect x="424" y="24" width="48" height="52"/>
                <rect x="424" y="188" width="48" height="300"/>
                <path d="M484.79,100h-73.578C396.188,100,384,112.188,384,127.211v9.578c0,15.023,12.188,27.21,27.211,27.21h73.578
                  c15.023,0,27.21-12.187,27.21-27.21v-9.578C512,112.188,499.813,100,484.79,100z"/>
                <rect x="231.985" y="24" width="48" height="276.641"/>
                <rect x="231.985" y="412.641" width="48" height="75.359"/>
                <path d="M292.774,324.641h-73.578c-15.023,0-27.21,12.187-27.21,27.211v9.578c0,15.024,12.187,27.211,27.21,27.211
                  h73.578c15.023,0,27.211-12.187,27.211-27.211v-9.578C319.985,336.828,307.797,324.641,292.774,324.641z"/>
                <rect x="40" y="308" width="48" height="180"/>
                <rect x="40" y="24" width="48" height="172"/>
                <path d="M100.79,220H27.211C12.188,220,0,232.188,0,247.211v9.578C0,271.813,12.188,284,27.211,284h73.578
                  c15.023,0,27.21-12.187,27.21-27.21v-9.578C128,232.188,115.813,220,100.79,220z"/>
              </g>
            </svg>
            Sound Mixer
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <YouTubeEmbed 
                defaultUrl={videoSettings.musicUrl}
                title="Music"
                onVolumeChange={updateMusicVolume}
                onBreakVolumeChange={updateMusicBreakVolume}
                initialVolume={videoSettings.musicWorkVolume}
                breakVolume={videoSettings.musicBreakVolume}
                onVideoChange={updateMusicUrl}
                onReset={resetMusicSettings}
                onTitleChange={updateMusicTitle}
              />
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <YouTubeEmbed 
                defaultUrl={videoSettings.ambienceUrl}
                title="Ambience"
                onVolumeChange={updateAmbienceVolume}
                onBreakVolumeChange={updateAmbienceBreakVolume}
                initialVolume={videoSettings.ambienceWorkVolume}
                breakVolume={videoSettings.ambienceBreakVolume}
                onVideoChange={updateAmbienceUrl}
                onReset={resetAmbienceSettings}
                onTitleChange={updateAmbienceTitle}
              />
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400 mb-3">
              The YouTube embeds will automatically adjust volume when your Pomodoro timer switches between focus and break.
            </p>
            
            <div className="flex flex-col items-center gap-2">
              <button 
                onClick={refreshVideos}
                className="inline-flex items-center text-xs text-amber-400 hover:text-amber-500 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Videos
              </button>
              <div className="text-xs text-gray-500 max-w-md">
                Music: {videoSettings.musicTitle || "Loading video title..."}<br/>
                Ambience: {videoSettings.ambienceTitle || "Loading video title..."}
              </div>
              <button 
                onClick={resetAllSettings}
                className="inline-flex items-center text-xs text-amber-400 hover:text-amber-500 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset All to Defaults
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SoundMixer;
