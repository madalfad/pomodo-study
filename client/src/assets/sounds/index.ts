// Define the audio tracks available in the application
import beginSound from './begin.mp3';
import breakStartSound from './breakstart.mp3';
import breakEndSound from './breakend.mp3';

export interface AudioTrack {
  id: string;
  name: string;
  url: string;
}

export const audioTracks: AudioTrack[] = [
  {
    id: 'rain',
    name: 'Rain',
    url: 'https://cdn.freesound.org/previews/346/346170_3509815-lq.mp3'
  },
  {
    id: 'cafe',
    name: 'Cafe',
    url: 'https://cdn.freesound.org/previews/323/323683_5260872-lq.mp3'
  },
  {
    id: 'piano',
    name: 'Piano',
    url: 'https://cdn.freesound.org/previews/533/533852_12421245-lq.mp3'
  },
  {
    id: 'forest',
    name: 'Forest',
    url: 'https://cdn.freesound.org/previews/573/573578_7962777-lq.mp3'
  }
];

// Timer sound effects
export const timerSounds = {
  begin: beginSound,
  breakStart: breakStartSound,
  breakEnd: breakEndSound
};

// Initialize all audio tracks when this module is imported
// This ensures that audio is ready to play when the user clicks
import { initializeSound } from '../../lib/soundManager';

// We place this in a setTimeout to prevent blocking the main thread during initial load
setTimeout(() => {
  // Initialize ambient tracks
  audioTracks.forEach(track => {
    initializeSound(track.id, track.url);
  });
  
  // Initialize timer sounds
  initializeSound('timer-begin', timerSounds.begin);
  initializeSound('timer-breakstart', timerSounds.breakStart);
  initializeSound('timer-breakend', timerSounds.breakEnd);
}, 100);
