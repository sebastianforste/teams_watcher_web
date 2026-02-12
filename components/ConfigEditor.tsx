"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";

export function ConfigEditor() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(typeof data.error === "string" ? data.error : "Failed to load config");
        }
        return data;
      })
      .then((data) => {
        if (typeof data.content !== "string") {
          throw new Error("Unexpected config response");
        }
        setContent(data.content);
        setLoadError(null);
        setLoading(false);
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Failed to load config";
        setLoadError(message);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const data = await res.json();
      if (!res.ok) {
        const message =
          typeof data.error === "string" ? data.error : "Failed to save config";
        throw new Error(message);
      }

      setSaveMessage("Saved. Restart the watcher for config changes to take effect.");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save config";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (loadError) return <div className="text-sm text-red-400">{loadError}</div>;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Configuration Editor</CardTitle>
        <CardDescription>Directly edit the `config.sh` file.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <textarea 
            className="flex-1 w-full min-h-[400px] p-4 font-mono text-sm bg-zinc-950 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-700"
            value={content}
            onChange={(e) => setContent(e.target.value)}
        />
        {saveMessage && <p className="text-sm text-emerald-400">{saveMessage}</p>}
        {saveError && <p className="text-sm text-red-400">{saveError}</p>}
        <Button onClick={handleSave} disabled={saving} className="self-end">
             {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
             <Save className="mr-2 h-4 w-4" /> Save Config
        </Button>
      </CardContent>
    </Card>
  );
}
