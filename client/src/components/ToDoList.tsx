import { FC, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { motion, AnimatePresence } from "framer-motion";

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

  const toggleTaskComplete = (id: string) => {
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
    <Card className="shadow-soft">
      <CardContent className="p-6">
        <h2 className="text-xl font-poppins font-semibold mb-5 text-primary flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Study Tasks
        </h2>
        
        <form className="mb-4 flex" onSubmit={addTask}>
          <input 
            type="text" 
            className="flex-grow p-3 border border-gray-300 rounded-l-custom focus:outline-none focus:border-secondary bg-background font-workSans"
            placeholder="Add a task..."
            aria-label="Add a new task"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
          />
          <Button 
            type="submit" 
            className="bg-[#F6B17A] hover:bg-opacity-90 text-white px-4 rounded-r-custom transition-colors duration-200"
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
                className={`todo-item flex items-center justify-between p-3 bg-background rounded-custom ${task.completed ? 'opacity-60 line-through' : ''}`}
              >
                <div className="flex items-center">
                  <Checkbox 
                    id={`task-${task.id}`}
                    className="mr-3 h-5 w-5 accent-secondary" 
                    checked={task.completed}
                    onCheckedChange={() => toggleTaskComplete(task.id)}
                  />
                  <label 
                    htmlFor={`task-${task.id}`}
                    className="font-workSans"
                  >
                    {task.text}
                  </label>
                </div>
                <button 
                  className="text-gray-400 hover:text-red-500" 
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
            <div className="text-center py-6 text-gray-500 font-workSans">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
              className="text-sm text-secondary hover:text-primary transition-colors font-workSans"
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
  );
};

export default ToDoList;
