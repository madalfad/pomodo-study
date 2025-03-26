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

          {/* BMC Widget is added via JavaScript, so this space is left empty */}
          <div className="flex items-center space-x-4">
            {/* Widget will appear on the page, not in the footer */}
          </div>
        </div>

        <div className="mt-6 border-t border-gray-800 pt-4 text-center text-xs text-gray-500 font-workSans">
          <p>&copy; {currentYear} <a href="https://linktr.ee/madalfad" target="_blank" rel="noopener noreferrer">Mahmoud Al-Fadhl</a>. All rights reserved.</p>
          <p className="mt-1">
            Focus better with customizable sounds and productivity tools.
          </p>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
