import { FC } from "react";
import { motion } from "framer-motion";

const Footer: FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <motion.footer 
      className="bg-gray-900 py-6 border-t border-gray-800 mt-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center justify-center md:justify-start">
              <span className="text-amber-400 font-poppins font-bold text-lg">pomodo.study</span>
              <span className="mx-2 text-gray-600">|</span>
              <span className="text-gray-400 text-sm">Focus with flow</span>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
            </a>
          </div>
        </div>
        
        <div className="mt-6 border-t border-gray-800 pt-4 text-center text-xs text-gray-500 font-workSans">
          <p>&copy; {currentYear} Mahmoud Al-Fadhl. All rights reserved.</p>
          <p className="mt-1">Focus better with customizable sounds and productivity tools.</p>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
