import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { agentRunner } from './services/agentService';
import { sessionService } from './services/sessionService';
import { Message, MessageRole, SessionState, Attachment } from './types';
import { ChatMessage, ThinkingBubble } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { ScannerTool } from './components/ScannerTool';

const App: React.FC = () => {
  const [sessionState, setSessionState] = useState<SessionState>({
    sessionId: '',
    messages: [],
    status: 'idle'
  });
  const [showScannerTool, setShowScannerTool] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize session (load from storage or create new)
  useEffect(() => {
    // Only init if no session ID yet
    if (!sessionState.sessionId) {
        initSession();
    }
  }, []);

  const initSession = () => {
    // Attempt to load last session from localStorage via service logic (simplified for this demo)
    // For now, we just create a new one for clean state or load if exists
    // In a real app, we'd check URL params or a "load last" flag
    const newSessionId = sessionService.createSession();
    
    const greeting: Message = {
      id: uuidv4(),
      role: MessageRole.ASSISTANT,
      content: `### 🕷️ Crawl4AI Validator Ready
**Модули:** Extraction + Reputation Guard + Google Vision
**Цель:** Поиск, Валидация и Извлечение Документов.

**Новые возможности:**
*   **🛡️ Reputation Check:** Я проверяю надежность источников (Official vs Scam).
*   **👁️ Document OCR:** Загрузите изображение/скан (через 📎), чтобы извлечь текст и таблицы.
*   **📡 DOM Auditor:** Используйте кнопку **SCANNER** сверху для генерации JS-инъекции.

*Введите запрос или прикрепите документ...*`,
      timestamp: Date.now()
    };
    
    sessionService.addMessage(newSessionId, greeting);

    setSessionState({
      sessionId: newSessionId,
      messages: [greeting],
      status: 'idle'
    });
  };

  const handleWipeSession = () => {
    if (sessionState.sessionId) {
      agentRunner.resetSession(sessionState.sessionId);
      sessionService.clearSession(sessionState.sessionId);
      // Force new session creation
      const newSessionId = sessionService.createSession();
      // Re-add greeting
      const greeting: Message = {
        id: uuidv4(),
        role: MessageRole.ASSISTANT,
        content: `### 🔄 Session Wiped
Система перезагружена. Готов к новым задачам.`,
        timestamp: Date.now()
      };
      sessionService.addMessage(newSessionId, greeting);
      setSessionState({
        sessionId: newSessionId,
        messages: [greeting],
        status: 'idle'
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sessionState.messages, sessionState.status]);

  const handleSendMessage = async (content: string, attachment?: Attachment) => {
    if (!sessionState.sessionId) return;

    const userMsg: Message = {
      id: uuidv4(),
      role: MessageRole.USER,
      content,
      timestamp: Date.now(),
      attachment // Store attachment in message history
    };

    sessionService.addMessage(sessionState.sessionId, userMsg);
    
    setSessionState(prev => ({
      ...prev,
      messages: [...prev.messages, userMsg],
      status: 'thinking'
    }));

    try {
      const assistantMsgId = uuidv4();
      let currentAssistantMsg: Message = {
        id: assistantMsgId,
        role: MessageRole.ASSISTANT,
        content: '',
        timestamp: Date.now()
      };

      // Initial add of assistant message (empty) to UI
      setSessionState(prev => ({
          ...prev,
          messages: [...prev.messages, currentAssistantMsg]
      }));

      // Pass attachment to the agent runner
      const stream = agentRunner.call_agent_async(sessionState.sessionId, content, attachment);
      
      let isFirstChunk = true;

      for await (const chunk of stream) {
        if (isFirstChunk) {
           setSessionState(prev => ({ ...prev, status: 'streaming' }));
           isFirstChunk = false;
        }

        currentAssistantMsg = {
          ...currentAssistantMsg,
          content: chunk.text,
          groundingChunks: chunk.groundingChunks
        };

        // Safer state update: Find by ID and update, rather than index reliance
        setSessionState(prev => ({
            ...prev,
            messages: prev.messages.map(msg => 
                msg.id === assistantMsgId ? currentAssistantMsg : msg
            )
        }));
      }

      sessionService.addMessage(sessionState.sessionId, currentAssistantMsg);
      setSessionState(prev => ({ ...prev, status: 'idle' }));

    } catch (error) {
      console.error("Error in chat loop:", error);
      const errorMsg: Message = {
        id: uuidv4(),
        role: MessageRole.SYSTEM,
        content: "**[SYSTEM ERROR]** Ошибка обработки запроса или файла.",
        timestamp: Date.now()
      };
      sessionService.addMessage(sessionState.sessionId, errorMsg);
      setSessionState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMsg],
        status: 'error'
      }));
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0b1120] text-slate-300">
      {/* Header */}
      <header className="bg-[#0b1120] border-b border-slate-800 py-3 px-4 md:px-6 sticky top-0 z-30 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-orange-900/20 border border-orange-500/50 flex items-center justify-center text-orange-400 rounded-sm">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <path d="M2 12h20"></path>
               <path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"></path>
               <path d="M15 16h4v4h-4z"></path>
               <path d="M5 8a5 5 0 0 1 10 0v4"></path>
             </svg>
           </div>
           <div>
             <h1 className="font-bold text-slate-100 text-sm md:text-base leading-none tracking-widest font-mono">
               CRAWL4AI<span className="text-orange-500">_VALIDATOR</span>
             </h1>
             <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase font-mono mt-0.5">Vision & Reputation Mode</p>
           </div>
        </div>
        
        <div className="flex items-center gap-4">
           <button 
             onClick={() => setShowScannerTool(true)}
             className="text-[10px] md:text-xs font-mono font-bold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/20 px-3 py-1.5 border border-indigo-900/50 rounded-sm transition-colors flex items-center gap-2"
           >
             <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
             <span className="hidden md:inline">DOM_SCANNER</span>
           </button>
           
           <button 
             onClick={handleWipeSession}
             className="text-[10px] md:text-xs font-mono font-bold text-red-400 hover:text-red-300 hover:bg-red-900/20 px-3 py-1.5 border border-red-900/50 rounded-sm transition-colors flex items-center gap-2"
             title="Очистить и начать новый скан"
           >
             <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <polyline points="3 6 5 6 21 6"></polyline>
               <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
               <line x1="10" y1="11" x2="10" y2="17"></line>
               <line x1="14" y1="11" x2="14" y2="17"></line>
             </svg>
             <span className="hidden md:inline">СБРОС</span>
           </button>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth bg-[#0b1120] relative">
        <div className="max-w-4xl mx-auto flex flex-col min-h-full">
           <div className="flex-1 pb-4">
             {sessionState.messages.map((msg) => (
               <ChatMessage key={msg.id} message={msg} />
             ))}
             {sessionState.status === 'thinking' && <ThinkingBubble />}
             <div ref={messagesEndRef} />
           </div>
        </div>
      </main>

      {/* Input Area */}
      <ChatInput 
        onSend={handleSendMessage} 
        disabled={sessionState.status === 'thinking' || sessionState.status === 'streaming'} 
      />

      {/* Scanner Tool Modal */}
      {showScannerTool && <ScannerTool onClose={() => setShowScannerTool(false)} />}
    </div>
  );
};

export default App;