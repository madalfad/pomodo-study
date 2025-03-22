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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col" style={{ 
        fontFamily: "'Work Sans', sans-serif",
        backgroundColor: "#F7F7F7",
        color: "#333333"
      }}>
        <Header />
        <Router />
        <Footer />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
