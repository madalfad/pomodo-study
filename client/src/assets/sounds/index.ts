// Define the audio tracks available in the application

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

// Initialize all audio tracks when this module is imported
// This ensures that audio is ready to play when the user clicks
import { initializeSound } from '../../lib/soundManager';

// We place this in a setTimeout to prevent blocking the main thread during initial load
setTimeout(() => {
  audioTracks.forEach(track => {
    initializeSound(track.id, track.url);
  });
}, 100);
