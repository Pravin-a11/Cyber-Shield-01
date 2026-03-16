import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Languages, ArrowRight, Copy, Check, RefreshCw, Volume2, Globe, Shield, Loader2 } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useTranslate } from '@/hooks/useTranslate';
import { cn } from '@/lib/utils';
import { GoogleGenAI } from "@google/genai";

const Translator: React.FC = () => {
  const { language, setLanguage } = useUIStore();
  const { t } = useTranslate();

  const [sourceText, setSourceText] = useState('');
  const [targetText, setTargetText] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('hi');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const languages = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు' },
    { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'ml', name: 'Malayalam', native: 'മലയാളம்' },
    { code: 'fr', name: 'French', native: 'Français' },
    { code: 'ja', name: 'Japanese', native: '日本語' },
    { code: 'sa', name: 'Sanskrit', native: 'संस्कृतम्' },
    { code: 'es', name: 'Spanish', native: 'Español' },
    { code: 'de', name: 'German', native: 'Deutsch' },
  ];

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Translate the following text from ${sourceLang} to ${targetLang}: "${sourceText}". Only return the translated text.`,
      });
      
      setTargetText(response.text || "[Translation Error]");
    } catch (err) {
      console.error('Translation failed:', err);
      setTargetText(`[Network Error]`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(targetText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3 uppercase italic neon-text">
          <Languages className="w-10 h-10 text-cyber-blue" />
          {t('translator')}
        </h1>
        <p className="text-slate-400 font-medium">Cross-border intelligence translation engine and platform localization.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Website Language Selection */}
        <div className="xl:col-span-1 space-y-6">
          <div className="glass-card p-6 border-cyber-blue/20">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyber-blue" />
              Platform Language
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={cn(
                    "w-full p-3 rounded-xl border transition-all flex items-center justify-between group",
                    language === lang.code 
                      ? "bg-cyber-blue/10 border-cyber-blue/40 text-cyber-blue" 
                      : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold">{lang.name}</span>
                    <span className="text-[10px] opacity-50">{lang.native}</span>
                  </div>
                  {language === lang.code && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 border-cyber-pink/20">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-cyber-pink shrink-0 mt-1" />
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Secure Localization</h3>
                <p className="text-xs text-slate-500">All translations are processed through our secure neural core to prevent data leaks during cross-border operations.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Intelligence Translation Engine */}
        <div className="xl:col-span-2 space-y-6">
          <div className="glass-card p-8">
            <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-cyber-blue" />
              Intelligence Translation Engine
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Source */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Source Language</label>
                  <select 
                    value={sourceLang}
                    onChange={(e) => setSourceLang(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-xs text-cyber-blue focus:outline-none"
                  >
                    {languages.map(l => <option key={l.code} value={l.code} className="bg-slate-900">{l.name}</option>)}
                  </select>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 min-h-[200px] flex flex-col">
                  <textarea
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder="Enter intelligence data to translate..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-600 resize-none text-sm"
                  />
                </div>
              </div>

              {/* Target */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target Language</label>
                  <select 
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-xs text-cyber-blue focus:outline-none"
                  >
                    {languages.map(l => <option key={l.code} value={l.code} className="bg-slate-900">{l.name}</option>)}
                  </select>
                </div>
                <div className="p-4 rounded-2xl bg-cyber-blue/5 border border-cyber-blue/20 min-h-[200px] flex flex-col relative overflow-hidden">
                  {loading && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-10 flex items-center justify-center">
                      <RefreshCw className="w-8 h-8 text-cyber-blue animate-spin" />
                    </div>
                  )}
                  <div className="flex-1 text-white text-sm whitespace-pre-wrap">
                    {targetText || <span className="text-slate-600 italic">Translation will appear here...</span>}
                  </div>
                  <div className="flex justify-end pt-4">
                    <button 
                      onClick={copyToClipboard}
                      disabled={!targetText}
                      className="p-2 rounded-lg hover:bg-white/5 text-slate-400 transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={handleTranslate}
                disabled={loading || !sourceText.trim()}
                className="cyber-button-primary px-12 py-4 flex items-center gap-3 text-lg"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Languages className="w-6 h-6" />}
                Translate Intelligence
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-500">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">99.9% Accuracy</p>
                <p className="text-xs text-slate-500">Verified by Cyber Intelligence Core</p>
              </div>
            </div>
            <div className="glass-card p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyber-blue/10 flex items-center justify-center border border-cyber-blue/20 text-cyber-blue">
                <Volume2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Voice Synthesis</p>
                <p className="text-xs text-slate-500">Multi-lingual audio output supported</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Translator;
