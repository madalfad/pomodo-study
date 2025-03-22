import { FC } from "react";
import { Link } from "wouter";

const Header: FC = () => {
  return (
    <header className="bg-primary text-white py-4 px-6 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/">
          <a className="text-2xl font-poppins font-bold flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.95 21a2 2 0 0 1-1.95 2H6a2 2 0 0 1-1.95-2m12-10V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v7m0 0v8a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-8m-6 0h6" />
            </svg>
            Ambient Study
          </a>
        </Link>
        <div className="hidden md:flex items-center space-x-4 text-sm font-workSans">
          <button className="px-4 py-2 rounded-custom hover:bg-secondary transition-colors duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            About
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
