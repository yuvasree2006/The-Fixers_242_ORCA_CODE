import React from 'react';
import { Smartphone, X, Copy, Check } from 'lucide-react';

export default function FeaturePhoneModal({ isOpen, onClose, lastResponse, uiDict }) {
  const [copied, setCopied] = React.useState(false);
  if (!isOpen) return null;

  const responseText = lastResponse || "SMS Advisory: Ocean conditions normal. Nearest PFZ 18km East. Safety score 92/100.";

  const handleCopy = () => {
    navigator.clipboard.writeText(responseText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-cyan-400">
            <Smartphone className="w-5 h-5" />
            <h3 className="font-bold text-sm text-slate-100">SMS / IVR Feature Phone Mode</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feature Phone Mock Screen */}
        <div className="bg-emerald-950/40 border-2 border-emerald-600/40 p-4 rounded-2xl font-mono text-xs text-emerald-300 space-y-3 shadow-inner">
          <div className="flex items-center justify-between border-b border-emerald-800/60 pb-1.5 text-[10px] text-emerald-400">
            <span>[INCOIS-ISRO SMS SERVER]</span>
            <span>2G / SMS READY</span>
          </div>

          <div className="whitespace-pre-wrap leading-relaxed">
            {responseText}
          </div>

          <div className="pt-2 border-t border-emerald-800/60 text-[10px] text-emerald-400 flex items-center justify-between">
            <span>Reply 1 for Route | 2 for Weather</span>
            <span>160/160 CHARS</span>
          </div>
        </div>

        {/* Info & Copy Actions */}
        <p className="text-[11px] text-slate-400">
          Demonstrates low-bandwidth SMS/IVR broadcast accessibility for non-smartphone fishermen without internet.
        </p>

        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 py-2 px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied SMS Text" : "Copy SMS Payload"}</span>
          </button>
          <button
            onClick={onClose}
            className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
