import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface TerminalProps {
    logs: string[];
}

const Terminal: React.FC<TerminalProps> = ({ logs }) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<XTerm | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const lastLogIndexRef = useRef<number>(0);

    useEffect(() => {
        if (!terminalRef.current) return;

        // Initialize xterm
        const term = new XTerm({
            cursorBlink: true,
            fontSize: 12,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            theme: {
                background: '#000000',
                foreground: '#ffffff',
            },
            convertEol: true, // Important for proper line breaks
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        term.open(terminalRef.current);
        fitAddon.fit();

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        // Handle resize
        const handleResize = () => {
            fitAddon.fit();
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            term.dispose();
        };
    }, []);

    // Sync logs
    useEffect(() => {
        const term = xtermRef.current;
        if (!term) return;

        // Write new logs
        const newLogs = logs.slice(lastLogIndexRef.current);
        if (newLogs.length > 0) {
            newLogs.forEach(log => {
                term.write(log + '\r\n');
            });
            lastLogIndexRef.current = logs.length;
        }
    }, [logs]);

    // Re-fit on mount/updates
    useEffect(() => {
        if (fitAddonRef.current) {
            // Small delay to ensure container has size
            setTimeout(() => {
                fitAddonRef.current?.fit();
            }, 100);
        }
    });

    return (
        <div className="h-full w-full bg-black p-2 overflow-hidden">
            <div ref={terminalRef} className="h-full w-full" />
        </div>
    );
};

export default Terminal;
