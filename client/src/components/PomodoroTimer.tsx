import { FC, useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/lib/useLocalStorage";

const PomodoroTimer: FC = () => {
  const [timerSettings, setTimerSettings] = useLocalStorage("timerSettings", { 
    focusTime: 25, 
    breakTime: 5 
  });
  const [timerType, setTimerType] = useState<'focus' | 'break'>('focus');
  const [timeRemaining, setTimeRemaining] = useState(timerSettings.focusTime * 60);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset timer when settings change
    const duration = timerType === 'focus' ? timerSettings.focusTime : timerSettings.breakTime;
    if (!isRunning) {
      setTimeRemaining(duration * 60);
    }
  }, [timerSettings, timerType]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Timer completed
            const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
            audio.play();
            clearInterval(timerRef.current!);
            setIsRunning(false);
            
            // Switch timer type
            const newType = timerType === 'focus' ? 'break' : 'focus';
            setTimerType(newType);
            
            // Set new duration
            return newType === 'focus' ? timerSettings.focusTime * 60 : timerSettings.breakTime * 60;
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
  }, [isRunning, timerType, timerSettings]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    setIsRunning(prev => !prev);
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    const duration = timerType === 'focus' ? timerSettings.focusTime : timerSettings.breakTime;
    setTimeRemaining(duration * 60);
    setIsRunning(false);
  };

  const updateTimerSettings = (type: 'focusTime' | 'breakTime', value: number) => {
    setTimerSettings(prev => ({
      ...prev,
      [type]: value
    }));
    
    // If the timer is not running and we're updating the current timer type duration
    if (!isRunning && ((type === 'focusTime' && timerType === 'focus') || (type === 'breakTime' && timerType === 'break'))) {
      setTimeRemaining(value * 60);
    }
  };

  // Calculate progress for the circular timer
  const duration = timerType === 'focus' ? timerSettings.focusTime * 60 : timerSettings.breakTime * 60;
  const progress = 1 - (timeRemaining / duration);
  const circumference = 2 * Math.PI * 46;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <Card className="shadow-soft">
      <CardContent className="p-6">
        <h2 className="text-xl font-poppins font-semibold mb-5 text-primary flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Pomodoro Timer
        </h2>
        
        <div className="flex flex-col items-center">
          <div className="relative w-48 h-48 mb-6">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle 
                className="progress-ring__circle" 
                stroke="#e6e6e6" 
                strokeWidth="4" 
                fill="transparent" 
                r="46" 
                cx="50" 
                cy="50"
              />
              {/* Progress circle */}
              <circle 
                className="progress-ring__circle" 
                stroke="#F6B17A" 
                strokeWidth="4" 
                fill="transparent" 
                r="46" 
                cx="50" 
                cy="50"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset} 
                style={{ 
                  transition: 'stroke-dashoffset 0.3s',
                  transform: 'rotate(-90deg)',
                  transformOrigin: '50% 50%'
                }}
              />
            </svg>
            <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
              <span className="font-poppins text-4xl font-semibold">{formatTime(timeRemaining)}</span>
              <span className="text-sm text-secondary mt-1 font-workSans">
                {timerType === 'focus' ? 'Focus Time' : 'Break Time'}
              </span>
            </div>
          </div>
          
          <div className="flex space-x-4 mb-6">
            <Button 
              className="bg-primary hover:bg-opacity-90 text-white px-4 py-2 rounded-custom shadow-sm transition-all duration-200 font-poppins"
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
              variant="outline"
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-custom shadow-sm transition-all duration-200 font-poppins"
              onClick={resetTimer}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg> Reset
            </Button>
          </div>
          
          <div className="w-full grid grid-cols-2 gap-4">
            <div>
              <Label className="block text-sm text-gray-600 mb-1 font-workSans">Focus</Label>
              <Select 
                value={timerSettings.focusTime.toString()}
                onValueChange={(value) => updateTimerSettings('focusTime', parseInt(value))}
              >
                <SelectTrigger className="w-full p-2 border border-gray-300 rounded-custom focus:outline-none focus:border-secondary bg-background">
                  <SelectValue placeholder="Select focus time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="25">25 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">60 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block text-sm text-gray-600 mb-1 font-workSans">Break</Label>
              <Select 
                value={timerSettings.breakTime.toString()}
                onValueChange={(value) => updateTimerSettings('breakTime', parseInt(value))}
              >
                <SelectTrigger className="w-full p-2 border border-gray-300 rounded-custom focus:outline-none focus:border-secondary bg-background">
                  <SelectValue placeholder="Select break time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 min</SelectItem>
                  <SelectItem value="10">10 min</SelectItem>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="20">20 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PomodoroTimer;
