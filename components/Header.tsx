
import React from 'react';

// FIX: Updated HeaderProps to match usage in App.tsx
interface HeaderProps {
  onExport: () => void;
}

const Header: React.FC<HeaderProps> = ({ onExport }) => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm p-4 border-b border-gray-700 flex justify-between items-center shadow-md z-10">
      <h1 className="text-xl font-bold text-gray-100">Video Subtitle Editor</h1>
      <button
        onClick={onExport}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        aria-label="Export Video"
      >
        <span className="font-medium">Export Video</span>
      </button>
    </header>
  );
};

export default Header;
