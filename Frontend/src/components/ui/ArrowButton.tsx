import React from 'react';

interface ArrowButtonProps {
  onClick: () => void;
}

export const ArrowButton=function ({ onClick }: ArrowButtonProps) {
  return (
    <>
      <style>{`
        @keyframes chevron-wave {
          0% {
            opacity: 0.2;
            transform: translateY(4px);
          }
          50% {
            opacity: 1;
            transform: translateY(-2px);
          }
          100% {
            opacity: 0.2;
            transform: translateY(4px);
          }
        }
        
        .chevron {
          animation: chevron-wave 1.5s ease-in-out infinite;
        }
        
        .chevron-1 {
          animation-delay: 0s;
        }
        
        .chevron-2 {
          animation-delay: 0.15s;
        }
        
        .chevron-3 {
          animation-delay: 0.3s;
        }
        
        .arrow-btn:hover .chevron {
          filter: drop-shadow(0 0 8px rgba(40, 245, 204, 0.9));
        }
        
        .arrow-btn:hover {
          transform: scale(1.05);
        }
        
        .arrow-btn:active {
          transform: scale(0.98);
        }
      `}</style>
      
      <button
        onClick={onClick}
        className="arrow-btn absolute top-24 right-8 z-30 p-3 transition-all duration-300 cursor-pointer bg-transparent border-none"
        aria-label="Back to top"
      >
        <div className="relative flex flex-col items-center justify-center gap-1">
          {/* Three stacked chevrons pointing up */}
          <svg 
            width="40" 
            height="56" 
            viewBox="0 0 40 56" 
            fill="none"
            className="relative"
          >
            {/* Chevron 1 (top) */}
            <path 
              className="chevron chevron-1"
              d="M8 24 L20 12 L32 24"
              stroke="#28f5cc"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            
            {/* Chevron 2 (middle) */}
            <path 
              className="chevron chevron-2"
              d="M8 36 L20 24 L32 36"
              stroke="#28f5cc"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            
            {/* Chevron 3 (bottom) */}
            <path 
              className="chevron chevron-3"
              d="M8 48 L20 36 L32 48"
              stroke="#28f5cc"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>
      </button>
    </>
  );
}

