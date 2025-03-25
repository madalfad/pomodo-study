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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mr-3 h-7 w-7 text-amber-500"
                fill="currentColor"
                viewBox="0 0 1200 1200"
              >
                <path
                  d="m607.93 1096.7c-138.12 0-273.95-44.941-403.69-133.57-190.04-129.83-214.59-315.77-174.21-446.5 49.934-161.59 196.41-270.16 364.5-270.16 67.98 0 137.36 17.027 206.48 50.641 90.59-35.676 174.17-53.762 248.64-53.762 152.75 0 267.53 77.746 314.89 213.29 59.566 170.47-1.5586 383.43-142.18 495.36-42.637 33.938-198.54 144.7-414.44 144.7zm-213.4-782.2c-138.07 0-258.45 89.293-299.5 222.2-43.043 139.32 12.121 277.72 147.57 370.24 118.23 80.773 241.14 121.73 365.32 121.73 193.86 0 333.8-99.406 372.07-129.89 117.13-93.238 169.98-277.59 120.32-419.69-37.777-108.14-126.8-167.7-250.68-167.7-69.504 0-149.33 18.324-237.25 54.48l-14.605 6-14.004-7.2734c-63.98-33.254-127.65-50.102-189.24-50.102z"
                />
                <path
                  d="m611.77 403.63c99.574 62.594 176.14-6.3711 198.74 122.9 0 0.023438 77.461-99.996-138.93-146.35 0 0 140.09 24.086 191.1-42.012 0 0-142.93 28.777-224.02-39.371 0 0 14.988-70.391 62.195-94.164l-43.246-34.332s-81.707 46.559-68.398 118.36c0 0-93.66 28.441-197.87-151.38 0 0 41.125 211.64 150.85 202.14 0 0-137.22 12.781-131.21 171.98-0.015625-0.015625 77.504-185.23 200.77-107.77z"
                />
                <path
                  d="m268.98 421.84c-66.492 0.12109-171.1 163.75-85.379 288.93 87.719 128.07-17.688-52.234 66.289-164.02 58.391-77.773 103.08-125.05 19.09-124.91z"
                />
                <path
                  d="m987.72 804.6c-49.078 63.359-117.83 103.21-153.35 103.69-5.1719 0.10547-9.7305 0.10547-13.93 0.10547-17.039 0-24.84-0.73047-28.32-1.4414 4.3203-3.2539 14.879-8.7617 25.211-14.16 38.387-19.922 102.72-53.398 144.83-109.8 51.84-69.48 59.398-164.64 63-210.36 0.25391-2.8789 0.48047-5.6406 0.73047-8.2812 3 11.039 7.0781 28.199 11.641 47.16 19.547 81.363-16.332 149.88-49.812 193.09z"
                />
              </svg>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600">
                pomodo.study
              </span>
            </motion.div>
          </Link>

          <div className="flex items-center space-x-3 text-sm font-workSans">
            <motion.button
              onClick={toggleInfo}
              className="flex items-center space-x-1 px-4 py-2 rounded-md border border-gray-700 hover:border-amber-500 hover:bg-gray-800 transition-colors duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-amber-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
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
                <h2 className="text-xl font-poppins font-bold text-amber-400">
                  About pomodo.study
                </h2>
                <button
                  onClick={toggleInfo}
                  className="text-gray-400 hover:text-white"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              <div className="text-gray-300 space-y-3 font-workSans text-sm">
                <p>
                  pomodo.study is a distraction-free web-based study environment
                  designed to help you focus and be productive.
                </p>
                <p>Features include:</p>
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
