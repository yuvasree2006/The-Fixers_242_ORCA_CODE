import React from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';

export default function VoiceNoticeBanner({ isSupported, onClose, warningText }) {
  if (isSupported) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between text-xs text-amber-200">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          {warningText || "Voice mode unavailable in this browser — Chrome or Edge recommended. Text mode is fully functional."}
        </span>
      </div>
      <button 
        onClick={onClose}
        className="p-1 hover:bg-amber-500/20 rounded-lg text-amber-400 transition-colors"
        title="Dismiss notice"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
