import React from 'react';
import { Shield, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC<{ theme?: 'light' | 'dark' }> = ({ theme = 'dark' }) => {
  const isDark = theme === 'dark';

  return (
    <footer className={`w-full text-xs py-12 px-4 sm:px-6 lg:px-8 font-serif-luxury relative z-10 transition-colors duration-300 ${
      isDark
        ? 'bg-[#0A0810] border-t border-[#3A2E52]/60 text-neutral-400'
        : 'bg-slate-100/90 border-t border-slate-200/80 text-slate-600'
    }`}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand Col */}
        <div className="space-y-3 md:col-span-1">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
              isDark 
                ? 'bg-neutral-900 border-[#C77DFF]/30' 
                : 'bg-sky-50 border-sky-200'
            }`}>
              <Shield className={`w-4 h-4 ${isDark ? 'text-[#C77DFF]' : 'text-sky-600'}`} />
            </div>
            <span className={`font-bold tracking-tight text-base font-serif-luxury ${isDark ? 'text-white' : 'text-slate-900'}`}>INCIDENT AI</span>
          </div>
          <p className={`${isDark ? 'text-neutral-400' : 'text-slate-500'} leading-relaxed font-sans text-xs`}>
            AI-powered log analysis & root-cause intelligence platform. Real-time anomaly detection, timestamp tokenization, and causal reasoning with NVIDIA Nemotron LLM.
          </p>
          <div className={`flex items-center gap-2 pt-2 text-[11px] font-mono ${
            isDark ? 'text-[#C77DFF]' : 'text-emerald-700'
          }`}>
            <span className={`w-2 h-2 rounded-full animate-pulse ${isDark ? 'bg-[#C77DFF]' : 'bg-emerald-500'}`}></span>
            <span>FastAPI & NVIDIA AI Pipeline Operational</span>
          </div>
        </div>

        {/* Security / Analysis Features */}
        <div>
          <h4 className={`font-semibold uppercase tracking-wider text-[11px] mb-3 font-serif-luxury ${isDark ? 'text-white' : 'text-slate-900'}`}>Incident Intelligence Core</h4>
          <ul className="space-y-2 font-sans text-xs">
            <li className="flex items-center gap-1.5"><CheckCircle2 className={`w-3.5 h-3.5 ${isDark ? 'text-[#C77DFF]' : 'text-sky-600'}`} /> Parsed Log Stream Ingestion</li>
            <li className="flex items-center gap-1.5"><CheckCircle2 className={`w-3.5 h-3.5 ${isDark ? 'text-[#C77DFF]' : 'text-sky-600'}`} /> Heuristic Error & Anomaly Radar</li>
            <li className="flex items-center gap-1.5"><CheckCircle2 className={`w-3.5 h-3.5 ${isDark ? 'text-[#C77DFF]' : 'text-sky-600'}`} /> NVIDIA Nemotron Root-Cause AI</li>
            <li className="flex items-center gap-1.5"><CheckCircle2 className={`w-3.5 h-3.5 ${isDark ? 'text-[#C77DFF]' : 'text-sky-600'}`} /> Chronological Event Timechain</li>
          </ul>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className={`font-semibold uppercase tracking-wider text-[11px] mb-3 font-serif-luxury ${isDark ? 'text-white' : 'text-slate-900'}`}>Console Modules</h4>
          <ul className="space-y-2 font-serif-luxury text-xs">
            <li><a href="/console" className={`transition-colors ${isDark ? 'hover:text-[#C77DFF]' : 'hover:text-sky-700'}`}>01 / Live Feed</a></li>
            <li><a href="/console" className={`transition-colors ${isDark ? 'hover:text-[#C77DFF]' : 'hover:text-sky-700'}`}>02 / Threat Detection</a></li>
            <li><a href="/console" className={`transition-colors ${isDark ? 'hover:text-[#C77DFF]' : 'hover:text-sky-700'}`}>03 / Model Guard</a></li>
            <li><a href="/console" className={`transition-colors ${isDark ? 'hover:text-[#C77DFF]' : 'hover:text-sky-700'}`}>04 / Event Timechain</a></li>
            <li><a href="/console" className={`transition-colors ${isDark ? 'hover:text-[#C77DFF]' : 'hover:text-sky-700'}`}>05 / Investigation Hub</a></li>
          </ul>
        </div>

        {/* Technical Architecture */}
        <div>
          <h4 className={`font-semibold uppercase tracking-wider text-[11px] mb-3 font-serif-luxury ${isDark ? 'text-white' : 'text-slate-900'}`}>Engine Architecture</h4>
          <p className={`${isDark ? 'text-neutral-400' : 'text-slate-500'} mb-3 font-sans text-xs`}>High-throughput log parser connected to FastAPI backend on port 8000 with NVIDIA AI endpoints.</p>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 border rounded text-[10px] font-mono shadow-2xs ${
              isDark 
                ? 'bg-neutral-900 border-[#3A2E52] text-neutral-300' 
                : 'bg-white border-slate-200 text-slate-700'
            }`}>FastAPI v0.110</span>
            <span className={`px-2 py-1 border rounded text-[10px] font-mono shadow-2xs ${
              isDark 
                ? 'bg-neutral-900 border-[#3A2E52] text-neutral-300' 
                : 'bg-white border-slate-200 text-slate-700'
            }`}>NVIDIA Nemotron 3</span>
          </div>
        </div>

      </div>

      <div className={`max-w-7xl mx-auto mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-sans ${
        isDark 
          ? 'border-[#2A2138] text-neutral-500' 
          : 'border-slate-200/80 text-slate-500'
      }`}>
        <p>© 2026 Incident AI Inc. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <a href="#" className={`transition-colors ${isDark ? 'hover:text-[#C77DFF]' : 'hover:text-slate-800'}`}>Privacy Policy</a>
          <span>•</span>
          <a href="#" className={`transition-colors ${isDark ? 'hover:text-[#C77DFF]' : 'hover:text-slate-800'}`}>Terms of Service</a>
          <span>•</span>
          <a href="#" className={`transition-colors ${isDark ? 'hover:text-[#C77DFF]' : 'hover:text-slate-800'}`}>System Status</a>
        </div>
      </div>
    </footer>
  );
};
