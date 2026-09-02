import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Lock, Terminal, BarChart2, ShieldCheck, Eye, Sparkles, Crosshair, ArrowRight, Activity } from 'lucide-react';
import { Footer } from '../../components/common/Footer';
import { InteractiveBackground } from '../../components/ui/InteractiveBackground';
import { RobotSection } from '../../components/ui/RobotSection';
import heroFull from '../../assets/hero-full.jpg';
import { useSession } from '../../context/SessionContext';

/* ─── animated counter ─── */
const AnimatedNumber: React.FC<{ target: number; suffix?: string; prefix?: string; decimals?: number }> = ({ target, suffix = '', prefix = '', decimals = 0 }) => {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !animated.current) {
        animated.current = true;
        const start = performance.now();
        const dur = 1800;
        const step = (now: number) => {
          const progress = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setVal(eased * target);
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{prefix}{decimals > 0 ? val.toFixed(decimals) : Math.round(val)}{suffix}</span>;
};

export interface LandingPageProps {
  onNext?: (view?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNext }) => {
  const headingWord1 = "INCIDENT";
  const headingWord2 = "AI";

  const { currentSession, openLogModal, backendConnected, user, openAuthModal, logoutUser } = useSession();

  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newRipple = { id: Date.now(), x, y };
    setRipples(prev => [...prev, newRipple]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);

    setTimeout(() => {
      if (onNext) onNext('feed');
    }, 250);
  };

  const letterContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.2
      }
    }
  };

  const letterAnimation = {
    hidden: { opacity: 0, y: 15, filter: 'blur(6px)' },
    show: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { type: 'spring' as const, stiffness: 90, damping: 12 }
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0810] text-[#F5F1FA] flex flex-col selection:bg-[#C77DFF]/25 selection:text-white relative font-serif-luxury overflow-x-hidden">
      
      {/* Cinematic Canvas Background (Obsidian & Electric Violet) */}
      <InteractiveBackground />

      {/* ═══════════════════════════════════════════════ HERO ═══════════════════════════════════════════════ */}
      <section className="relative min-h-0 flex items-start px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-12 lg:pb-16 overflow-hidden z-10">
        
        {/* FULL-BLEED POSTER BACKGROUND with violet atmospheric tint */}
        <div className="absolute inset-0 z-0">
          <img 
            src={heroFull} 
            alt="" 
            className="w-full h-full object-cover object-[70%_center] scale-[1.05]"
            style={{ filter: 'brightness(0.82) contrast(1.15) hue-rotate(250deg) saturate(1.2)' }}
          />
          {/* Dark violet gradient overlay on the left side for readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0810] via-[#0A0810]/85 to-transparent" />
          {/* Subtle top and bottom fade */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0810]/70 via-transparent to-[#0A0810]/90" />
        </div>

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start relative z-10">
          
          {/* LEFT SIDE (60%) */}
          <div className="lg:col-span-7 flex flex-col justify-start space-y-6 z-20 pt-2 sm:pt-3">
            
            {/* Pill Badge */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="inline-flex self-start items-center gap-2 px-4 py-1.5 rounded-full bg-black/80 border border-[#C77DFF]/40 text-xs text-[#C77DFF] shadow-[0_0_12px_rgba(199,125,255,0.25)] backdrop-blur-md"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E879F9] animate-pulse" />
              <span className="font-semibold font-sans tracking-widest uppercase text-[10px]">
                INCIDENT AI · REAL-TIME ANOMALY & ROOT-CAUSE ANALYSIS
              </span>
            </motion.div>

            {/* Title - Single Line: INCIDENT AI (Bigger & Bold) */}
            <div className="py-1 w-full overflow-visible">
              <motion.h1 
                variants={letterContainer}
                initial="hidden"
                animate="show"
                className="text-5xl sm:text-6xl md:text-7xl lg:text-7xl xl:text-8xl font-black tracking-tight leading-none whitespace-nowrap m-0 flex items-center gap-3 sm:gap-4 flex-wrap"
              >
                <span className="animated-title-gradient drop-shadow-[0_0_35px_rgba(245,241,250,0.35)]">
                  {"INCIDENT".split("").map((char, index) => (
                    <motion.span 
                      key={index}
                      variants={letterAnimation}
                      className="inline-block relative hover:scale-105 transition-transform duration-200"
                    >
                      {char}
                    </motion.span>
                  ))}
                </span>
                <span className="animated-title-gradient-accent drop-shadow-[0_0_40px_rgba(199,125,255,0.65)]">
                  {"AI".split("").map((char, index) => (
                    <motion.span 
                      key={`ai-${index}`}
                      variants={letterAnimation}
                      className="inline-block relative hover:scale-105 transition-transform duration-200"
                    >
                      {char}
                    </motion.span>
                  ))}
                </span>
              </motion.h1>
            </div>

            {/* Paragraph 1 - Clean text-left alignment to eliminate word gaps */}
            <motion.p 
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
              className="text-neutral-200 text-base sm:text-lg leading-relaxed font-sans font-normal text-left max-w-2xl"
            >
              Incident AI is an intelligent monitoring system that continuously analyzes application and infrastructure logs to detect anomalies, errors, and potential incidents in real time. Using AI-driven pattern recognition, it can identify critical issues, correlate events across multiple systems, reduce alert noise, and provide actionable insights to help teams diagnose and resolve incidents faster.
            </motion.p>

            {/* Paragraph 2 - Highlights with Target Icon */}
            <motion.div 
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
              className="flex items-start gap-4 p-4 rounded-2xl bg-[#15111F]/80 border border-[#3A2E52]/80 backdrop-blur-md max-w-2xl"
            >
              <div className="p-2 rounded-xl bg-[#C77DFF]/15 border border-[#C77DFF]/30 shrink-0 text-[#C77DFF] mt-0.5">
                <Crosshair className="w-5 h-5 animate-pulse" />
              </div>
              <p className="text-neutral-300 text-sm leading-relaxed font-sans font-light text-left">
                Equipped with <span className="text-[#E879F9] font-semibold font-mono">NVIDIA Nemotron LLM</span> root-cause synthesis, automated timeline reconstruction, and sub-millisecond anomaly tagging across distributed services.
              </p>
            </motion.div>

            {/* Active Session Badge */}
            {currentSession && (
              <div 
                className="p-3.5 rounded-2xl bg-gradient-to-r from-[#211438]/80 to-[#15111F]/90 border border-[#C77DFF]/40 flex items-center justify-between text-xs cursor-pointer hover:border-[#C77DFF] transition-all shadow-[0_0_20px_rgba(199,125,255,0.2)]"
                onClick={() => onNext && onNext('feed')}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C77DFF] animate-ping" />
                  <span className="text-neutral-200 font-sans">
                    Active Stream: <b className="text-white font-mono">{currentSession.fileName || currentSession.session_id.slice(0, 8)}</b> · {currentSession.total_logs} logs · <span className="text-[#E879F9] font-bold font-mono">{currentSession.detected_errors} anomalies</span>
                  </span>
                </div>
                <span className="text-[#C77DFF] font-mono font-bold flex items-center gap-1">Open Next →</span>
              </div>
            )}

            {/* CTA Button Row with LOG IN / SIGN UP Button */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 120, 
                damping: 15,
                delay: 1.0 
              }}
              className="pt-2 flex items-center gap-4 flex-wrap"
            >
              {/* PRIMARY LOG IN / SIGN UP BUTTON */}
              <button
                ref={buttonRef}
                onClick={(e) => {
                  if (user) {
                    handleButtonClick(e)
                  } else {
                    openAuthModal('login')
                  }
                }}
                className="group relative px-9 py-4 rounded-2xl bg-gradient-to-r from-[#C77DFF] via-[#A855F7] to-[#E879F9] text-black font-mono font-black tracking-widest text-base flex items-center justify-center gap-3 overflow-hidden shadow-[0_0_25px_rgba(199,125,255,0.4)] border border-[#C77DFF]/50 transition-all duration-300 hover:shadow-[0_0_45px_rgba(199,125,255,0.7)] hover:-translate-y-1 cursor-pointer active:scale-95 select-none"
                style={{ willChange: 'transform' }}
              >
                <span className="absolute inset-0 bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                <AnimatePresence>
                  {ripples.map(ripple => (
                    <span
                      key={ripple.id}
                      className="absolute rounded-full bg-white/40 pointer-events-none -translate-x-1/2 -translate-y-1/2 animate-[ripple_0.6s_ease-out]"
                      style={{
                        left: ripple.x,
                        top: ripple.y,
                        width: '100px',
                        height: '100px',
                      }}
                    />
                  ))}
                </AnimatePresence>

                <span className="relative z-10">{user ? 'ENTER CONSOLE' : 'LOG IN / SIGN UP'}</span>
                <ArrowRight className="w-5 h-5 text-black group-hover:translate-x-1.5 transition-transform duration-300 stroke-[2.5]" />
              </button>

              <button
                onClick={() => onNext && onNext('detect')}
                className="group relative px-7 py-4 rounded-2xl bg-[#15111F]/80 text-white font-mono font-bold tracking-wider text-sm flex items-center justify-center gap-3 overflow-hidden border border-[#3A2E52] transition-all duration-300 hover:border-[#C77DFF]/60 hover:bg-[#C77DFF]/15 hover:shadow-[0_0_25px_rgba(199,125,255,0.25)] hover:-translate-y-1 cursor-pointer active:scale-95 select-none backdrop-blur-sm"
                style={{ willChange: 'transform' }}
              >
                <Activity className="w-4 h-4 text-[#E879F9] group-hover:scale-110 transition-transform duration-300" />
                <span className="relative z-10">ANOMALY RADAR</span>
                <span className="transform transition-transform duration-300 group-hover:translate-x-1.5 font-sans font-bold">→</span>
              </button>
            </motion.div>

          </div>

          {/* RIGHT SIDE (40%) — Animated HUD overlay rings in Electric Violet */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.6, ease: "easeOut" }}
            className="lg:col-span-5 flex justify-center items-center"
          >
            <RobotSection />
          </motion.div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════ ROBOT / INTELLIGENCE CORE ═══════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative z-10 border-t border-[#2A2138] bg-[#0A0810]/90 flex flex-col items-center overflow-hidden">
        <div className="max-w-7xl mx-auto w-full flex flex-col items-center text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C77DFF]/15 border border-[#C77DFF]/40 text-xs text-[#C77DFF] font-mono font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#C77DFF] animate-pulse" />
            AUTONOMOUS MONITORING CORE
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white font-serif-luxury tracking-tight">
            Real-Time Threat Radar & Neural Telemetry
          </h2>
          <p className="text-neutral-400 max-w-2xl text-base font-sans font-light leading-relaxed">
            Live 3D telemetry matrix running continuous diagnostic sweeps, anomaly detection, and automated root-cause analysis.
          </p>
          <div className="w-full flex justify-center items-center pt-4">
            <RobotSection />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ FEATURES ═══════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 relative z-10 border-t border-[#2A2138] bg-[#0A0810]/70">
        <div className="max-w-6xl mx-auto space-y-20">

          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-serif-luxury">
              Engineered for High-Throughput Log Intelligence
            </h2>
            <div className="w-16 h-[2px] bg-[#C77DFF] mx-auto rounded-full shadow-[0_0_10px_#C77DFF]" />
            <p className="text-neutral-400 max-w-xl mx-auto text-base font-sans font-light leading-relaxed">
              Stream ingestion, regex log tokenization, heuristic anomaly radar, and NVIDIA Nemotron LLM root-cause synthesis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div 
              className="p-8 space-y-5 rounded-3xl border border-[#3A2E52]/80 bg-[#15111F]/70 backdrop-blur-md hover:border-[#C77DFF]/50 transition-all duration-300 group hover:-translate-y-1 cursor-pointer shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
              onClick={() => onNext && onNext('feed')}
            >
              <div className="w-14 h-14 rounded-2xl bg-[#C77DFF]/15 border border-[#C77DFF]/30 flex items-center justify-center text-[#C77DFF] group-hover:scale-110 transition-transform duration-500 shadow-[0_0_20px_rgba(199,125,255,0.15)]">
                <Terminal className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white font-serif-luxury">Regex Stream Tokenizer</h3>
              <p className="text-sm text-neutral-400 leading-relaxed font-sans font-light">
                High-speed log parsing with ISO timestamp extraction, component attribution, log level tagging, and multi-line stack trace grouping.
              </p>
              <div className="text-xs font-mono text-[#C77DFF] pt-1 flex items-center gap-1 font-semibold">Open Live Feed →</div>
            </div>

            <div 
              className="p-8 space-y-5 rounded-3xl border border-[#3A2E52]/80 bg-[#15111F]/70 backdrop-blur-md hover:border-[#E879F9]/50 transition-all duration-300 group hover:-translate-y-1 cursor-pointer shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
              onClick={() => onNext && onNext('detect')}
            >
              <div className="w-14 h-14 rounded-2xl bg-[#E879F9]/15 border border-[#E879F9]/30 flex items-center justify-center text-[#E879F9] group-hover:scale-110 transition-transform duration-500 shadow-[0_0_20px_rgba(232,121,249,0.15)]">
                <Cpu className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white font-serif-luxury">Heuristic Anomaly Radar</h3>
              <p className="text-sm text-neutral-400 leading-relaxed font-sans font-light">
                Automatic extraction of ERROR, CRITICAL, and FATAL exceptions alongside keyword scanning for timeouts and connection pool drops.
              </p>
              <div className="text-xs font-mono text-[#E879F9] pt-1 flex items-center gap-1 font-semibold">Open Threat Radar →</div>
            </div>

            <div 
              className="p-8 space-y-5 rounded-3xl border border-[#3A2E52]/80 bg-[#15111F]/70 backdrop-blur-md hover:border-[#C77DFF]/50 transition-all duration-300 group hover:-translate-y-1 cursor-pointer shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
              onClick={() => onNext && onNext('guard')}
            >
              <div className="w-14 h-14 rounded-2xl bg-[#C77DFF]/15 border border-[#C77DFF]/30 flex items-center justify-center text-[#C77DFF] group-hover:scale-110 transition-transform duration-500 shadow-[0_0_20px_rgba(199,125,255,0.15)]">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white font-serif-luxury">NVIDIA AI Synthesis</h3>
              <p className="text-sm text-neutral-400 leading-relaxed font-sans font-light">
                Deep causal reasoning engine classifying facts vs hypotheses, grounded log evidence citations, and step-by-step mitigation plans.
              </p>
              <div className="text-xs font-mono text-[#C77DFF] pt-1 flex items-center gap-1 font-semibold">Open Model Guard →</div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ STEPS ═══════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 relative z-10 bg-[#0A0810]/40">
        <div className="max-w-6xl mx-auto space-y-16">

          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-serif-luxury">
              Autonomous Triage Pipeline
            </h2>
            <div className="w-16 h-[2px] bg-[#E879F9] mx-auto rounded-full shadow-[0_0_10px_#E879F9]" />
            <p className="text-neutral-400 text-base font-sans font-light">Four automated steps from raw log ingest to incident resolution</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', icon: <Terminal className="w-5 h-5 text-[#C77DFF]" />, title: 'Log Ingestion', desc: 'Drag & drop .log files, paste raw text, or select incident scenario presets.', iconBg: 'bg-[#C77DFF]/15 border-[#C77DFF]/30', view: 'feed' },
              { step: '02', icon: <Cpu className="w-5 h-5 text-[#E879F9]" />, title: 'Stream Tokenization', desc: 'Timestamp extraction, log level tagging, and stack trace continuation grouping.', iconBg: 'bg-[#E879F9]/15 border-[#E879F9]/30', view: 'detect' },
              { step: '03', icon: <Sparkles className="w-5 h-5 text-[#C77DFF]" />, title: 'NVIDIA LLM Reasoning', desc: 'Nemotron 3 Ultra model analyzes error propagation and calculates confidence.', iconBg: 'bg-[#C77DFF]/15 border-[#C77DFF]/30', view: 'guard' },
              { step: '04', icon: <BarChart2 className="w-5 h-5 text-[#E879F9]" />, title: 'Incident Timechain', desc: 'Reconstructs chronological causality from initial signal through resolution.', iconBg: 'bg-[#E879F9]/15 border-[#E879F9]/30', view: 'chain' },
            ].map((s, idx) => (
              <div 
                key={idx} 
                className="p-6 space-y-4 rounded-3xl border border-[#3A2E52]/80 bg-[#15111F]/70 backdrop-blur-md relative group hover:border-[#C77DFF]/50 transition-all duration-300 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
                onClick={() => onNext && onNext(s.view)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-bold font-mono text-neutral-700 group-hover:text-[#C77DFF]/40 transition-colors duration-500">{s.step}</span>
                  <div className={`p-2.5 rounded-xl border ${s.iconBg}`}>{s.icon}</div>
                </div>
                <h4 className="font-bold text-white text-base font-serif-luxury">{s.title}</h4>
                <p className="text-sm text-neutral-400 leading-relaxed font-sans font-light">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ STATS ═══════════════════════════════════════════════ */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 relative z-10 bg-[#0A0810]/60">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl p-10 sm:p-14 border border-[#3A2E52]/80 bg-[#15111F]/75 backdrop-blur-md shadow-2xl relative overflow-hidden">
            
            {/* Tech grid markings in Electric Violet */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-[#C77DFF]/50" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-[#C77DFF]/50" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-[#C77DFF]/50" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-[#C77DFF]/50" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
              <div className="space-y-2">
                <div className="text-4xl sm:text-5xl font-black text-[#C77DFF] font-mono tracking-tight" style={{ textShadow: '0 0 20px rgba(199,125,255,0.4)' }}>
                  <AnimatedNumber target={250000} suffix="+" />
                </div>
                <div className="text-xs text-neutral-400 uppercase tracking-widest font-semibold font-sans">Logs Parsed</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
                  <AnimatedNumber target={99.4} suffix="%" decimals={1} />
                </div>
                <div className="text-xs text-neutral-400 uppercase tracking-widest font-semibold font-sans">AI Grounding</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl sm:text-5xl font-black text-[#E879F9] font-mono tracking-tight" style={{ textShadow: '0 0 20px rgba(232,121,249,0.4)' }}>
                  <AnimatedNumber target={12} prefix="<" suffix="ms" />
                </div>
                <div className="text-xs text-neutral-400 uppercase tracking-widest font-semibold font-sans">Tokenization</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
                  <AnimatedNumber target={100} suffix="%" />
                </div>
                <div className="text-xs text-neutral-400 uppercase tracking-widest font-semibold font-sans">Privacy Guard</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Dark Footer */}
      <Footer theme="dark" />
    </div>
  );
};

