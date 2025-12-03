import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, MessageRole } from '../types';
import { SourceChips } from './SourceChips';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = memo(({ message }) => {
  const isUser = message.role === MessageRole.USER;

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4 group`}>
      <div 
        className={`
          relative max-w-[95%] md:max-w-[85%] lg:max-w-[75%] px-4 py-3 border-l-2
          ${isUser 
            ? 'bg-indigo-950/30 border-indigo-500 text-indigo-100' 
            : 'bg-slate-900/50 border-orange-500/50 text-slate-300'
          }
        `}
      >
        {/* Header line */}
        <div className="flex items-center gap-2 mb-2 pb-1 border-b border-white/5 opacity-70">
          <span className={`text-[10px] font-mono uppercase font-bold tracking-wider ${isUser ? 'text-indigo-400' : 'text-orange-400'}`}>
            {isUser ? '>_ USER_INPUT' : ':: VALIDATOR_RESULT'}
          </span>
          <span className="text-[10px] font-mono text-slate-600">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
          </span>
        </div>

        {/* User Attachment Display */}
        {isUser && message.attachment && (
          <div className="mb-3 rounded-md overflow-hidden border border-slate-700 max-w-xs">
            <img 
              src={`data:${message.attachment.mimeType};base64,${message.attachment.base64}`} 
              alt="User Upload" 
              className="w-full h-auto opacity-90 hover:opacity-100 transition-opacity"
            />
            <div className="bg-slate-950 px-2 py-1 text-[10px] font-mono text-slate-500">
              [IMAGE_DATA_LOADED]
            </div>
          </div>
        )}

        {/* Content */}
        <div className={`markdown-body leading-relaxed break-words font-light ${isUser ? 'text-indigo-50' : 'text-slate-300'}`}>
           <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
           </ReactMarkdown>
        </div>

        {/* Sources (Only for assistant) */}
        {!isUser && message.groundingChunks && message.groundingChunks.length > 0 && (
          <div className="mt-4 pt-2 border-t border-slate-800/50">
             <SourceChips sources={message.groundingChunks} />
          </div>
        )}
      </div>
    </div>
  );
});

export const ThinkingBubble: React.FC = () => (
  <div className="flex w-full justify-start mb-4 animate-pulse">
    <div className="bg-slate-900/50 border-l-2 border-orange-500/30 px-4 py-3 flex items-center space-x-2">
      <span className="text-orange-500 font-mono text-xs blink">_VALIDATING_SOURCES</span>
      <div className="flex space-x-1">
        <div className="w-1 h-1 bg-orange-500 rounded-full typing-dot"></div>
        <div className="w-1 h-1 bg-orange-500 rounded-full typing-dot"></div>
        <div className="w-1 h-1 bg-orange-500 rounded-full typing-dot"></div>
      </div>
    </div>
  </div>
);