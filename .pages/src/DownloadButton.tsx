import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface DownloadButtonProps {
  os: 'windows' | 'linux';
  icon: React.ReactNode;
  text: string;
  colorTheme?: 'blue' | 'green';
  onClick?: () => void;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({ os, icon, text, colorTheme = 'blue', onClick }) => {
  const [downloading, setDownloading] = useState(false);
  const [statusText, setStatusText] = useState('');

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (downloading) return;
    
    if (onClick) onClick();

    setDownloading(true);
    setStatusText('Verifying release...');

    try {
      const res = await fetch('https://api.github.com/repos/Zorblock/AeroP2Pchat/releases/latest');
      if (!res.ok) throw new Error('API request failed');
      const release = await res.json();
      
      const ext = os === 'windows' ? '.exe' : '.AppImage';
      const asset = release.assets.find((a: any) => a.name.endsWith(ext));

      if (!asset) {
        setStatusText('File not found!');
        setTimeout(() => setDownloading(false), 2000);
        return;
      }

      setStatusText(`Verified ${release.tag_name}. Starting...`);
      
      setTimeout(() => {
        window.location.href = asset.browser_download_url;
        setDownloading(false);
      }, 1000);

    } catch (err) {
      console.error('Verification failed:', err);
      setStatusText('Using fallback URL...');
      
      setTimeout(() => {
        const fallbackUrl = os === 'windows' 
          ? 'https://github.com/Zorblock/AeroP2Pchat/releases/latest/download/Aero-P2P-Chat-Windows-x64-Setup.exe'
          : 'https://github.com/Zorblock/AeroP2Pchat/releases/latest/download/Aero-P2P-Chat-Linux-x64.AppImage';
        window.location.href = fallbackUrl;
        setDownloading(false);
      }, 1000);
    }
  };

  return (
    <motion.button
      onClick={handleDownload}
      whileHover={!downloading ? { scale: 1.05, filter: 'brightness(1.1)' } : {}}
      whileTap={!downloading ? { scale: 0.95 } : {}}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        background: colorTheme === 'green' 
          ? 'linear-gradient(180deg, rgba(167,243,208,0.9) 0%, rgba(52,211,153,0.9) 49%, rgba(5,150,105,0.9) 50%, rgba(16,185,129,0.9) 100%)'
          : 'linear-gradient(180deg, rgba(135,206,235,0.9) 0%, rgba(56,189,248,0.9) 49%, rgba(2,132,199,0.9) 50%, rgba(14,165,233,0.9) 100%)',
        color: 'white',
        padding: '1rem 2rem',
        borderRadius: '100px',
        fontWeight: 700,
        border: '1px solid rgba(255,255,255,0.9)',
        boxShadow: 'inset 0 2px 5px rgba(255,255,255,0.8), 0 8px 20px rgba(2,132,199,0.3)',
        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        cursor: downloading ? 'default' : 'pointer',
        fontFamily: 'inherit',
        fontSize: '1rem',
        minWidth: '240px'
      }}
    >
      {downloading && (
        <motion.div 
          initial={{ opacity: 0, width: '0%' }}
          animate={{ opacity: 1, width: '100%' }}
          transition={{ duration: 1, ease: "easeInOut" }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            background: 'rgba(255, 255, 255, 0.25)',
            zIndex: 1
          }} 
        />
      )}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {icon}
        {downloading ? statusText : text}
      </div>
    </motion.button>
  );
};
