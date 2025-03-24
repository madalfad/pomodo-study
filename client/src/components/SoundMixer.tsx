import { FC } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useLocalStorage } from "@/lib/useLocalStorage";
import YouTubeEmbed from "./YouTubeEmbed";
import { motion } from "framer-motion";

// Default settings
const DEFAULT_SETTINGS = {
  musicUrl: "https://www.youtube.com/live/jfKfPfyJRdk?si=F4yVteKhSOk7OPJ8",
  ambienceUrl: "https://www.youtube.com/watch?v=uiMXGIG_DQo&ab_channel=WinterWhale",
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

  // Reset music settings to defaults
  const resetMusicSettings = () => {
    setVideoSettings(prev => ({
      ...prev,
      musicUrl: DEFAULT_SETTINGS.musicUrl,
      musicWorkVolume: DEFAULT_SETTINGS.musicWorkVolume,
      musicBreakVolume: DEFAULT_SETTINGS.musicBreakVolume
    }));
  };

  // Reset ambience settings to defaults
  const resetAmbienceSettings = () => {
    setVideoSettings(prev => ({
      ...prev,
      ambienceUrl: DEFAULT_SETTINGS.ambienceUrl,
      ambienceWorkVolume: DEFAULT_SETTINGS.ambienceWorkVolume,
      ambienceBreakVolume: DEFAULT_SETTINGS.ambienceBreakVolume
    }));
  };

  // Reset all settings
  const resetAllSettings = () => {
    setVideoSettings(DEFAULT_SETTINGS);
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
          
          <div className="mt-6 text-center text-sm text-gray-400">
            <p>The YouTube embeds will automatically adjust volume when your Pomodoro timer switches between focus and break.</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SoundMixer;
