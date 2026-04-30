'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { Bot, Send, X } from 'lucide-react';

interface ChatMessage {
  id: number;
  role: 'assistant' | 'user';
  text: string;
}

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
}

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    role: 'assistant',
    text: 'Welcome to ZLon concierge. Tell me what you need help with today.',
  },
];

export function ChatBot({ isOpen, onClose }: ChatBotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draftMessage, setDraftMessage] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleSendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextMessage = draftMessage.trim();
    if (!nextMessage) {
      return;
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: Date.now(),
        role: 'user',
        text: nextMessage,
      },
      {
        id: Date.now() + 1,
        role: 'assistant',
        text: 'Thanks. A ZLon support specialist can help with bookings, payments, locations, and account questions.',
      },
    ]);
    setDraftMessage('');
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 px-4 pb-4 pt-6 sm:items-center sm:py-6">
      <button
        type="button"
        aria-label="Close customer support chat"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="chatbot-title"
        className="relative flex max-h-[min(720px,calc(100vh-2rem))] w-full max-w-sm flex-col overflow-hidden rounded-t-[2rem] border border-white/10 bg-white text-black shadow-[0_24px_60px_rgba(0,0,0,0.35)] sm:rounded-[2rem]"
      >
        <header className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white">
              <Bot className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 id="chatbot-title" className="truncate text-sm font-bold tracking-tight">
                ZLon Concierge
              </h2>
              <p className="text-xs font-medium text-gray-500">Customer support</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-black"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 px-5 py-5">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === 'user'
                    ? 'bg-black text-white'
                    : 'border border-gray-200 bg-white text-gray-800'
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendMessage} className="flex items-center gap-2 border-t border-gray-100 bg-white p-4">
          <label htmlFor="chatbot-message" className="sr-only">
            Message
          </label>
          <input
            id="chatbot-message"
            type="text"
            value={draftMessage}
            onChange={(event) => setDraftMessage(event.target.value)}
            placeholder="Ask ZLon support..."
            className="min-w-0 flex-1 rounded-full bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
          <button
            type="submit"
            aria-label="Send message"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!draftMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </section>
    </div>
  );
}
