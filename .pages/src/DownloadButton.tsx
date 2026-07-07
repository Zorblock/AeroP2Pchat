import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface DownloadButtonProps {
  url: string;
  filename: string;
  icon: React.ReactNode;
  text: string;
  colorTheme?: 'blue' | 'green';
  onClick?: () => void;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({ url, filename, icon, text, colorTheme = 'blue', onClick }) => {
  const [progress, setProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (downloading) return;
    
    if (onClick) onClick();

    setDownloading(true);
    setProgress(0);

    try {
      const response = await fetch(url);
      if (!response.body) throw new Error('ReadableStream not yet supported in this browser.');

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      let loaded = 0;

      const reader = response.body.getReader();
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          loaded += value.length;
          if (total) {
            setProgress(Math.round((loaded / total) * 100));
          } else {
            // Indeterminate progress trick (fake up to 99%)
            setProgress(Math.min(99, Math.round(loaded / 1024 / 1024))); 
          }
        }
      }

      const blob = new Blob(chunks);
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      
      setProgress(100);
      setTimeout(() => {
        setDownloading(false);
        setProgress(0);
      }, 2000);

    } catch (err) {
      console.error('Download failed:', err);
      // Fallback to normal download navigation
      window.location.href = url;
      setDownloading(false);
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
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: `${progress}%`,
          background: 'rgba(255, 255, 255, 0.3)',
          transition: 'width 0.1s linear',
          zIndex: 1
        }} />
      )}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {icon}
        {downloading ? `Downloading... ${progress}%` : text}
      </div>
    </motion.button>
  );
};
