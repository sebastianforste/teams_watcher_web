"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Mic, Radio, Shield, AlertCircle } from "lucide-react";

interface StatusHeroProps {
  status: string; // 'waiting_for_teams', 'idle', 'recording', 'stopped', 'error...'
  meetingTitle?: string;
}

export function StatusHero({ status, meetingTitle }: StatusHeroProps) {
  let themeColor = "from-zinc-500 to-zinc-700";
  let pulseColor = "bg-zinc-500";
  let Icon = Shield;
  let statusText = "System Offline";
  let description = "Watcher service is not active";
  let isRecording = false;

  if (status === 'waiting_for_teams') {
    themeColor = "from-amber-400 to-orange-600";
    pulseColor = "bg-amber-500";
    Icon = Radio;
    statusText = "Standby Mode";
    description = "Waiting for Teams process...";
  } else if (status === 'idle') {
    themeColor = "from-blue-500 to-indigo-600";
    pulseColor = "bg-blue-500";
    Icon = Shield;
    statusText = "Watcher Active";
    description = "Monitoring incoming calls";
  } else if (status === 'recording') {
    themeColor = "from-red-500 to-rose-700";
    pulseColor = "bg-red-500";
    Icon = Mic;
    statusText = "Live Recording";
    description = meetingTitle || "Capturing audio session";
    isRecording = true;
  } else if (status.includes('error')) {
    themeColor = "from-red-600 to-red-900";
    pulseColor = "bg-red-600";
    Icon = AlertCircle;
    statusText = "System Error";
    description = "Check permissions or logs";
  }

  return (
    <div className="glass-card relative overflow-hidden p-8 min-h-[320px] flex flex-col items-center justify-center text-center animate-in">
      {/* StrategyOS Branding Watermark */}
      <div className="absolute top-4 left-6 flex items-center gap-2 opacity-20 hover:opacity-50 transition-opacity duration-500 cursor-default select-none">
        <Shield className="w-3 h-3 text-emerald-500" />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-100 italic">Strategy OS</span>
      </div>

      <div className="absolute top-4 right-6 flex items-center gap-2 opacity-20">
        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">v2.4.0 / Alpha</span>
      </div>

      {/* Background Glow */}
      <div className={`absolute -top-24 -left-24 w-64 h-64 rounded-full blur-[100px] opacity-20 ${pulseColor}`} />
      <div className={`absolute -bottom-24 -right-24 w-64 h-64 rounded-full blur-[100px] opacity-10 ${pulseColor}`} />

      <div className="relative mb-10">
        <motion.div
           className={`w-32 h-32 rounded-full bg-gradient-to-br ${themeColor} p-[1px] shadow-2xl`}
           animate={isRecording ? { 
             scale: [1, 1.08, 1],
             boxShadow: ["0 0 0px rgba(244,63,94,0)", "0 0 60px rgba(244,63,94,0.3)", "0 0 0px rgba(244,63,94,0)"]
           } : {}}
           transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        >
            <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center backdrop-blur-3xl overflow-hidden relative">
                <Icon className={`w-12 h-12 ${isRecording ? 'text-rose-500' : 'text-zinc-500/50'}`} />
                {isRecording && (
                    <motion.div 
                        className="absolute inset-0 bg-rose-500/5"
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    />
                )}
            </div>
        </motion.div>
        
        {isRecording && (
            <motion.div 
                className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-rose-600 border-[6px] border-zinc-950 z-10 shadow-lg"
                animate={{ opacity: [1, 0.4, 1], scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
            />
        )}
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={statusText}
          initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          exit={{ opacity: 0, filter: "blur(10px)", y: -20 }}
          transition={{ duration: 0.5, ease: "circOut" }}
        >
          <h2 className="text-4xl font-black italic tracking-tighter premium-gradient-text mb-4 uppercase">
            {statusText}
          </h2>
          <div className="flex items-center justify-center gap-3">
             <div className={`h-[1px] w-8 ${pulseColor} opacity-20`} />
             <p className="text-zinc-400 font-bold text-sm tracking-wide uppercase opacity-80 max-w-[400px]">
                {description}
             </p>
             <div className={`h-[1px] w-8 ${pulseColor} opacity-20`} />
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-8 opacity-20">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${pulseColor} animate-pulse`} />
            <span className="text-[10px] uppercase tracking-[0.3em] font-black font-mono text-zinc-100">Neural Link Active</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3 text-zinc-100" />
            <span className="text-[10px] uppercase tracking-[0.3em] font-black font-mono text-zinc-100">Quantum Grade Encryption</span>
          </div>
      </div>
    </div>
  );
}
