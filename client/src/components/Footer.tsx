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
              <span className="text-amber-400 font-poppins font-bold text-lg">
                pomodo.study
              </span>
              <span className="mx-2 text-gray-600">|</span>
              <span className="text-gray-400 text-sm">Focus with flow</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <a 
                href="https://www.buymeacoffee.com/madalfad" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block rounded shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                <img 
                  src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=madalfad&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff"
                  alt="Buy Me A Coffee"
                  className="h-10"
                />
              </a>
            </motion.div>
          </div>
        </div>

        <div className="mt-6 border-t border-gray-800 pt-4 text-center text-xs text-gray-500 font-workSans">
          <p>&copy; {currentYear} Mahmoud Al-Fadhl. All rights reserved.</p>
          <p className="mt-1">
            Focus better with customizable sounds and productivity tools.
          </p>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
