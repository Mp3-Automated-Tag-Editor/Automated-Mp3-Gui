"use client";

import { useContext, useState } from "react";
import { open } from "@tauri-apps/api/dialog";
import { FolderOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfigContext } from "@/components/context/ConfigContext";
import { usePlayer } from "@/components/context/PlayerContext";
import { useToast } from "@/components/ui/use-toast";
import { invoke } from "@tauri-apps/api/tauri";
import { CONFIG_KEYS, TAURI_COMMANDS } from "@/constants";

type LibraryGateProps = {
  title?: string;
  description?: string;
  onReady?: (path: string) => void;
};

export function LibraryGate({
  title = "Choose your music library",
  description = "Pick a folder of MP3 files. Edit, Music Playstation, and Statistics will all use this folder. You can change it later in Settings.",
  onReady,
}: LibraryGateProps) {
  const { configs, addConfig } = useContext(ConfigContext);
  const { loadFolder } = usePlayer();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const pickFolder = async () => {
    setBusy(true);
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select music library folder",
      });
      if (!selected || Array.isArray(selected)) return;

      const check = await invoke<[boolean, number] | null>(TAURI_COMMANDS.checkDirectory, {
        var: selected,
      }).catch(() => null);

      await addConfig(configs, { key: CONFIG_KEYS.libraryPath, value: selected });
      await loadFolder(selected);
      onReady?.(selected);
      toast({
        title: "Library folder set",
        description:
          check && Array.isArray(check)
            ? `${selected} · ${check[1]} MP3 file(s)`
            : selected,
      });
    } catch (e: unknown) {
      toast({
        title: "Could not set library folder",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-8">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
        <FolderOpen className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="max-w-lg text-sm text-muted-foreground">{description}</p>
      <Button onClick={pickFolder} disabled={busy}>
        {busy ? "Opening…" : "Choose folder"}
      </Button>
    </div>
  );
}

export function useLibraryPath(): string {
  const { configs } = useContext(ConfigContext);
  return String(configs?.[CONFIG_KEYS.libraryPath] || "").trim();
}
