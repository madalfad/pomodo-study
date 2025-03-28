import { FC, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { motion, AnimatePresence } from "framer-motion";
import { TimerSounds } from "@/assets/audio";
import { playSound, preloadSound } from "@/lib/simpleSoundPlayer";

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

const ToDoList: FC = () => {
  const [tasks, setTasks] = useLocalStorage<Task[]>("studyTasks", []);
  const [newTaskText, setNewTaskText] = useState("");

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim() === "") return;
    
    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false
    };
    
    setTasks([...tasks, newTask]);
    setNewTaskText("");
  };

  // Preload the task complete sound when component mounts
  useEffect(() => {
    preloadSound(TimerSounds.taskComplete);
  }, []);

  const toggleTaskComplete = (id: string) => {
    const task = tasks.find(t => t.id === id);
    
    // Play completion sound only when marking as complete (not when unchecking)
    if (task && !task.completed) {
      playSound(TimerSounds.taskComplete, 0.5); // Play at 50% volume
    }
    
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const clearCompletedTasks = () => {
    setTasks(tasks.filter(task => !task.completed));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <Card className="shadow-lg bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <h2 className="text-xl font-poppins font-semibold mb-5 text-amber-400 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Study Tasks
          </h2>
          
          <form className="mb-4 flex items-center" onSubmit={addTask}>
            <input 
              type="text" 
              className="flex-grow p-3 border border-r-0 border-gray-600 rounded-l-md focus:outline-none focus:border-amber-400 focus:border-r-0 bg-gray-700 text-gray-200 font-workSans placeholder-gray-400"
              placeholder="Add a task..."
              aria-label="Add a new task"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
            />
            <Button 
              type="submit" 
              className="bg-amber-500 hover:bg-amber-600 text-gray-900 px-4 rounded-none rounded-r-md transition-colors duration-200 h-[50px] flex items-center justify-center border border-amber-500 border-l-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </Button>
          </form>
          
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            <AnimatePresence>
              {tasks.map((task) => (
                <motion.div 
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className={`todo-item flex items-center justify-between p-3 bg-gray-700 rounded-md border border-gray-600 ${task.completed ? 'opacity-60 line-through' : ''}`}
                >
                  <div className="flex items-center">
                    <Checkbox 
                      id={`task-${task.id}`}
                      className="mr-3 h-5 w-5 border-gray-500 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500" 
                      checked={task.completed}
                      onCheckedChange={() => toggleTaskComplete(task.id)}
                    />
                    <label 
                      htmlFor={`task-${task.id}`}
                      className="font-workSans text-gray-200"
                    >
                      {task.text}
                    </label>
                  </div>
                  <button 
                    className="text-gray-400 hover:text-red-400" 
                    onClick={() => deleteTask(task.id)}
                    aria-label="Delete task"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {tasks.length === 0 && (
              <div className="text-center py-6 text-gray-400 font-workSans">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>No tasks yet. Add one to get started!</p>
              </div>
            )}
          </div>
          
          {tasks.some(task => task.completed) && (
            <div className="mt-4 text-right">
              <Button 
                variant="link"
                className="text-sm text-amber-400 hover:text-amber-300 transition-colors font-workSans"
                onClick={clearCompletedTasks}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg> Clear completed
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ToDoList;
