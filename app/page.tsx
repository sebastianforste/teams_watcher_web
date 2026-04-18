"use client";

import React, { useState, useEffect } from "react";
import { Mic, Activity, Calendar, History, Settings, CheckCircle2, AlertCircle, PlayCircle, StopCircle, ChevronRight, Download, MoreHorizontal } from "lucide-react";

export default function Dashboard() {
  const [status, setStatus] = useState("IDLE");
  const [recordings, setRecordings] = useState([
    { id: 1, name: "Meeting - Hithium Quotation", date: "Today, 10:15 AM", duration: "1h 12m", size: "42.5 MB", status: "Processed" },
    { id: 2, name: "Internal Sync - StrategyOS", date: "Yesterday, 2:30 PM", duration: "45m 10s", size: "18.2 MB", status: "Transcribing" },
    { id: 3, name: "Client Call - gunnerCooke", date: "April 1, 9:00 AM", duration: "32m 05s", size: "12.8 MB", status: "Ready" },
  ]);

  // Simulate status polling
  useEffect(() => {
    // In real app, we would fetch from API or read from .teams_watcher_status
  }, []);

  return (
    <main className="min-h-screen pt-32 pb-24 px-8 max-w-7xl mx-auto flex flex-col gap-12">
      
      {/* Floating Navigation */}
      <nav className="floating-nav group">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-500 p-[1px]">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
              <Mic className="w-4 h-4 text-white" />
            </div>
          </div>
          <span className="font-bold tracking-tighter text-xl">TeamsRecorder</span>
        </div>
        <div className="h-6 w-[1px] bg-white/10 mx-2" />
        <div className="flex items-center gap-8 text-sm font-medium text-white/50 lowercase">
          <a href="#" className="hover:text-cyan-400 transition-colors text-white">Dashboard</a>
          <a href="#" className="hover:text-cyan-400 transition-colors">Archive</a>
          <a href="#" className="hover:text-cyan-400 transition-colors">Settings</a>
        </div>
      </nav>

      {/* Hero / Engine Status Section */}
      <section className="animate-in grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 group relative">
          <div className="premium-glow" />
          <div className="glass-container p-8 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-medium text-white/40 uppercase tracking-widest">Engine Status</h2>
                <div className="flex items-center gap-3">
                   <div className={`status-dot ${status === 'RECORDING' ? 'status-recording' : 'status-ready'}`} />
                   <p className="text-3xl font-bold tracking-tight">System {status === 'RECORDING' ? 'Active' : 'Optimized'}</p>
                </div>
              </div>
              <Activity className={`w-8 h-8 ${status === 'RECORDING' ? 'text-red-500 animate-pulse' : 'text-cyan-500'}`} />
            </div>
            
            <div className="flex items-end justify-between">
              <div>
                <p className="text-white/60 mb-1 text-sm font-mono">Current Polling: 1.0s</p>
                <p className="text-white/40 text-xs font-mono uppercase tracking-tighter">Automatic Start/Stop Logic Enabled</p>
              </div>
              <button 
                className={`py-3 px-8 rounded-2xl font-semibold flex items-center gap-2 border transition-all duration-300 ${status === 'RECORDING' ? 'bg-red-500/10 border-red-500/50 text-red-500 hover:bg-red-500/20' : 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20'}`}>
                {status === 'RECORDING' ? <StopCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                {status === 'RECORDING' ? 'Emergency Stop' : 'Force Record'}
              </button>
            </div>
          </div>
        </div>

        <div className="glass-container p-8 group overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-sm font-medium text-cyan-400/80 uppercase tracking-widest mb-6">Detection Signal</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-cyan-500/30 transition-colors">
                <CheckCircle2 className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">Teams Hook</p>
                <p className="text-xs text-white/40">Active Integration</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-fuchsia-500/30 transition-colors">
                <AlertCircle className="w-6 h-6 text-fuchsia-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">Applescript V2.5</p>
                <p className="text-xs text-white/40">High Status</p>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[64px] rounded-full -mr-16 -mt-16 group-hover:bg-cyan-400/20 transition-all duration-700" />
        </div>
      </section>

      {/* Recordings Section */}
      <section className="animate-in [animation-delay:200ms] flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Recent Artifacts</h2>
          <button className="flex items-center gap-2 text-sm text-cyan-400/80 hover:text-cyan-400 font-medium transition-colors">
            View All Recordings <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {recordings.map((recording) => (
            <div key={recording.id} className="group glass-container p-6 hover:bg-white/[0.04] transition-all duration-500 cursor-pointer flex items-center justify-between border-white/[0.04] hover:border-white/10">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center border border-white/5 group-hover:scale-105 transition-transform">
                  <Calendar className="w-6 h-6 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
                </div>
                <div>
                   <h3 className="font-semibold text-lg tracking-tight mb-1">{recording.name}</h3>
                   <div className="flex items-center gap-4 text-xs font-mono text-white/30 uppercase tracking-tighter">
                      <span className="flex items-center gap-1"><History className="w-3 h-3" /> {recording.duration}</span>
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {recording.size}</span>
                      <span className="text-cyan-400/60 font-bold">{recording.status}</span>
                   </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                 <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-cyan-500/20 hover:text-cyan-400 transition-all duration-300">
                    <Download className="w-4 h-4" />
                 </button>
                 <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all duration-300">
                    <MoreHorizontal className="w-4 h-4" />
                 </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer / Info */}
      <footer className="mt-24 pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-white/20 text-xs font-mono tracking-widest uppercase">teams_recorder_v3.5 // build_optimized</p>
          <div className="flex items-center gap-8 text-white/40 text-xs uppercase font-medium tracking-tighter">
            <span className="hover:text-cyan-400 transition-colors cursor-pointer">Security Protocol</span>
            <span className="hover:text-cyan-400 transition-colors cursor-pointer">System Logs</span>
            <span className="hover:text-cyan-400 transition-colors cursor-pointer">API Integration</span>
          </div>
      </footer>
    </main>
  );
}
