import React, { useState } from 'react';
import { Fish, X, Send } from 'lucide-react';
import { submitCatchReport } from '../services/apiService';

export default function CatchReportModal({ isOpen, onClose, userLocation, selectedLang, onCatchSubmitted }) {
  const [species, setSpecies] = useState('Indian Mackerel');
  const [quantityKg, setQuantityKg] = useState('75');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await submitCatchReport({
        species,
        quantityKg: parseFloat(quantityKg) || 50,
        lat: userLocation?.lat || 13.0827,
        lng: userLocation?.lng || 80.2707,
        pfzId: 'pfz-tn-01',
        langCode: selectedLang
      });

      if (onCatchSubmitted) {
        onCatchSubmitted(res.message, res.updatedPfzData);
      }
      onClose();
    } catch (err) {
      console.error("Catch report submit error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-ocean-900 border border-cyan-500/30 w-full max-w-md rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <Fish className="w-5 h-5" />
            <h3 className="font-bold text-sm text-slate-100">Crowdsourced Fish Catch Logger</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Target Fish Species</label>
            <select
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              className="w-full bg-ocean-850 border border-slate-700 rounded-xl p-2.5 text-slate-100 outline-none focus:border-cyan-400"
            >
              <option value="Indian Mackerel">Indian Mackerel (காணாங் கெளுத்தி)</option>
              <option value="Oil Sardines">Oil Sardines (மத்தி)</option>
              <option value="Yellowfin Tuna">Yellowfin Tuna (சூரை)</option>
              <option value="Seer Fish / Kingfish">Seer Fish / Surmai (வஞ்சிரம்)</option>
              <option value="Tiger Prawns">Tiger Prawns / Shrimp (இறால்)</option>
              <option value="Hilsa">Hilsa (ইলিশ / হিলসা)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Catch Quantity (Kilograms / kg)</label>
            <input
              type="number"
              value={quantityKg}
              onChange={(e) => setQuantityKg(e.target.value)}
              className="w-full bg-ocean-850 border border-slate-700 rounded-xl p-2.5 text-slate-100 outline-none focus:border-cyan-400"
              placeholder="e.g. 75"
              min="1"
              required
            />
          </div>

          <div className="bg-ocean-950 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div>GPS Location: <span className="text-cyan-300 font-mono">({userLocation?.lat || 13.08}, {userLocation?.lng || 80.27})</span></div>
            <div>Impact: <span className="text-emerald-400">Re-indexes local PFZ favourability (+5%) in real-time</span></div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? "Logging..." : "Submit Catch Data"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
