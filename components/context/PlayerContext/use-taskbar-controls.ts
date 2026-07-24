"use client";

import { useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/tauri";
import { TAURI_COMMANDS, TAURI_EVENTS } from "@/constants";

type TaskbarHandlers = {
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
};

/**
 * Windows taskbar thumbnail toolbar (hover the app icon):
 * listens for prev / toggle / next and keeps the play/pause glyph in sync.
 */
export function useTaskbarControls(isPlaying: boolean, handlers: TaskbarHandlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    let cancelled = false;
    const unlisteners: Array<() => void> = [];

    (async () => {
      try {
        const pairs: Array<[string, () => void]> = [
          [TAURI_EVENTS.mediaPrev, () => handlersRef.current.prev()],
          [TAURI_EVENTS.mediaToggle, () => handlersRef.current.togglePlay()],
          [TAURI_EVENTS.mediaNext, () => handlersRef.current.next()],
        ];
        for (const [event, handler] of pairs) {
          const unlisten = await listen(event, handler);
          if (cancelled) {
            unlisten();
            return;
          }
          unlisteners.push(unlisten);
        }
      } catch {
        // Not running inside Tauri
      }
    })();

    return () => {
      cancelled = true;
      unlisteners.forEach((u) => u());
    };
  }, []);

  useEffect(() => {
    invoke(TAURI_COMMANDS.setTaskbarPlaybackState, { isPlaying }).catch(() => {
      // Ignore outside Tauri / before toolbar is attached
    });
  }, [isPlaying]);
}
