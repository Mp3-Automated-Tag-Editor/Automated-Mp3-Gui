"use client";

import { WebviewWindow, appWindow } from "@tauri-apps/api/window"

import '../app/globals.css';
import { useEffect, useState } from 'react';
import ModeToggle from "./context/theme-button"
import { Maximize, Minimize, Minus, Square, X } from 'lucide-react';

export default function TitleBar(
    {
        titleBar = "Automated Mp3 Tag Editor - v1.0"
    }: {
        titleBar: string;
    }
) {
    const [appWindow, setAppWindow] = useState<WebviewWindow>()

    async function setupAppWindow() {
        const appWindow = (await import('@tauri-apps/api/window')).appWindow
        setAppWindow(appWindow)
    }

    useEffect(() => {
        setupAppWindow()
    }, [])

    function windowMinimize() {
        appWindow?.minimize()
    }
    function windowToggleMaximize() {
        appWindow?.toggleMaximize()
    }
    function windowClose() {
        appWindow?.close()
    }
    return (
        <>
            <div data-tauri-drag-region className='titlebar'>
                {/* <Image width={30} height={30} alt="Mp3" src="./logo.png" /> */}
                <div data-tauri-drag-region className="title">
                    {titleBar}
                </div>
                <ModeToggle />
                <button className='titlebar-button' onClick={windowMinimize}>
                    <Minus size={14} />
                </button>
                <button className='titlebar-button' onClick={windowToggleMaximize}>
                    {/* <Minimize /> */}
                    {/* <Maximize /> */}
                    <Square size={14} />
                </button>
                <button className='titlebar-button' onClick={windowClose}>
                    <X size={14} />
                </button>
            </div>
        </>
    );
}