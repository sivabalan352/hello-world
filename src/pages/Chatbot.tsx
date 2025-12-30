import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { sendMessageToAI } from '../services/aiService';
import { Button } from '../components/ui/Button';
import { Bot, Send, User } from 'lucide-react';

export const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hello! I am your campus AI assistant. Ask me anything about college life, study tips, or campus events!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const aiResponseContent = await sendMessageToAI([...messages, userMessage]);
      const aiMessage: ChatMessage = { role: 'assistant', content: aiResponseContent };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col bg-white rounded-lg shadow overflow-hidden">
      <div className="bg-primary-600 p-4 text-white flex items-center gap-2">
        <Bot className="h-6 w-6" />
        <h2 className="text-lg font-semibold">Campus AI Assistant</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
              msg.role === 'assistant' ? 'bg-primary-100 text-primary-600' : 'bg-gray-200 text-gray-600'
            }`}>
              {msg.role === 'assistant' ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
            </div>
            <div className={`max-w-[80%] rounded-lg p-3 ${
              msg.role === 'user' 
                ? 'bg-primary-600 text-white rounded-br-none' 
                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-start gap-3">
             <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
              <Bot className="h-5 w-5" />
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3 rounded-bl-none shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about exams, events, or advice..."
            className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};
