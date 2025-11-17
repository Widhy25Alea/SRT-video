
import React, { useState, useRef, useEffect } from 'react';
import type { TranslationKey } from '../constants';
import { SendIcon } from './icons';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  getTranslation: (key: TranslationKey) => string;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isLoading, getTranslation }) => {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${scrollHeight}px`;
    }
  }, [inputValue]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <footer className="bg-gray-800/70 backdrop-blur-sm p-4 border-t border-gray-700">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex items-end space-x-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getTranslation('inputPlaceholder')}
            className="w-full bg-gray-700 text-gray-200 placeholder-gray-400 rounded-lg p-3 pr-12 resize-none border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200 max-h-40 scrollbar-thin-dark"
            rows={1}
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          className="bg-blue-600 text-white rounded-lg h-12 w-12 flex items-center justify-center flex-shrink-0 transition-colors duration-200 enabled:hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          aria-label={getTranslation('sendButton')}
        >
          <SendIcon className="w-6 h-6" />
        </button>
      </form>
    </footer>
  );
};

export default MessageInput;
