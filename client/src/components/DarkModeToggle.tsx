import React from 'react';
import { Button } from '@/components/ui/button';
import { useDarkMode } from '@/contexts/DarkModeContext';
import { Moon, Sun } from 'lucide-react';

const DarkModeToggle: React.FC = () => {
  const { darkMode, toggleDarkMode } = useDarkMode();

  return (
    <div className="fixed top-4 right-4 z-50">
      <Button
        variant="outline"
        size="icon"
        onClick={toggleDarkMode}
        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        className="rounded-full bg-card hover:bg-card/90 transition-colors"
      >
        {darkMode ? (
          <Sun className="h-5 w-5 text-yellow-400" />
        ) : (
          <Moon className="h-5 w-5 text-primary" />
        )}
      </Button>
    </div>
  );
};

export default DarkModeToggle;