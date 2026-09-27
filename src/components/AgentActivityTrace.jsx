import React from 'react';
import { Cpu, CheckCircle2, Loader2, Circle } from 'lucide-react';

export default function AgentActivityTrace({ planSteps, activeAgentIndex, uiDict }) {
  const steps = planSteps || [];
  const ui = uiDict.ui || {};

  return (
    <div className="glass-panel p-3.5 rounded-2xl border border-cyan-500/20 shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
          <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wider">
            {ui.agentTraceTitle || "Collaborative Agent Workflow Execution"}
          </h3>
        </div>
        <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/30">
          10 Agents Orchestrated
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {steps.map((step, idx) => {
          const isActive = idx === activeAgentIndex;
          const isDone = idx < activeAgentIndex || activeAgentIndex === steps.length;

          return (
            <div
              key={step.id || idx}
              className={`p-2.5 rounded-xl border text-xs transition-all duration-300 ${
                isActive
                  ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/20 glow-cyan scale-[1.02]'
                  : isDone
                  ? 'bg-ocean-850/60 border-slate-700/60 text-slate-300'
                  : 'bg-ocean-950/40 border-slate-800/60 text-slate-500 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5 mb-1">
                <span className="font-bold text-[11px] truncate flex items-center gap-1.5">
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : isActive ? (
                    <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  )}
                  <span className={isActive ? 'text-cyan-300' : isDone ? 'text-slate-200' : 'text-slate-500'}>
                    {step.agentName}
                  </span>
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-400 shrink-0 font-mono">
                  {step.role}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-1">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
