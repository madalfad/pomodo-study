import { FC, useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { motion, AnimatePresence } from "framer-motion";
import { playSound, preloadSound, initAudio } from "@/lib/simpleSoundPlayer";
import TimerSounds from "@/assets/audio";

interface PomodoroSettings {
  focusTime: number;
  breakTime: number;
  longBreakTime: number;
  cyclesBeforeLongBreak: number;
}

const PomodoroTimer: FC = () => {
  const [timerSettings, setTimerSettings] = useLocalStorage<PomodoroSettings>("timerSettings", { 
    focusTime: 25, 
    breakTime: 5,
    longBreakTime: 15,
    cyclesBeforeLongBreak: 4
  });

  const [timerType, setTimerType] = useState<'focus' | 'break' | 'longBreak'>('focus');
  const [timeRemaining, setTimeRemaining] = useState(timerSettings.focusTime * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [focusInput, setFocusInput] = useState(timerSettings.focusTime.toString());
  const [breakInput, setBreakInput] = useState(timerSettings.breakTime.toString());
  const [longBreakInput, setLongBreakInput] = useState(timerSettings.longBreakTime.toString());
  const [cyclesInput, setCyclesInput] = useState(timerSettings.cyclesBeforeLongBreak.toString());
  const [alertVolume, setAlertVolume] = useLocalStorage<number>("alertVolume", 0.5);

  const timerRef = useRef<number | null>(null);

  // Function to play a timer sound using our simple player
  const playTimerSound = (soundUrl: string, volume: number) => {
    try {
      console.log(`Playing timer sound: ${soundUrl} at volume ${volume}`);
      playSound(soundUrl, volume);
    } catch (error) {
      console.error(`Error playing timer sound ${soundUrl}:`, error);
    }
  };
  
  // Preload sounds on component mount
  useEffect(() => {
    console.log('Preloading timer sounds...');
    preloadSound(TimerSounds.begin);
    preloadSound(TimerSounds.breakStart);
    preloadSound(TimerSounds.breakEnd);
  }, []);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Timer completed
            // Play appropriate sound based on current timer type
            if (timerType === 'focus') {
              playTimerSound(TimerSounds.breakStart, alertVolume);
            } else {
              playTimerSound(TimerSounds.breakEnd, alertVolume);
            }
            clearInterval(timerRef.current!);

            // Auto-transition to the next phase
            progressToNextPhase();

            // Return a placeholder value - this won't be used because we're progressing to next phase
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, timerType, timerSettings, currentCycle, alertVolume]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressToNextPhase = () => {
    let newTimerType: 'focus' | 'break' | 'longBreak';
    let newDuration: number;
    let newCycle = currentCycle;

    // Initialize audio context for sounds
    initAudio();

    if (timerType === 'focus') {
      // After focus, go to break or long break
      if (currentCycle >= timerSettings.cyclesBeforeLongBreak) {
        newTimerType = 'longBreak';
        newDuration = timerSettings.longBreakTime * 60;
        newCycle = 1; // Reset cycle count
      } else {
        newTimerType = 'break';
        newDuration = timerSettings.breakTime * 60;
      }
    } else {
      // After any break, go back to focus
      newTimerType = 'focus';
      newDuration = timerSettings.focusTime * 60;

      if (timerType === 'break') {
        newCycle = currentCycle + 1;
      }
    }

    // Dispatch custom event for sound mixer
    window.dispatchEvent(new CustomEvent('pomodoroStateChange', { 
      detail: { timerType: newTimerType }
    }));

    setTimerType(newTimerType);
    setTimeRemaining(newDuration);
    setCurrentCycle(newCycle);
    setIsRunning(true); // Auto-start next phase
  };

  const startTimer = () => {
    const wasRunning = isRunning;
    setIsRunning(prev => !prev);

    // Initialize audio context on user interaction
    initAudio();

    // Play begin sound when starting the timer (not when pausing)
    if (!wasRunning) {
      playTimerSound(TimerSounds.begin, alertVolume);
    }
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setTimerType('focus');
    setCurrentCycle(1);
    setTimeRemaining(timerSettings.focusTime * 60);
    setIsRunning(false);
  };

  const saveSettings = () => {
    const focusValue = Math.max(1, parseInt(focusInput) || 25);
    const breakValue = Math.max(1, parseInt(breakInput) || 5);
    const longBreakValue = Math.max(1, parseInt(longBreakInput) || 15);
    const cyclesValue = Math.max(1, parseInt(cyclesInput) || 4);

    setTimerSettings({
      focusTime: focusValue,
      breakTime: breakValue,
      longBreakTime: longBreakValue,
      cyclesBeforeLongBreak: cyclesValue
    });

    setFocusInput(focusValue.toString());
    setBreakInput(breakValue.toString());
    setLongBreakInput(longBreakValue.toString());
    setCyclesInput(cyclesValue.toString());

    // Reset the timer with new settings if not running
    if (!isRunning) {
      let duration = focusValue;
      if (timerType === 'break') duration = breakValue;
      if (timerType === 'longBreak') duration = longBreakValue;
      setTimeRemaining(duration * 60);
    }

    setShowSettings(false);
  };

  // Calculate current progress for the circular timer
  let duration = timerSettings.focusTime * 60;
  if (timerType === 'break') duration = timerSettings.breakTime * 60;
  if (timerType === 'longBreak') duration = timerSettings.longBreakTime * 60;

  const progress = 1 - (timeRemaining / duration);
  const circumference = 2 * Math.PI * 46;
  const strokeDashoffset = circumference * (1 - progress);

  // Determine color based on timer type
  let timerColor = "#f59e0b"; // amber-500 for focus
  if (timerType === 'break') timerColor = "#10b981"; // emerald-500 for short break
  if (timerType === 'longBreak') timerColor = "#3b82f6"; // blue-500 for long break

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="shadow-lg bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-poppins font-semibold text-amber-400 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pomodoro Timer
            </h2>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="text-gray-400 hover:text-amber-400 transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {showSettings ? (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-gray-700 rounded-lg p-4 mb-4"
              >
                <h3 className="text-base font-medium text-gray-200 mb-3">Timer Settings</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label className="block text-sm text-gray-300 mb-1">Focus Time (min)</Label>
                    <Input 
                      type="number" 
                      min="1"
                      className="bg-gray-800 border-gray-600 text-gray-200"
                      value={focusInput} 
                      onChange={e => setFocusInput(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="block text-sm text-gray-300 mb-1">Break Time (min)</Label>
                    <Input 
                      type="number" 
                      min="1"
                      className="bg-gray-800 border-gray-600 text-gray-200"
                      value={breakInput} 
                      onChange={e => setBreakInput(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="block text-sm text-gray-300 mb-1">Long Break (min)</Label>
                    <Input 
                      type="number" 
                      min="1"
                      className="bg-gray-800 border-gray-600 text-gray-200"
                      value={longBreakInput} 
                      onChange={e => setLongBreakInput(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="block text-sm text-gray-300 mb-1">Cycles Before Long Break</Label>
                    <Input 
                      type="number" 
                      min="1"
                      className="bg-gray-800 border-gray-600 text-gray-200"
                      value={cyclesInput} 
                      onChange={e => setCyclesInput(e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 mt-2">
                    <Label className="block text-sm text-gray-300 mb-1">
                      Alert Volume: {Math.round(alertVolume * 100)}%
                    </Label>
                    <div className="flex items-center space-x-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 01-.707-7.07l.707.707a4 4 0 000 5.656l-.707.707zm2.122-9.9A9 9 0 0121.07 13.95l-.707.707A8 8 0 006.343 7.05l.707-.707z" />
                      </svg>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={alertVolume}
                        onChange={e => setAlertVolume(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                      />
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 01-.707-7.07l.707.707a4 4 0 000 5.656l-.707.707zm2.122-9.9A9 9 0 0121.07 13.95l-.707.707A8 8 0 006.343 7.05l.707-.707z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    className="bg-amber-500 hover:bg-amber-600 text-gray-900 px-4 py-2 rounded transition-colors duration-200"
                    onClick={saveSettings}
                  >
                    Save Settings
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="timer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center"
              >
                <div className="relative w-48 h-48 mb-6">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle 
                      className="progress-ring__circle" 
                      stroke="#4b5563" 
                      strokeWidth="4" 
                      fill="transparent" 
                      r="46" 
                      cx="50" 
                      cy="50"
                    />
                    {/* Progress circle */}
                    <circle 
                      className="progress-ring__circle" 
                      stroke={timerColor} 
                      strokeWidth="4" 
                      fill="transparent" 
                      r="46" 
                      cx="50" 
                      cy="50"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset} 
                      style={{ 
                        transition: 'stroke-dashoffset 1s, stroke 0.5s',
                        transform: 'rotate(-90deg)',
                        transformOrigin: '50% 50%'
                      }}
                    />
                  </svg>
                  <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
                    <span className="font-poppins text-4xl font-semibold text-gray-100">{formatTime(timeRemaining)}</span>
                    <span 
                      className="text-sm mt-1 font-workSans"
                      style={{ color: timerColor }}
                    >
                      {timerType === 'focus' ? 'Focus Time' : timerType === 'break' ? 'Short Break' : 'Long Break'}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-4 mb-6">
                  <Button 
                    className={`hover:bg-opacity-90 text-gray-900 px-4 py-2 rounded shadow-sm transition-all duration-200 font-poppins ${isRunning ? 'bg-red-400 hover:bg-red-500' : 'bg-amber-500 hover:bg-amber-600'}`}
                    onClick={startTimer}
                  >
                    {isRunning ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg> Pause
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg> Start
                      </>
                    )}
                  </Button>
                  <Button 
                    className="bg-indigo-500 hover:bg-indigo-600 text-gray-100 px-4 py-2 rounded shadow-sm transition-all duration-200 font-poppins"
                    onClick={progressToNextPhase}
                    title={`Skip to ${timerType === 'focus' ? 'break' : 'focus'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg> Skip
                  </Button>
                  <Button 
                    variant="outline"
                    className="bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600 px-4 py-2 rounded shadow-sm transition-all duration-200 font-poppins"
                    onClick={resetTimer}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg> Reset
                  </Button>
                </div>

                <div className="w-full">
                  <div className="flex justify-between mb-2 text-sm">
                    <span className="text-gray-400">Cycle {currentCycle} of {timerSettings.cyclesBeforeLongBreak}</span>
                    <span 
                      className="font-medium"
                      style={{ color: timerColor }}
                    >
                      {timerType === 'focus' ? `${timerSettings.focusTime}min focus` : 
                       timerType === 'break' ? `${timerSettings.breakTime}min break` : 
                       `${timerSettings.longBreakTime}min long break`}
                    </span>
                  </div>

                  <div className="bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-300 ease-in-out" 
                      style={{ 
                        width: `${progress * 100}%`,
                        backgroundColor: timerColor
                      }}
                    ></div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PomodoroTimer;