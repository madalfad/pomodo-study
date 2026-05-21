import { FC, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useLocalStorage } from "@/lib/useLocalStorage";
import YouTubeEmbed from "./YouTubeEmbed";
import { motion } from "framer-motion";
import {
  MUSIC_PRESETS,
  AMBIENCE_PRESETS,
  DEFAULT_MUSIC_URL,
  DEFAULT_AMBIENCE_URL,
} from "@/lib/videoPresets";

// Default settings - to change the default videos, edit `src/lib/videoPresets.ts`.
const DEFAULT_SETTINGS: VideoSettings = {
  musicUrl: DEFAULT_MUSIC_URL,
  ambienceUrl: DEFAULT_AMBIENCE_URL,
  musicWorkVolume: 70,
  musicBreakVolume: 30,
  ambienceWorkVolume: 30,
  ambienceBreakVolume: 70,
  musicTitle: "",
  ambienceTitle: "",
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

const SoundMixer: FC = () => {
  const [videoSettings, setVideoSettings] = useLocalStorage<VideoSettings>(
    "videoSettings",
    DEFAULT_SETTINGS,
  );

  // Bumping these forces the corresponding YouTubeEmbed to fully unmount and
  // remount, which destroys & re-creates its underlying YT.Player. This is how
  // the "Refresh Videos" and "Reset" buttons cause a clean rebuild — much more
  // reliable than imperatively poking the DOM.
  const [musicKey, setMusicKey] = useState(0);
  const [ambienceKey, setAmbienceKey] = useState(0);

  // ----- Settings updaters (state + localStorage only; the YouTubeEmbed
  // component owns its player and reacts to prop changes). ---------------

  const updateMusicVolume = (volume: number) =>
    setVideoSettings((prev) => ({ ...prev, musicWorkVolume: volume }));

  const updateMusicBreakVolume = (volume: number) =>
    setVideoSettings((prev) => ({ ...prev, musicBreakVolume: volume }));

  const updateAmbienceVolume = (volume: number) =>
    setVideoSettings((prev) => ({ ...prev, ambienceWorkVolume: volume }));

  const updateAmbienceBreakVolume = (volume: number) =>
    setVideoSettings((prev) => ({ ...prev, ambienceBreakVolume: volume }));

  const updateMusicUrl = (url: string) =>
    setVideoSettings((prev) => ({ ...prev, musicUrl: url }));

  const updateAmbienceUrl = (url: string) =>
    setVideoSettings((prev) => ({ ...prev, ambienceUrl: url }));

  const updateMusicTitle = (title: string) =>
    setVideoSettings((prev) => ({ ...prev, musicTitle: title }));

  const updateAmbienceTitle = (title: string) =>
    setVideoSettings((prev) => ({ ...prev, ambienceTitle: title }));

  // ----- Reset / refresh ------------------------------------------------

  const resetMusicSettings = () => {
    setVideoSettings((prev) => ({
      ...prev,
      musicUrl: DEFAULT_SETTINGS.musicUrl,
      musicWorkVolume: DEFAULT_SETTINGS.musicWorkVolume,
      musicBreakVolume: DEFAULT_SETTINGS.musicBreakVolume,
      musicTitle: DEFAULT_SETTINGS.musicTitle,
    }));
    setMusicKey((k) => k + 1);
  };

  const resetAmbienceSettings = () => {
    setVideoSettings((prev) => ({
      ...prev,
      ambienceUrl: DEFAULT_SETTINGS.ambienceUrl,
      ambienceWorkVolume: DEFAULT_SETTINGS.ambienceWorkVolume,
      ambienceBreakVolume: DEFAULT_SETTINGS.ambienceBreakVolume,
      ambienceTitle: DEFAULT_SETTINGS.ambienceTitle,
    }));
    setAmbienceKey((k) => k + 1);
  };

  const refreshVideos = () => {
    setMusicKey((k) => k + 1);
    setAmbienceKey((k) => k + 1);
  };

  const resetAllSettings = () => {
    setVideoSettings({ ...DEFAULT_SETTINGS });
    setMusicKey((k) => k + 1);
    setAmbienceKey((k) => k + 1);
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
                <rect x="424" y="24" width="48" height="52" />
                <rect x="424" y="188" width="48" height="300" />
                <path
                  d="M484.79,100h-73.578C396.188,100,384,112.188,384,127.211v9.578c0,15.023,12.188,27.21,27.211,27.21h73.578
                  c15.023,0,27.21-12.187,27.21-27.21v-9.578C512,112.188,499.813,100,484.79,100z"
                />
                <rect x="231.985" y="24" width="48" height="276.641" />
                <rect x="231.985" y="412.641" width="48" height="75.359" />
                <path
                  d="M292.774,324.641h-73.578c-15.023,0-27.21,12.187-27.21,27.211v9.578c0,15.024,12.187,27.211,27.21,27.211
                  h73.578c15.023,0,27.211-12.187,27.211-27.211v-9.578C319.985,336.828,307.797,324.641,292.774,324.641z"
                />
                <rect x="40" y="308" width="48" height="180" />
                <rect x="40" y="24" width="48" height="172" />
                <path
                  d="M100.79,220H27.211C12.188,220,0,232.188,0,247.211v9.578C0,271.813,12.188,284,27.211,284h73.578
                  c15.023,0,27.21-12.187,27.21-27.21v-9.578C128,232.188,115.813,220,100.79,220z"
                />
              </g>
            </svg>
            Sound Mixer
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <YouTubeEmbed
                key={`music-${musicKey}`}
                defaultUrl={videoSettings.musicUrl}
                title="Music"
                presets={MUSIC_PRESETS}
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
                key={`ambience-${ambienceKey}`}
                defaultUrl={videoSettings.ambienceUrl}
                title="Ambience"
                presets={AMBIENCE_PRESETS}
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
              The YouTube embeds will automatically adjust volume when your
              Pomodoro timer switches between focus and break.
            </p>

            <div className="flex flex-col items-center gap-2">
              <button
                onClick={refreshVideos}
                className="inline-flex items-center text-xs text-amber-400 hover:text-amber-500 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh Videos
              </button>
              <div className="text-xs text-gray-500 max-w-md">
                Music: {videoSettings.musicTitle || "Loading video title..."}
                <br />
                Ambience:{" "}
                {videoSettings.ambienceTitle || "Loading video title..."}
              </div>
              <button
                onClick={resetAllSettings}
                className="inline-flex items-center text-xs text-amber-400 hover:text-amber-500 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
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
