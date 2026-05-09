'use client';

import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Bot, Send, X, MessageSquare } from 'lucide-react';

interface ChatMessage {
  id: number;
  role: 'assistant' | 'user';
  text: string;
}

interface ChatBotProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function ChatBot({ isOpen: externalIsOpen, onClose }: ChatBotProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: 'assistant',
      text: 'Welcome to ZLon concierge. Tell me what you need help with today.',
    },
  ]);
  const [draftMessage, setDraftMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHandoff, setIsHandoff] = useState(false);
  const messageIdRef = useRef(2);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isExpanded = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const handleClose = useCallback(() => {
    setInternalIsOpen(false);
    if (onClose) onClose();
  }, [onClose]);

  const handleOpen = useCallback(() => {
    setInternalIsOpen(true);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (!isExpanded) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, handleClose]);

  if (!isExpanded) {
    // Minimized state
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-lg transition-transform hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6"
        aria-label="Open chat"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    );
  }

  const handleSendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextMessage = draftMessage.trim();
    if (!nextMessage || isLoading || isHandoff) {
      return;
    }

    const userId = messageIdRef.current++;
    
    const newMessages: ChatMessage[] = [
      ...messages,
      {
        id: userId,
        role: 'user',
        text: nextMessage,
      },
    ];

    setMessages(newMessages);
    setDraftMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await response.json();
      
      if (data.text === 'TRIGGER_HANDOFF') {
        setIsHandoff(true);
      } else {
        const assistantId = messageIdRef.current++;
        setMessages((currentMessages) => [
          ...currentMessages,
          {
            id: assistantId,
            role: 'assistant',
            text: data.text || 'Sorry, I am having trouble connecting.',
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const assistantId = messageIdRef.current++;
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: assistantId,
          role: 'assistant',
          text: 'Sorry, I encountered an error.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white text-black shadow-2xl sm:bottom-6 sm:right-6">
      <header className="flex items-center justify-between gap-4 border-b border-gray-100 bg-black px-4 py-3 text-white">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-black">
            <Bot className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 id="chatbot-title" className="truncate text-sm font-bold tracking-tight">
              ZLon Concierge
            </h2>
            <p className="text-[10px] font-medium text-gray-300">Customer support</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close chat"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-300 transition-colors hover:bg-white/20 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="flex h-80 flex-col space-y-3 overflow-y-auto bg-gray-50 px-4 py-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                message.role === 'user'
                  ? 'bg-black text-white rounded-br-sm'
                  : 'border border-gray-200 bg-white text-gray-800 rounded-bl-sm'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
        {isLoading && !isHandoff && (
          <div className="flex justify-start">
            <div className="flex space-x-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 rounded-bl-sm">
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></div>
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></div>
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {isHandoff ? (
        <div className="border-t border-gray-100 bg-gray-50 p-4 text-center">
          <p className="text-sm font-semibold text-gray-900">Connecting you to the salon owner...</p>
          <p className="mt-1 text-xs text-gray-500">Please wait a moment.</p>
        </div>
      ) : (
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 border-t border-gray-100 bg-white p-3">
          <label htmlFor="chatbot-message" className="sr-only">
            Message
          </label>
          <input
            id="chatbot-message"
            type="text"
            value={draftMessage}
            onChange={(event) => setDraftMessage(event.target.value)}
            placeholder="Ask ZLon support..."
            disabled={isLoading}
            className="min-w-0 flex-1 rounded-full bg-gray-100 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
          />
          <button
            type="submit"
            aria-label="Send message"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!draftMessage.trim() || isLoading}
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      )}
    </div>
  );
}
