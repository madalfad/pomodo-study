// Import sound files directly as modules
import beginSound from './begin.mp3';
import breakStartSound from './breakstart.mp3';
import breakEndSound from './breakend.mp3';

// Export sounds with proper typing
export const TimerSounds = {
  begin: beginSound,
  breakStart: breakStartSound,
  breakEnd: breakEndSound
};

export default TimerSounds;