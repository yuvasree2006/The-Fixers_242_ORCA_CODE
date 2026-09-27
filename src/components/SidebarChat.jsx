import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Volume2, VolumeX, Sparkles, MessageSquare, Trash2, Bot, User, HelpCircle } from 'lucide-react';
import { voiceService } from '../services/voiceService';
export default function SidebarChat({ 
  messages, 
  onSendMessage, 
  selectedLang, 
  speechLang,
  uiDict, 
  isLoading,
  onClearChat,
  onReplayAudio,
}) {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const messagesEndRef = useRef(null);

  const ui = uiDict.ui || {};

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleMicClick = () => {
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    voiceService.startListening({
      speechLang,
      onResult: (transcript) => {
        setInputText(transcript);
      },
      onError: (err) => {
        console.warn("Speech error:", err);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      }
    });
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim(), isMuted);
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full bg-ocean-900/60 border-r border-slate-800/80">
      {/* Top Sidebar Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-ocean-950/50 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-xs text-slate-200 uppercase tracking-wider">
            Conversational Agent Feed
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Mute/Unmute Audio toggle */}
          <button
            onClick={() => {
              const newMute = !isMuted;
              setIsMuted(newMute);
              if (newMute) voiceService.stopSpeaking();
            }}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              isMuted 
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'
            }`}
            title={isMuted ? "Audio Output Muted" : "Audio Output Active"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Clear history */}
          <button
            onClick={onClearChat}
            className="p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 hover:bg-slate-700/60 text-slate-400 text-xs transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'bot' && (
              <div className="w-7 h-7 rounded-lg bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <Bot className="w-4 h-4 text-cyan-300" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-cyan-600/25 border border-cyan-500/40 text-slate-100 rounded-tr-none shadow-md'
                  : 'bg-ocean-800/80 border border-slate-700/70 text-slate-200 rounded-tl-none shadow-md'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
              
              {/* Bot message replay audio button */}
              {msg.sender === 'bot' && (
                <div className="mt-2 pt-2 border-t border-slate-700/40 flex items-center justify-between">
                  <button
                    onClick={() => onReplayAudio(msg.text)}
                    className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>{ui.replayAudio || "Replay Voice"}</span>
                  </button>
                  <span className="text-[10px] text-slate-500">{msg.time || ''}</span>
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4 text-blue-300" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2.5 items-center text-xs text-cyan-400 bg-cyan-950/40 p-2.5 rounded-xl border border-cyan-500/30 animate-pulse">
            <Bot className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
            <span>Multi-Agent Reasoning Pipeline active (100% in-browser)...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Voice listening active indicator */}
      {isListening && (
        <div className="bg-cyan-950/90 border-t border-cyan-500/40 px-3 py-2 flex items-center justify-between text-xs text-cyan-300 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-medium animate-pulse">{ui.listeningText || "Listening... Speak your query"}</span>
          </div>
          <button
            onClick={() => {
              voiceService.stopListening();
              setIsListening(false);
            }}
            className="text-[10px] underline text-cyan-400 hover:text-cyan-200"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Chat Input Bar */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-ocean-950/70 shrink-0">
        <div className="relative flex items-center gap-2">
          {/* Microphone Button */}
          <button
            type="button"
            onClick={handleMicClick}
            className={`p-2.5 rounded-xl border transition-all shrink-0 ${
              isListening
                ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse'
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'
            }`}
            title="Toggle Voice Input (Web Speech API)"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Editable Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={ui.typeOrSpeakPlaceholder || "Type question or click mic..."}
            className="flex-1 bg-ocean-850 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all shadow-inner"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-white transition-all shrink-0 shadow-md shadow-cyan-600/20"
            title="Send Query"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-slate-500 mt-1.5 text-center">
          Voice input editable before sending • 100% key-free local execution
        </p>
      </form>
    </div>
  );
}
