
import React from 'react';
import { ModelIcon } from './icons';

const LoadingIndicator: React.FC = () => {
  return (
    <div className="flex items-start gap-3 justify-start">
        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
          <ModelIcon className="w-5 h-5 text-gray-300" />
        </div>
        <div className="flex items-center space-x-1.5 max-w-xs md:max-w-md lg:max-w-2xl px-4 py-3 rounded-2xl rounded-bl-none bg-gray-700 text-gray-200">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
        </div>
    </div>
  );
};

export default LoadingIndicator;
