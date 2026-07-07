import React, { useEffect, useState, useRef } from 'react';
import { motion, DragControls } from 'framer-motion';

interface TerminalProps {
  latestVersion: string;
  dragControls: DragControls;
}

type TermState = 'idle' | 'menu' | 'installing' | 'status';

const dosColors: Record<string, string> = {
  '0': '#000000', '8': '#808080',
  '1': '#0000AA', '9': '#5555FF',
  '2': '#00AA00', 'a': '#55FF55',
  '3': '#00AAAA', 'b': '#55FFFF',
  '4': '#AA0000', 'c': '#FF5555',
  '5': '#AA00AA', 'd': '#FF55FF',
  '6': '#AA5500', 'e': '#FFFF55',
  '7': '#AAAAAA', 'f': '#FFFFFF'
};

export const Terminal: React.FC<TerminalProps> = ({ latestVersion, dragControls }) => {
  const [termState, setTermState] = useState<TermState>('menu');
  const [termBg, setTermBg] = useState('#000000');
  const [termFg, setTermFg] = useState('#cccccc');
  const [termLines, setTermLines] = useState<{ text: React.ReactNode, color?: string }[]>([
    { text: `C:\\Windows\\System32> aerop2p`, color: '#cccccc' },
    { text: `----------------------------------------`, color: '#808080' },
    { text: `Aero P2P Chat Windows Installer`, color: '#ffffff' },
    { text: `----------------------------------------`, color: '#808080' },
    { text: `> Checking versions...`, color: '#00ffff' },
    { text: ``, color: '#cccccc' },
    { text: `Status: Not Installed`, color: '#ffff00' },
    { text: `Latest: ${latestVersion}`, color: '#00ffff' },
    { text: ``, color: '#cccccc' },
    { text: `1) Install Aero P2P Chat`, color: '#ffffff' },
    { text: `2) Check status details`, color: '#ffffff' },
    { text: `3) Exit`, color: '#808080' },
    { text: ``, color: '#cccccc' }
  ]);
  const [termInput, setTermInput] = useState('');
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTermLines(prev => prev.map((line, i) => {
      if (i === 7 && typeof line.text === 'string' && line.text.startsWith('Latest:')) {
        return { ...line, text: `Latest: ${latestVersion}` };
      }
      return line;
    }));
  }, [latestVersion]);

  const printMenu = () => {
    setTermLines(prev => [
      ...prev,
      { text: `----------------------------------------`, color: '#808080' },
      { text: `Aero P2P Chat Windows Installer`, color: '#ffffff' },
      { text: `----------------------------------------`, color: '#808080' },
      { text: ``, color: '#cccccc' },
      { text: `Status: Not Installed`, color: '#ffff00' },
      { text: `Latest: ${latestVersion}`, color: '#00ffff' },
      { text: ``, color: '#cccccc' },
      { text: `1) Install Aero P2P Chat`, color: '#ffffff' },
      { text: `2) Check status details`, color: '#ffffff' },
      { text: `3) Exit`, color: '#808080' },
      { text: ``, color: '#cccccc' }
    ]);
    setTermState('menu');
  };

  const simulateInit = async () => {
    setTermState('installing');
    setTermLines(prev => [...prev, { text: `> Checking versions...`, color: '#00ffff' }]);
    await new Promise(r => setTimeout(r, 800));
    printMenu();
  };

  const simulateInstall = async () => {
    setTermState('installing');
    setTermLines(prev => [...prev, { text: `> Fetching latest release info...`, color: '#00ffff' }]);
    await new Promise(r => setTimeout(r, 600));
    setTermLines(prev => [...prev, { text: `> Latest version: ${latestVersion}`, color: '#00ffff' }]);
    await new Promise(r => setTimeout(r, 400));
    setTermLines(prev => [...prev, { text: `> Downloading Aero P2P Chat Setup...`, color: '#00ffff' }]);
    await new Promise(r => setTimeout(r, 1500));
    setTermLines(prev => [...prev, { text: `> Running installer...`, color: '#00ffff' }]);
    await new Promise(r => setTimeout(r, 2000));
    setTermLines(prev => [...prev, { text: `OK Added C:\\Windows\\System32\\.local\\bin to User PATH. You may need to restart your terminal.`, color: '#00ff00' }]);
    setTermLines(prev => [...prev, { text: `OK Aero P2P Chat installed successfully!`, color: '#00ff00' }]);
    await new Promise(r => setTimeout(r, 1000));
    setTermLines(prev => [...prev, { text: ``, color: '#cccccc' }]);
    printMenu();
  };

  const simulateStatus = async () => {
    setTermState('installing');
    setTermLines(prev => [...prev, { text: `> Fetching latest release info...`, color: '#00ffff' }]);
    await new Promise(r => setTimeout(r, 600));
    setTermLines(prev => [...prev, { text: `Installed version: not installed`, color: '#00ffff' }]);
    setTermLines(prev => [...prev, { text: `Latest version:    ${latestVersion}`, color: '#00ffff' }]);
    await new Promise(r => setTimeout(r, 1000));
    printMenu();
  };

  const simulateDirS = async () => {
    setTermState('installing');
    setTermLines(prev => [...prev, 
      { text: ` Volume in drive C has no label.`, color: '#cccccc' },
      { text: ` Volume Serial Number is 1234-5678`, color: '#cccccc' }
    ]);

    const dirs = [
      'C:\\Windows\\System32', 
      'C:\\Windows\\System32\\drivers',
      'C:\\Windows\\System32\\config\\systemprofile\\AppData\\Roaming\\AeroP2P', 
      'C:\\Windows\\System32\\Drivers\\etc',
      'C:\\Program Files\\Common Files'
    ];
    const files = ['kernel32.dll', 'user32.dll', 'hal.dll', 'config.json', 'install.ps1', 'aerop2p.exe', 'libcrypto.dll', 'sqlite3.dll'];
    
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 40));
      const dir = dirs[Math.floor(Math.random() * dirs.length)];
      
      const chunk = [
        { text: `\n Directory of ${dir}`, color: '#cccccc' }
      ];
      
      const numFiles = Math.floor(Math.random() * 5) + 2;
      for (let j = 0; j < numFiles; j++) {
        const file = files[Math.floor(Math.random() * files.length)];
        const size = Math.floor(Math.random() * 90000) + 1000;
        const date = `10/24/2023  ${10 + Math.floor(Math.random()*2)}:${10 + Math.floor(Math.random()*50)} AM`;
        chunk.push({ text: `${date}    ${size.toLocaleString()} ${file}`, color: '#cccccc' });
      }
      
      setTermLines(prev => {
        const next = [...prev, ...chunk];
        return next.length > 200 ? next.slice(next.length - 200) : next;
      });
    }

    setTermLines(prev => [
      ...prev,
      { text: ``, color: '#cccccc' },
      { text: `     Total Files Listed:`, color: '#cccccc' },
      { text: `            142 File(s)     12,345,678 bytes`, color: '#cccccc' },
      { text: `             24 Dir(s)  123,456,789,012 bytes free`, color: '#cccccc' }
    ]);
    setTermState('idle');
  };

  const handleTerminalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (termState === 'installing' || termState === 'status') return;

    const input = termInput.trim();
    setTermInput('');
    
    if (termState === 'idle') {
      const lowerInput = input.toLowerCase();
      
      setTermLines(prev => [...prev, { text: `C:\\Windows\\System32> ${input}`, color: termFg }]);
      
      if (!input) return;

      if (lowerInput.includes('install.ps1') || lowerInput.includes('aerop2p') || lowerInput.includes('iwr') || lowerInput.includes('iex') || lowerInput.includes('curl') || lowerInput.includes('install.sh')) {
        await simulateInit();
      } else if (lowerInput === 'cls' || lowerInput === 'clear') {
        setTermLines([]);
      } else if (lowerInput === 'help') {
        setTermLines(prev => [
          ...prev,
          { text: `For more information on a specific command, type HELP command-name`, color: '#cccccc' },
          { text: `CLS            Clears the screen.`, color: '#cccccc' },
          { text: `DIR            Displays a list of files and subdirectories in a directory.`, color: '#cccccc' },
          { text: `ECHO           Displays messages, or turns command echoing on or off.`, color: '#cccccc' },
          { text: `EXIT           Quits the CMD.EXE program (command interpreter).`, color: '#cccccc' },
          { text: `HELP           Provides Help information for Windows commands.`, color: '#cccccc' },
          { text: `VER            Displays the Windows version.`, color: '#cccccc' },
          { text: `AEROP2P        Aero P2P Chat CLI utility.`, color: '#00ffff' },
        ]);
      } else if (lowerInput === 'dir /s') {
        await simulateDirS();
      } else if (lowerInput === 'dir' || lowerInput === 'ls') {
        setTermLines(prev => [
          ...prev,
          { text: ` Volume in drive C has no label.`, color: '#cccccc' },
          { text: ` Volume Serial Number is 1234-5678`, color: '#cccccc' },
          { text: ``, color: '#cccccc' },
          { text: ` Directory of C:\\Windows\\System32`, color: '#cccccc' },
          { text: ``, color: '#cccccc' },
          { text: `10/24/2023  10:00 AM    <DIR>          .`, color: '#cccccc' },
          { text: `10/24/2023  10:00 AM    <DIR>          ..`, color: '#cccccc' },
          { text: `10/24/2023  10:05 AM             1,024 install.ps1`, color: '#00ff00' },
          { text: `10/24/2023  10:05 AM    <DIR>          Downloads`, color: '#00ffff' },
          { text: `10/24/2023  10:05 AM    <DIR>          Documents`, color: '#00ffff' },
          { text: `               1 File(s)          1,024 bytes`, color: '#cccccc' },
          { text: `               4 Dir(s)  123,456,789,012 bytes free`, color: '#cccccc' }
        ]);
      } else if (lowerInput === 'ver') {
        setTermLines(prev => [
          ...prev,
          { text: ``, color: '#cccccc' },
          { text: `Microsoft Windows [Version 6.1.7601]`, color: '#cccccc' },
          { text: ``, color: '#cccccc' }
        ]);
      } else if (lowerInput.startsWith('color')) {
        const arg = lowerInput.substring(5).trim();
        if (!arg) {
          setTermBg('#000000');
          setTermFg('#cccccc');
        } else {
          const match = arg.match(/^[0-9a-f]{1,2}$/i);
          if (match) {
            const hex = match[0].toLowerCase();
            if (hex.length === 1) {
              if (termBg.toLowerCase() === dosColors[hex].toLowerCase()) {
                setTermLines(prev => [...prev, { text: `Color output cannot be the same as the background color.`, color: '#cccccc' }]);
              } else {
                setTermFg(dosColors[hex]);
              }
            } else {
              const bg = hex[0];
              const fg = hex[1];
              if (bg === fg) {
                setTermLines(prev => [...prev, { text: `Color output cannot be the same as the background color.`, color: '#cccccc' }]);
              } else {
                setTermBg(dosColors[bg]);
                setTermFg(dosColors[fg]);
              }
            }
          } else {
            setTermLines(prev => [
              ...prev,
              { text: `Sets the default console foreground and background colors.`, color: '#cccccc' },
              { text: ``, color: '#cccccc' },
              { text: `COLOR [attr]`, color: '#cccccc' },
              { text: ``, color: '#cccccc' },
              { text: `  attr        Specifies color attribute of console output`, color: '#cccccc' },
              { text: ``, color: '#cccccc' },
              { text: `Color attributes are specified by TWO hex digits -- the first`, color: '#cccccc' },
              { text: `corresponds to the background; the second the foreground.`, color: '#cccccc' },
              { text: ``, color: '#cccccc' },
              { text: `    0 = Black       8 = Gray`, color: '#cccccc' },
              { text: `    1 = Blue        9 = Light Blue`, color: '#cccccc' },
              { text: `    2 = Green       A = Light Green`, color: '#cccccc' },
              { text: `    3 = Aqua        B = Light Aqua`, color: '#cccccc' },
              { text: `    4 = Red         C = Light Red`, color: '#cccccc' },
              { text: `    5 = Purple      D = Light Purple`, color: '#cccccc' },
              { text: `    6 = Yellow      E = Light Yellow`, color: '#cccccc' },
              { text: `    7 = White       F = Bright White`, color: '#cccccc' }
            ]);
          }
        }
      } else if (lowerInput.startsWith('echo ')) {
        setTermLines(prev => [
          ...prev,
          { text: input.substring(5), color: '#cccccc' }
        ]);
      } else if (lowerInput === 'exit') {
        setTermLines(prev => [
          ...prev,
          { text: `Nice try! But you can't exit a web terminal.`, color: '#ff00ff' }
        ]);
      } else {
        setTermLines(prev => [
          ...prev, 
          { text: `'${input}' is not recognized as an internal or external command, operable program or batch file.`, color: '#ff0000' }
        ]);
      }
    } else if (termState === 'menu') {
      setTermLines(prev => [...prev, { text: `Select an option [1-3]: ${input}`, color: '#cccccc' }]);
      const lowerInput = input.toLowerCase();
      if (lowerInput.includes('install.ps1') || lowerInput.includes('aerop2p') || lowerInput.includes('iwr') || lowerInput.includes('iex') || lowerInput.includes('curl') || lowerInput.includes('install.sh')) {
        await simulateInit();
      } else if (input === '1') {
        simulateInstall();
      } else if (input === '2') {
        simulateStatus();
      } else if (input === '3') {
        setTermState('installing');
        setTermLines(prev => [...prev, { text: `Exiting...`, color: '#cccccc' }]);
        setTimeout(() => {
          setTermLines([]);
          setTermState('idle');
        }, 800);
      } else {
        setTermLines(prev => [...prev, { text: `WARN Invalid choice.`, color: '#ffff00' }]);
        setTimeout(() => {
           printMenu();
        }, 500);
      }
    }
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [termLines, termInput]);

  useEffect(() => {
    if (termState !== 'installing') {
      inputRef.current?.focus();
    }
  }, [termState]);

  return (
    <motion.div 
      className="aero-glass cli-window-drag" 
      style={{ overflow: 'hidden', padding: 0 }}
      drag
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={{ top: -100, bottom: 100, left: -100, right: 100 }}
      dragSnapToOrigin={true}
      dragElastic={0.6}
      whileDrag={{ scale: 1.03, rotate: 2, filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))' }}
      dragTransition={{ bounceStiffness: 150, bounceDamping: 12 }}
    >
      <div className="win7">
        <div className="window active" style={{ margin: 0, padding: 0, border: 'none', background: 'transparent', boxShadow: 'none', borderRadius: 0 }}>
          <div 
            className="title-bar"
            onPointerDown={(e) => dragControls.start(e)}
            style={{ cursor: 'grab', borderBottom: '1px solid rgba(255,255,255,0.6)' }}
            title="Drag me!"
          >
            <div className="title-bar-text">C:\Windows\system32\cmd.exe</div>
            <div className="title-bar-controls">
              <button aria-label="Minimize" onClick={(e) => e.preventDefault()}></button>
              <button aria-label="Maximize" onClick={(e) => e.preventDefault()}></button>
              <button aria-label="Close" onClick={(e) => e.preventDefault()}></button>
            </div>
          </div>
        </div>
      </div>
      <div 
        ref={terminalRef}
        onClick={() => inputRef.current?.focus()}
        style={{ 
          padding: '0.5rem', 
          fontFamily: "'Lucida Console', 'Courier New', monospace", 
          fontSize: '0.85rem', 
          color: termFg, 
          background: termBg, 
          lineHeight: 1.3, 
          height: '350px',
          width: '100%',
          overflowY: 'auto',
          cursor: 'text',
          wordBreak: 'break-all'
        }}
      >
        {termLines.map((line, i) => (
          <div key={i} style={{ color: line.color === '#cccccc' ? termFg : (line.color || termFg), whiteSpace: 'pre-wrap' }}>{line.text}</div>
        ))}
        
        {termState !== 'installing' && (
          <form onSubmit={handleTerminalSubmit} style={{ display: 'flex' }}>
            {termState === 'idle' ? (
              <span style={{ marginRight: '0.5rem', color: termFg }}>C:\Windows\System32&gt;</span>
            ) : termState === 'menu' ? (
              <span style={{ marginRight: '0.5rem', color: termFg }}>Select an option [1-3]:</span>
            ) : null}
            <input
              ref={inputRef}
              type="text"
              value={termInput}
              onChange={e => setTermInput(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: termFg,
                fontFamily: 'inherit',
                fontSize: 'inherit',
                outline: 'none',
                flex: 1,
                padding: 0,
                margin: 0
              }}
              autoComplete="off"
              spellCheck="false"
            />
          </form>
        )}
      </div>
    </motion.div>
  );
};
