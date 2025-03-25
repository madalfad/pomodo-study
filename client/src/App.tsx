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

function Home() {
  return (
    <div className="flex-grow container mx-auto px-4 py-6 md:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Desktop: Left column with Sound Mixer & Globe */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Sound Mixer always appears first */}
          <div className="order-1">
            <SoundMixer />
          </div>
          
          {/* On mobile only: Timer and Todo appear second */}
          <div className="block lg:hidden order-2 space-y-6">
            <PomodoroTimer />
            <ToDoList />
          </div>
          
          {/* Globe appears after Timer & Todo on mobile, but right after Sound Mixer on desktop */}
          <div className="order-3 lg:order-2">
            <GlobeVisualization />
          </div>
        </div>
        {/* Desktop: Right column - Timer & Todo list */}
        {/* These only show on desktop */}
        <div className="lg:col-span-4 space-y-6 lg:order-2 hidden lg:block">
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col dark bg-background">
        <Header />
        <Router />
        <Footer />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
