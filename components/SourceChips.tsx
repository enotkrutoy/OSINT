import React from 'react';
import { GroundingChunk } from '../types';

interface SourceChipsProps {
  sources: GroundingChunk[];
}

const getHostname = (uri?: string): string => {
  if (!uri) return 'unknown';
  try {
    return new URL(uri).hostname;
  } catch (e) {
    return 'invalid-url';
  }
};

export const SourceChips: React.FC<SourceChipsProps> = ({ sources }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <div className="w-full text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1">
        ИСТОЧНИКИ ДАННЫХ
      </div>
      {sources.map((source, idx) => {
        const uri = source.web?.uri;
        const title = source.web?.title || "Веб-источник";
        const hostname = getHostname(uri);

        if (!uri) return null;

        return (
          <a
            key={`${uri}-${idx}`}
            href={uri}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 max-w-[200px] md:max-w-xs bg-slate-700/50 border border-slate-600 hover:border-indigo-400 hover:bg-slate-700 rounded-md px-3 py-2 transition-all duration-200 group"
          >
            <div className="bg-slate-800 text-indigo-400 rounded p-1 group-hover:text-indigo-300 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-medium text-slate-300 truncate block group-hover:text-white">
                {title}
              </span>
              <span className="text-[10px] text-slate-500 truncate block font-mono">
                {hostname}
              </span>
            </div>
          </a>
        );
      })}
    </div>
  );
};