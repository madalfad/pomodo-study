import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Header from "./components/Header";
import Footer from "./components/Footer";
import SoundMixer from "./components/SoundMixer";
import GlobeVisualization from "./components/GlobeVisualization";
import PomodoroTimer from "./components/PomodoroTimer";
import ToDoList from "./components/ToDoList";
import DarkModeToggle from "./components/DarkModeToggle";
import { DarkModeProvider, useDarkMode } from "./contexts/DarkModeContext";

function Home() {
  return (
    <div className="flex-grow container mx-auto px-4 py-6 md:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <SoundMixer />
          <GlobeVisualization />
        </div>
        <div className="lg:col-span-4 space-y-6">
          <PomodoroTimer />
          <ToDoList />
        </div>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { darkMode } = useDarkMode();
  
  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark bg-background' : 'bg-background'}`}>
      <Header />
      <Router />
      <Footer />
      <DarkModeToggle />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DarkModeProvider>
        <AppContent />
        <Toaster />
      </DarkModeProvider>
    </QueryClientProvider>
  );
}

export default App;
