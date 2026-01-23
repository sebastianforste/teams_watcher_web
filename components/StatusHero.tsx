"use client";

import { motion } from "framer-motion";

interface StatusHeroProps {
  status: string; // 'waiting_for_teams', 'idle', 'recording', 'stopped', 'error...'
  meetingTitle?: string;
}

export function StatusHero({ status, meetingTitle }: StatusHeroProps) {
  let color = "bg-zinc-500";
  let pulse = false;
  let text = "Offline or Stopped";

  if (status === 'waiting_for_teams') {
    color = "bg-yellow-500";
    text = "Waiting for Teams";
  } else if (status === 'idle') {
    color = "bg-blue-500";
    text = "Monitoring Active";
  } else if (status === 'recording') {
    color = "bg-red-500";
    text = "Recording in Progress";
    pulse = true;
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800 p-8 flex flex-col items-center justify-center text-center">
      <div className="relative mb-6">
        <motion.div
           className={`w-24 h-24 rounded-full ${color} flex items-center justify-center`}
           animate={pulse ? { scale: [1, 1.1, 1], opacity: [1, 0.8, 1] } : {}}
           transition={pulse ? { repeat: Infinity, duration: 2 } : {}}
        >
            <div className={`w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm`} />
        </motion.div>
        {pulse && (
            <motion.div 
                className={`absolute inset-0 rounded-full ${color}`}
                initial={{ opacity: 0.5, scale: 1 }}
                animate={{ opacity: 0, scale: 2 }}
                transition={{ repeat: Infinity, duration: 2 }}
            />
        )}
      </div>
      
      <h2 className="text-2xl font-bold tracking-tight text-white mb-2">{text}</h2>
      {meetingTitle && (
        <p className="text-zinc-400 font-medium">{meetingTitle}</p>
      )}
      <p className="text-xs text-zinc-500 mt-4 uppercase tracking-widest font-mono">
        Current System State
      </p>
    </div>
  );
}
