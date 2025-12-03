import React, { useState, useRef, useEffect } from 'react';
import { Attachment } from '../types';

interface ChatInputProps {
  onSend: (message: string, attachment?: Attachment) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((input.trim() || attachment) && !disabled) {
      onSend(input.trim(), attachment || undefined);
      setInput('');
      setAttachment(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert(`Файл слишком большой. Максимальный размер: ${MAX_FILE_SIZE_MB}MB`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Content = base64String.split(',')[1];
      setAttachment({
        base64: base64Content,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [input]);

  return (
    <div className="bg-[#0b1120] border-t border-slate-800 p-2 md:p-4 sticky bottom-0 z-20">
      <div className="max-w-4xl mx-auto relative">
        {/* Attachment Preview */}
        {attachment && (
           <div className="absolute -top-12 left-0 bg-slate-800 border border-slate-700 rounded-t-md px-3 py-1 flex items-center gap-2 text-xs text-indigo-300">
             <span className="font-mono">📎 Image Attached (Vision Ready)</span>
             <button onClick={removeAttachment} className="hover:text-red-400">✕</button>
           </div>
        )}

        <div className={`
          relative flex items-start gap-0 bg-[#020617] border rounded-sm px-2 py-2 shadow-2xl transition-all
          ${disabled ? 'border-slate-800 opacity-50' : 'border-slate-700 focus-within:border-orange-500/50'}
        `}>
          <div className="pt-3 pl-2 pr-2 select-none text-orange-500 font-mono font-bold text-sm">
            crawl4ai@validator:~#
          </div>
          
          {/* File Input (Hidden) */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept="image/*" 
            className="hidden" 
          />

          <button
            type="button"
            onClick={triggerFileSelect}
            className="mt-2 mr-2 text-slate-500 hover:text-indigo-400 transition-colors"
            title="Прикрепить скан/изображение для анализа"
            disabled={disabled}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
            </svg>
          </button>

          <form onSubmit={handleSubmit} className="flex-1 flex items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Введите URL или запрос. Нажмите "Скрепку" для анализа сканов.'
              className="w-full bg-transparent border-none outline-none resize-none py-2 max-h-[120px] text-slate-200 placeholder-slate-600 font-mono text-sm leading-relaxed"
              rows={1}
              disabled={disabled}
              spellCheck={false}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={(!input.trim() && !attachment) || disabled}
              className={`mb-1 p-1.5 rounded-sm transition-all duration-200 flex-shrink-0 ml-2
                ${(input.trim() || attachment) && !disabled 
                  ? 'text-orange-400 hover:text-orange-200 hover:bg-orange-900/30' 
                  : 'text-slate-700 cursor-not-allowed'
                }`}
            >
              <span className="font-mono text-xs font-bold">[RUN]</span>
            </button>
          </form>
        </div>
        
        <div className="flex justify-between items-center mt-2 px-1 opacity-60 hover:opacity-100 transition-opacity">
           <div className="text-[10px] text-slate-500 font-mono flex gap-3">
             <span className="text-green-600">● SYSTEM_READY</span>
             <span>ReputationCheck</span>
             <span>DocExtraction</span>
             <span>GoogleVision</span>
           </div>
           <div className="text-[10px] text-slate-600 font-mono">
             v2.2-stable
           </div>
        </div>
      </div>
    </div>
  );
};