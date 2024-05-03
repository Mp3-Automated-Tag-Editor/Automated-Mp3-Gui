import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri'

export default function CancelScrape({ keyCombo, func }: { keyCombo: any, func: any }) {
    useEffect(() => {
        const handleKeyPress = async (event: { ctrlKey: any; key: string; }) => {
            if (event.ctrlKey && event.key.toLowerCase() === keyCombo.toLowerCase()) {
                await invoke('stop_scrape_process');
                func(2)
            }
        };

        document.addEventListener('keydown', handleKeyPress);

        return () => {
            document.removeEventListener('keydown', handleKeyPress);
        };
    }, [keyCombo]);

    return null; // This component doesn't render anything
};