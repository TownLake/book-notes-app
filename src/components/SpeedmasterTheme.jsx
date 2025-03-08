// book-notes-app/src/components/SpeedmasterTheme.jsx
import React from 'react';

const SpeedmasterTheme = ({ children }) => {
  return (
    <div className="font-sans bg-gradient-to-br from-gray-100 to-white">
      {/* Modern accent bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-speedmaster-accent"></div>
      
      {/* Clean, minimal container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main content */}
        {children}
      </div>
    </div>
  );
};

export default SpeedmasterTheme;