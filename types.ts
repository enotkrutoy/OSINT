export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface Attachment {
  base64: string;
  mimeType: string;
}

export interface AgentResponse {
  text: string;
  groundingChunks?: GroundingChunk[];
}

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  groundingChunks?: GroundingChunk[];
  isThinking?: boolean;
  attachment?: Attachment;
}

export interface SessionState {
  sessionId: string;
  messages: Message[];
  status: 'idle' | 'thinking' | 'streaming' | 'error';
}