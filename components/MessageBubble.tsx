
import React from 'react';
import type { Message } from '../types';
import { UserIcon, ModelIcon } from './icons';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const bubbleClasses = isUser
    ? 'bg-blue-600 text-white rounded-br-none'
    : 'bg-gray-700 text-gray-200 rounded-bl-none';
  const containerClasses = isUser ? 'justify-end' : 'justify-start';
  const textColorClass = message.isError ? 'text-red-400' : 'text-gray-200';
  
  const formattedContent = message.content.replace(/\n/g, '<br />');


  return (
    <div className={`flex items-start gap-3 ${containerClasses}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
          <ModelIcon className="w-5 h-5 text-gray-300" />
        </div>
      )}
      <div
        className={`flex flex-col max-w-xs md:max-w-md lg:max-w-2xl px-4 py-3 rounded-2xl ${bubbleClasses} ${textColorClass}`}
      >
        <p className="text-base leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formattedContent }} />
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
          <UserIcon className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
