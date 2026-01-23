"use client";

import { useState, useEffect } from "react";
import { StatusHero } from "@/components/StatusHero";
import { LogViewer } from "@/components/LogViewer";
import { ConfigEditor } from "@/components/ConfigEditor";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Play, Square } from "lucide-react";

export default function Home() {
  const [status, setStatus] = useState<any>({});
  const [logs, setLogs] = useState<string[]>([]);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/status");
      const json = await res.json();
      setStatus(json.status);
      setLogs(json.logs);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleControl = async (action: string) => {
    await fetch("/api/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
    });
    setTimeout(fetchStatus, 1000);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                    Teams Watcher
                </h1>
                <p className="text-zinc-500">Automated Recording & Monitoring</p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => fetchStatus()}>
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>
        </div>

        {/* Top Status Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
                <StatusHero 
                    status={status.state} 
                    meetingTitle={status.meeting} 
                />
            </div>
            <div className="grid grid-rows-2 gap-4">
                 <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col justify-center gap-4">
                    <h3 className="text-zinc-400 text-sm font-medium">Service Control</h3>
                    <div className="flex gap-2">
                        <Button 
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700" 
                            onClick={() => handleControl('start')}
                        >
                            <Play className="h-4 w-4 mr-2" /> Start
                        </Button>
                        <Button 
                            className="flex-1 bg-red-600 hover:bg-red-700"
                            onClick={() => handleControl('stop')}
                        >
                            <Square className="h-4 w-4 mr-2" /> Stop
                        </Button>
                    </div>
                 </div>
                 <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col justify-center">
                    <div className="flex justify-between items-center">
                        <span className="text-zinc-400 text-sm">Last Update</span>
                        <span className="font-mono text-sm">{status.timestamp || "Never"}</span>
                    </div>
                 </div>
            </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="logs" className="w-full">
            <TabsList className="bg-zinc-900 border border-zinc-800">
                <TabsTrigger value="logs">System Logs</TabsTrigger>
                <TabsTrigger value="config">Configuration</TabsTrigger>
            </TabsList>
            <TabsContent value="logs" className="mt-4">
                <LogViewer logs={logs} />
            </TabsContent>
            <TabsContent value="config" className="mt-4">
                <ConfigEditor />
            </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}
