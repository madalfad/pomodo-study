import { FC } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useLocalStorage } from "@/lib/useLocalStorage";
import YouTubeEmbed from "./YouTubeEmbed";
import { motion } from "framer-motion";

// Default settings
const DEFAULT_SETTINGS = {
  musicUrl: "https://youtu.be/jfKfPfyJRdk",
  ambienceUrl: "https://youtu.be/0QKdqm5TX6c",
  musicWorkVolume: 70,
  musicBreakVolume: 30,
  ambienceWorkVolume: 30,
  ambienceBreakVolume: 70
};

interface VideoSettings {
  musicUrl: string;
  ambienceUrl: string;
  musicWorkVolume: number;
  musicBreakVolume: number;
  ambienceWorkVolume: number;
  ambienceBreakVolume: number;
}

const SoundMixer: FC = () => {
  const [videoSettings, setVideoSettings] = useLocalStorage<VideoSettings>(
    "videoSettings", 
    DEFAULT_SETTINGS
  );

  // Update music focus volume
  const updateMusicVolume = (volume: number) => {
    setVideoSettings(prev => ({
      ...prev,
      musicWorkVolume: volume
    }));
  };

  // Update music break volume
  const updateMusicBreakVolume = (volume: number) => {
    setVideoSettings(prev => ({
      ...prev,
      musicBreakVolume: volume
    }));
  };

  // Update ambience focus volume
  const updateAmbienceVolume = (volume: number) => {
    setVideoSettings(prev => ({
      ...prev,
      ambienceWorkVolume: volume
    }));
  };

  // Update ambience break volume
  const updateAmbienceBreakVolume = (volume: number) => {
    setVideoSettings(prev => ({
      ...prev,
      ambienceBreakVolume: volume
    }));
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

  // Reset music settings to defaults with force rebuild
  const resetMusicSettings = () => {
    // First clear the music URL to trigger a full rebuild
    setVideoSettings(prev => ({
      ...prev,
      musicUrl: ''
    }));
    
    // Then apply the actual defaults after a short delay
    setTimeout(() => {
      setVideoSettings(prev => ({
        ...prev,
        musicUrl: DEFAULT_SETTINGS.musicUrl,
        musicWorkVolume: DEFAULT_SETTINGS.musicWorkVolume,
        musicBreakVolume: DEFAULT_SETTINGS.musicBreakVolume
      }));
      console.log("Music settings reset to defaults");
    }, 100);
  };

  // Reset ambience settings to defaults with force rebuild
  const resetAmbienceSettings = () => {
    // First clear the ambience URL to trigger a full rebuild
    setVideoSettings(prev => ({
      ...prev,
      ambienceUrl: ''
    }));
    
    // Then apply the actual defaults after a short delay
    setTimeout(() => {
      setVideoSettings(prev => ({
        ...prev,
        ambienceUrl: DEFAULT_SETTINGS.ambienceUrl,
        ambienceWorkVolume: DEFAULT_SETTINGS.ambienceWorkVolume,
        ambienceBreakVolume: DEFAULT_SETTINGS.ambienceBreakVolume
      }));
      console.log("Ambience settings reset to defaults");
    }, 100);
  };

  // Reset all settings and force player rebuilds
  const resetAllSettings = () => {
    // First clear the URL values to trigger a full rebuild
    setVideoSettings(prev => ({
      ...prev,
      musicUrl: '',
      ambienceUrl: ''
    }));
    
    // Then after a short delay, apply the actual defaults 
    setTimeout(() => {
      setVideoSettings(DEFAULT_SETTINGS);
      console.log("All settings reset to defaults with new YouTube URLs");
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
            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 11l7-7 7 7M5 19l7-7 7 7" />
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
              />
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400 mb-3">
              The YouTube embeds will automatically adjust volume when your Pomodoro timer switches between focus and break.
            </p>
            
            <button 
              onClick={resetAllSettings}
              className="inline-flex items-center text-xs text-amber-400 hover:text-amber-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset All to YouTube Defaults
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SoundMixer;
