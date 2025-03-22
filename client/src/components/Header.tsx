import { FC, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

const Header: FC = () => {
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const toggleInfo = () => setIsInfoOpen(!isInfoOpen);

  return (
    <>
      <motion.header 
        className="bg-gray-900 border-b border-gray-800 text-white py-4 px-6 shadow-lg z-10 relative"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/">
            <motion.div 
              className="text-2xl font-poppins font-bold flex items-center cursor-pointer"
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 h-7 w-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600">
                StudyViber
              </span>
            </motion.div>
          </Link>
          
          <div className="flex items-center space-x-3 text-sm font-workSans">
            <motion.button
              className="flex items-center px-3 py-1.5 rounded-full bg-gray-800/70 hover:bg-gray-800 transition-colors duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Toggle theme"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </motion.button>
            
            <motion.button 
              onClick={toggleInfo}
              className="flex items-center space-x-1 px-4 py-2 rounded-md border border-gray-700 hover:border-amber-500 hover:bg-gray-800 transition-colors duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">About</span>
            </motion.button>
          </div>
        </div>
      </motion.header>
      
      <AnimatePresence>
        {isInfoOpen && (
          <motion.div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleInfo}
          >
            <motion.div 
              className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl max-w-md p-6 w-full"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-poppins font-bold text-amber-400">About StudyViber</h2>
                <button 
                  onClick={toggleInfo}
                  className="text-gray-400 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              <div className="text-gray-300 space-y-3 font-workSans text-sm">
                <p>
                  StudyViber is a distraction-free web-based study environment designed to help you focus and be productive.
                </p>
                <p>
                  Features include:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-gray-400">
                  <li>Customizable ambient sounds and music</li>
                  <li>Pomodoro timer with break reminders</li>
                  <li>To-do list to track your tasks</li>
                  <li>Global study sessions visualization</li>
                </ul>
                <p className="pt-2 text-gray-500 text-xs">
                  Created with ♥ for focused, productive study sessions.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
