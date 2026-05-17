'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bot, Camera, Paperclip, Send, X } from 'lucide-react';
import Image from 'next/image';

interface ChatMessage {
  id: number;
  role: 'assistant' | 'user';
  text: string;
  image?: string;
}

export default function CustomerSupportPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: 'assistant',
      text: 'Welcome to ZLon Customer Care. How can we help you today? You can also upload photos if you need to provide proof for any issue.',
    },
  ]);
  const [draftMessage, setDraftMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHandoff, setIsHandoff] = useState(false);
  
  const messageIdRef = useRef(2);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleBack = () => {
    router.back();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();
  const triggerCameraInput = () => cameraInputRef.current?.click();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    const text = draftMessage.trim();
    if ((!text && !selectedImage) || isLoading || isHandoff) return;

    const userMsgId = messageIdRef.current++;
    const newUserMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      text: text || (selectedImage ? 'Sent an image' : ''),
      image: selectedImage || undefined,
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setDraftMessage('');
    const currentImage = selectedImage;
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: updatedMessages,
          image: currentImage 
        }),
      });

      const data = await response.json();

      if (data.text === 'TRIGGER_HANDOFF') {
        setIsHandoff(true);
      } else {
        const assistantId = messageIdRef.current++;
        setMessages(prev => [
          ...prev,
          {
            id: assistantId,
            role: 'assistant',
            text: data.text || 'I encountered an issue processing your request.',
          }
        ]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const assistantId = messageIdRef.current++;
      setMessages(prev => [
        ...prev,
        {
          id: assistantId,
          role: 'assistant',
          text: 'Sorry, I am having trouble connecting to the support server.',
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-white z-50">
      {/* Header */}
      <header className="flex-none flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),48px)] pb-4 border-b border-gray-100 bg-white z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleBack}
            className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Customer Care</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Online</span>
            </div>
          </div>
        </div>
        <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white shrink-0">
          <Bot className="w-5 h-5" />
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-gray-50/50">
        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {msg.image && (
                <div className="mb-2 relative w-48 h-48 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                  <Image 
                    src={msg.image} 
                    alt="Uploaded proof" 
                    fill 
                    sizes="(max-width: 480px) 192px, 192px"
                    className="object-cover"
                  />
                </div>
              )}
              {msg.text && (
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-black text-white rounded-br-sm' 
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'
                }`}>
                  {msg.text}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && !isHandoff && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex gap-1">
              <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer 
        className="flex-none bg-gray-50 border-t border-gray-100 p-4"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 20px)' }}
      >
        {isHandoff ? (
          <div className="py-4 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-sm font-bold text-gray-900">Connecting you to the salon owner...</p>
            <p className="text-xs text-gray-500 mt-1">Our team will be with you shortly.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedImage && (
              <div className="relative inline-block">
                <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-black">
                  <Image 
                    src={selectedImage} 
                    alt="Preview" 
                    fill 
                    sizes="(max-width: 480px) 80px, 80px"
                    className="object-cover"
                  />
                </div>
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-2 -right-2 bg-black text-white rounded-full p-1 shadow-md"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <div className="flex-1 bg-gray-100 rounded-full px-4 py-1.5 flex items-center gap-2 focus-within:ring-2 focus-within:ring-gray-200 transition-all">
                <input 
                  type="text" 
                  value={draftMessage}
                  onChange={(e) => setDraftMessage(e.target.value)}
                  placeholder="Describe your issue..."
                  className="flex-1 bg-transparent border-none focus:outline-none text-sm py-2 text-gray-900"
                  disabled={isLoading}
                />
                <div className="flex items-center gap-1">
                  <button 
                    type="button" 
                    onClick={triggerFileInput}
                    className="p-1.5 text-gray-500 hover:text-gray-900 transition-colors"
                    disabled={isLoading}
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button 
                    type="button" 
                    onClick={triggerCameraInput}
                    className="p-1.5 text-gray-500 hover:text-gray-900 transition-colors"
                    disabled={isLoading}
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <button 
                type="submit"
                disabled={(!draftMessage.trim() && !selectedImage) || isLoading}
                className="w-11 h-11 bg-black text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-900 transition-colors shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
        
        {/* Hidden File Inputs */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
        <input 
          type="file" 
          ref={cameraInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          capture="environment" 
          className="hidden" 
        />
      </footer>
    </div>
  );
}
