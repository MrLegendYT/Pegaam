import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shadow-lg shadow-accent/20">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
          <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
          <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
        </svg>
      </div>
      <span className="font-display font-bold text-2xl text-white tracking-tight">
        Pegaam<span className="text-accent">.</span>
      </span>
    </div>
  );
};

export default Logo;
