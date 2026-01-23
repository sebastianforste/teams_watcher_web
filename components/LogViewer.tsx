"use client";

import { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function LogViewer({ logs }: { logs: string[] }) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    return (
        <Card className="flex flex-col h-[400px] bg-zinc-950 border-zinc-800">
            <CardHeader className="py-3 px-4 border-b border-zinc-800">
                <CardTitle className="text-sm font-mono text-zinc-400">Live Logs</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full">
                    <div className="p-4 space-y-1 font-mono text-xs text-zinc-300">
                        {logs.length === 0 && <span className="text-zinc-600">Waiting for logs...</span>}
                        {logs.map((line, i) => (
                            <div key={i} className="whitespace-pre-wrap break-all border-l-2 border-transparent hover:border-zinc-700 pl-2 py-0.5">
                                {line}
                            </div>
                        ))}
                         <div ref={bottomRef} />
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
