import { FC, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { audioTracks } from "../assets/sounds";
import { playSound, pauseSound, setVolume } from "../lib/soundManager";

interface SoundTrack {
  id: string;
  name: string;
  isPlaying: boolean;
  volume: number;
}

const SoundMixer: FC = () => {
  const [sounds, setSounds] = useState<SoundTrack[]>(() => {
    const savedSounds = localStorage.getItem("ambientSounds");
    if (savedSounds) {
      return JSON.parse(savedSounds);
    }
    return audioTracks.map(track => ({
      id: track.id,
      name: track.name,
      isPlaying: false,
      volume: 50
    }));
  });

  useEffect(() => {
    localStorage.setItem("ambientSounds", JSON.stringify(sounds));
  }, [sounds]);

  const toggleSound = (id: string) => {
    setSounds(prevSounds => {
      return prevSounds.map(sound => {
        if (sound.id === id) {
          const newIsPlaying = !sound.isPlaying;
          if (newIsPlaying) {
            playSound(id, sound.volume / 100);
          } else {
            pauseSound(id);
          }
          return { ...sound, isPlaying: newIsPlaying };
        }
        return sound;
      });
    });
  };

  const updateVolume = (id: string, volume: number) => {
    setSounds(prevSounds => {
      return prevSounds.map(sound => {
        if (sound.id === id) {
          setVolume(id, volume / 100);
          return { ...sound, volume };
        }
        return sound;
      });
    });
  };

  const playAllSounds = () => {
    const allPlaying = sounds.every(sound => sound.isPlaying);
    
    setSounds(prevSounds => {
      return prevSounds.map(sound => {
        const newIsPlaying = !allPlaying;
        if (newIsPlaying) {
          playSound(sound.id, sound.volume / 100);
        } else {
          pauseSound(sound.id);
        }
        return { ...sound, isPlaying: newIsPlaying };
      });
    });
  };

  return (
    <Card className="shadow-soft">
      <CardContent className="p-6">
        <h2 className="text-xl font-poppins font-semibold mb-5 text-primary flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 11l7-7 7 7M5 19l7-7 7 7" />
          </svg>
          Sound Mixer
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sounds.map((sound) => (
            <div key={sound.id} className="relative bg-background p-4 rounded-custom">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-poppins font-medium">{sound.name}</h3>
                <button 
                  className="p-2 rounded-full hover:bg-secondary hover:text-white transition-colors duration-200" 
                  onClick={() => toggleSound(sound.id)}
                  aria-label={`Toggle ${sound.name} sound`}
                >
                  {sound.isPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="relative">
                <input 
                  type="range" 
                  className="slider w-full h-2 bg-gray-200 rounded-full appearance-none"
                  style={{
                    "--tw-ring-color": "#F6B17A",
                  } as React.CSSProperties}
                  min="0" 
                  max="100" 
                  value={sound.volume} 
                  onChange={(e) => updateVolume(sound.id, parseInt(e.target.value))}
                />
                <div 
                  className="absolute bottom-0 left-0 h-2 bg-[#F6B17A] rounded-l-full" 
                  style={{ width: `${sound.volume}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-center mt-6">
          <button 
            className="bg-primary hover:bg-opacity-90 text-white px-6 py-3 rounded-custom shadow-soft transition-all duration-200 flex items-center font-poppins"
            onClick={playAllSounds}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.728-2.728" />
            </svg>
            <span>{sounds.some(s => s.isPlaying) ? "Pause All" : "Play All"}</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SoundMixer;
