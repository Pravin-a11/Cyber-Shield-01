import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, Bot, User, X, Minimize2, Maximize2, Loader2, Shield, Mic, MicOff, Volume2, Languages } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useTranslate } from '@/hooks/useTranslate';
import { cn } from '@/lib/utils';
import { GoogleGenAI } from "@google/genai";

const AIAssistant: React.FC = () => {
  const { language } = useUIStore();
  const { t } = useTranslate();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ role: 'bot', text: t('ai_greeting') }]);
    } else {
      // Update existing greeting if it's the only message and text has changed
      setMessages(prev => {
        if (prev.length === 1 && prev[0].role === 'bot') {
          const newGreeting = t('ai_greeting');
          if (prev[0].text === newGreeting) return prev;
          return [{ role: 'bot', text: newGreeting }];
        }
        return prev;
      });
    }
  }, [language, t]);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMsg,
        config: {
          systemInstruction: `You are CyberShield AI, an advanced cybercrime investigation assistant. 
          Respond in ${language === 'hi' ? 'Hindi' : 'English'}.
          Provide technical, concise, and helpful information about cyber security, fraud prevention, and investigation procedures.`,
        }
      });
      
      const botResponse = response.text || "I'm sorry, I couldn't process that request.";
      setMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
      
    } catch (err) {
      console.error('AI Error:', err);
      setMessages(prev => [...prev, { role: 'bot', text: 'Error connecting to intelligence core. Please check your connection.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[1000]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              "glass-card flex flex-col shadow-[0_0_50px_var(--accent-color)]/20 overflow-hidden transition-all duration-300 bg-[var(--card-bg)] border-[var(--border-color)]",
              isMinimized ? "h-16 w-64" : "h-[500px] w-[400px]"
            )}
          >
            {/* Header */}
            <div className="p-4 border-b border-[var(--border-color)] bg-[var(--accent-color)]/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-color)]/20 flex items-center justify-center border border-[var(--accent-color)]/30">
                  <Bot className="w-5 h-5 text-[var(--accent-color)]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--accent-color)] tracking-tight">CyberShield AI</h4>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-[var(--text-secondary)] uppercase font-bold">{t('neural_core_active')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setIsMinimized(!isMinimized)} className="p-1.5 hover:bg-[var(--border-color)] rounded-lg transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-[var(--border-color)] rounded-lg transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                  {messages.map((msg, i) => (
                    <div key={i} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "")}>
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        msg.role === 'bot' ? "bg-[var(--accent-color)]/10 text-[var(--accent-color)]" : "bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-color)]"
                      )}>
                        {msg.role === 'bot' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                      </div>
                      <div className={cn(
                        "max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed relative group",
                        msg.role === 'bot' ? "bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-tl-none" : "bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 text-[var(--text-primary)] rounded-tr-none"
                      )}>
                        {msg.text}
                        {msg.role === 'bot' && (
                          <button 
                            onClick={() => speak(msg.text)}
                            className="absolute -right-8 top-0 p-1.5 text-[var(--text-secondary)] hover:text-[var(--accent-color)] opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--accent-color)]/10 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-[var(--accent-color)] animate-spin" />
                      </div>
                      <div className="bg-[var(--bg-primary)] p-3 rounded-2xl rounded-tl-none border border-[var(--border-color)]">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-[var(--accent-color)]/40 rounded-full animate-bounce" />
                          <div className="w-1.5 h-1.5 bg-[var(--accent-color)]/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <div className="w-1.5 h-1.5 bg-[var(--accent-color)]/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-primary)]">
                  <div className="relative flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder={t('ask_ai_placeholder')}
                        className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl pl-4 pr-12 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-color)]/50 transition-all placeholder:text-[var(--text-secondary)]"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                      />
                      <button 
                        onClick={handleSend}
                        className="absolute right-2 top-2 p-2 bg-[var(--accent-color)] text-white rounded-lg hover:shadow-[0_0_15px_var(--accent-color)] transition-all"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={toggleListening}
                      className={cn(
                        "p-3 rounded-xl border transition-all",
                        isListening 
                          ? "bg-red-500/20 border-red-500 text-red-500 animate-pulse" 
                          : "bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--border-color)] hover:text-[var(--text-primary)]"
                      )}
                    >
                      {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-2xl bg-[var(--accent-color)] flex items-center justify-center shadow-[0_0_30px_var(--accent-color)]/40 group relative"
        >
          <div className="absolute inset-0 rounded-2xl bg-[var(--accent-color)] animate-ping opacity-20" />
          <MessageSquare className="w-8 h-8 text-white" />
        </motion.button>
      )}
    </div>
  );
};

export default AIAssistant;
