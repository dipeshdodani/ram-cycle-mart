import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Logo({ size = "md", className = "" }: LogoProps) {
  const dimensions = {
    sm: "w-8 h-8",
    md: "w-10 h-10", 
    lg: "w-16 h-16"
  };

  return (
    <div className={`${dimensions[size]} ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Outer circle - represents wheel */}
        <circle 
          cx="50" 
          cy="50" 
          r="45" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="4"
          className="text-primary"
        />
        
        {/* Inner circle - hub */}
        <circle 
          cx="50" 
          cy="50" 
          r="12" 
          fill="currentColor" 
          className="text-primary"
        />
        
        {/* Spokes */}
        <g className="text-primary" strokeWidth="3" stroke="currentColor">
          <line x1="50" y1="5" x2="50" y2="38" />
          <line x1="50" y1="62" x2="50" y2="95" />
          <line x1="5" y1="50" x2="38" y2="50" />
          <line x1="62" y1="50" x2="95" y2="50" />
          <line x1="18.93" y1="18.93" x2="36.86" y2="36.86" />
          <line x1="63.14" y1="63.14" x2="81.07" y2="81.07" />
          <line x1="81.07" y1="18.93" x2="63.14" y2="36.86" />
          <line x1="36.86" y1="63.14" x2="18.93" y2="81.07" />
        </g>
        
        {/* Chain link design around outer edge */}
        <circle cx="50" cy="8" r="3" fill="currentColor" className="text-orange-500" />
        <circle cx="50" cy="92" r="3" fill="currentColor" className="text-orange-500" />
        <circle cx="8" cy="50" r="3" fill="currentColor" className="text-orange-500" />
        <circle cx="92" cy="50" r="3" fill="currentColor" className="text-orange-500" />
        
        {/* Decorative gear teeth */}
        <path 
          d="M50 2 L52 6 L48 6 Z M50 98 L52 94 L48 94 Z M2 50 L6 48 L6 52 Z M98 50 L94 48 L94 52 Z"
          fill="currentColor" 
          className="text-orange-600"
        />
      </svg>
    </div>
  );
}

export function LogoWithText({ size = "md", showText = true }: LogoProps & { showText?: boolean }) {
  return (
    <div className="flex items-center space-x-3">
      <Logo size={size} />
      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-bold text-primary dark:text-primary-300">
            Ram Cycle Mart
          </span>
          <span className="text-xs text-gray-600 dark:text-gray-400 -mt-1">
            Service & Repair
          </span>
        </div>
      )}
    </div>
  );
}