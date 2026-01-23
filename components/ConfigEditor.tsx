"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
// Textarea import removed 
// Let's check my executed command for teams_watcher_web: "card button input badge scroll-area separator tabs table switch label dialog". 
// I missed textarea. I'll rely on a standard textarea for now or use the generic input.
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";

export function ConfigEditor() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/config")
      .then(res => res.json())
      .then(data => {
        setContent(data.content);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setSaving(false);
    // Maybe trigger restart?
    alert("Saved! You usually need to restart the watcher for changes to take effect.");
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Configuration Editor</CardTitle>
        <CardDescription>Directly edit the `config.sh` file.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Fallback to standard textarea since I forgot to install shadcn textarea */}
        <textarea 
            className="flex-1 w-full min-h-[400px] p-4 font-mono text-sm bg-zinc-950 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-700"
            value={content}
            onChange={(e) => setContent(e.target.value)}
        />
        <Button onClick={handleSave} disabled={saving} className="self-end">
             {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
             <Save className="mr-2 h-4 w-4" /> Save Config
        </Button>
      </CardContent>
    </Card>
  );
}
