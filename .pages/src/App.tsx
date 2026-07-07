import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import Lenis from 'lenis';
import { DustParticles } from './DustParticles';
import { Download, MonitorPlay, Shield, Zap, Terminal } from 'lucide-react';
import './reset.css';
import './index.css';

function App() {
  const [installOs, setInstallOs] = useState<'windows' | 'linux'>(
    typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('windows') ? 'windows' : 'linux'
  );
  const [latestVersion, setLatestVersion] = useState('v26.28.0');
  const [installedVersion, setInstalledVersion] = useState('v26.27.0');

  useEffect(() => {
    fetch('https://api.github.com/repos/Zorblock/AeroP2Pchat/releases/latest')
      .then(res => res.json())
      .then(data => {
        if (data && data.tag_name) {
          const latest = data.tag_name;
          setLatestVersion(latest);
          
          const parts = latest.split('.');
          if (parts.length === 3) {
            const patch = parseInt(parts[2], 10);
            if (!isNaN(patch) && patch > 0) {
              parts[2] = (patch - 1).toString();
            } else {
               const minor = parseInt(parts[1], 10);
               if (!isNaN(minor) && minor > 0) {
                 parts[1] = (minor - 1).toString();
                 parts[2] = '0';
               }
            }
            setInstalledVersion(parts.join('.'));
          }
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
    });
    return () => lenis.destroy();
  }, []);

  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '10%']);

  const v1Y = useTransform(scrollYProgress, [0, 1], ['0vh', '30vh']);
  const v1Rotate = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const v2Y = useTransform(scrollYProgress, [0, 1], ['0vh', '-40vh']);
  const v2Rotate = useTransform(scrollYProgress, [0, 1], [0, -180]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#0ea5e9', '#38bdf8', '#7dd3fc']
    });
  };

  const features = [
    { icon: <MonitorPlay size={24} />, title: 'Screen Sharing', desc: 'Share your screen in high quality with zero latency.' },
    { icon: <Shield size={24} />, title: 'Direct P2P', desc: 'No servers in the middle. Your connection is direct and secure.' },
    { icon: <Zap size={24} />, title: 'Lightning Fast', desc: 'Built on WebRTC and Electron for native desktop performance.' },
    { icon: <Terminal size={24} />, title: 'CLI Tools', desc: 'Launch directly from your terminal using aerop2p commands.' },
  ];

  const installCommands = {
    windows: "irm https://zorblock.github.io/AeroP2Pchat/install.ps1 | iex",
    linux: "bash <(curl -s https://zorblock.github.io/AeroP2Pchat/install.sh)"
  };

  return (
    <>
      <motion.div
        style={{
          position: 'fixed',
          top: '-15vh',
          left: 0,
          right: 0,
          bottom: '-15vh',
          backgroundImage: `linear-gradient(to bottom, rgba(7, 11, 16, 0.7), rgba(19, 28, 38, 0.98)), url(${import.meta.env.BASE_URL}background.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          y: backgroundY,
          zIndex: 0,
        }}
      />

      <DustParticles />

      {/* Decorative background shapes */}
      <motion.div
        style={{
          position: 'fixed',
          top: '20%',
          left: '10%',
          y: v1Y,
          rotate: v1Rotate,
          zIndex: 1,
          opacity: 0.06,
          pointerEvents: 'none',
          width: '300px',
          height: '300px',
        }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}logo.png`} 
          alt="" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'contain',
            filter: 'grayscale(100%) sepia(100%) hue-rotate(170deg) saturate(400%) brightness(1.2)'
          }} 
        />
      </motion.div>

      <motion.div
        style={{
          position: 'fixed',
          bottom: '10%',
          right: '5%',
          y: v2Y,
          rotate: v2Rotate,
          zIndex: 1,
          opacity: 0.06,
          pointerEvents: 'none',
          width: '400px',
          height: '400px',
        }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}logo.png`} 
          alt="" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'contain',
            filter: 'grayscale(100%) sepia(100%) hue-rotate(170deg) saturate(400%) brightness(1.2)'
          }} 
        />
      </motion.div>

      <main style={{ position: 'relative', zIndex: 10, padding: '4rem 2rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ marginBottom: '4rem', textAlign: 'center' }}
        >
          <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10} scale={1.05} transitionSpeed={2000}>
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Aero P2P Chat" style={{ width: 140, height: 140, filter: 'drop-shadow(0 0 20px rgba(56,189,248,0.4))' }} />
          </Tilt>
          <h1 style={{ fontSize: '4rem', fontWeight: 800, color: '#fff', marginTop: '1.5rem', letterSpacing: '-0.03em', background: 'linear-gradient(to right, #fff, #7dd3fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Aero P2P Chat
          </h1>
          <p style={{ color: '#9db0bb', fontSize: '1.25rem', maxWidth: '600px', margin: '1rem auto 0', lineHeight: 1.6 }}>
            Direct desktop messaging without the middleman. Secure, fast, and completely peer-to-peer.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <img src="https://img.shields.io/github/v/release/Zorblock/AeroP2Pchat?style=flat-square&color=0ea5e9" alt="Latest Release" />
            <img src="https://img.shields.io/github/downloads/Zorblock/AeroP2Pchat/total?style=flat-square&color=38bdf8" alt="Total Downloads" />
            <img src="https://img.shields.io/badge/License-Proprietary-7dd3fc?style=flat-square" alt="License: Proprietary" />
            <img src="https://img.shields.io/github/actions/workflow/status/Zorblock/AeroP2Pchat/build.yml?style=flat-square&label=Build" alt="Build Status" />
            <img src="https://img.shields.io/github/actions/workflow/status/Zorblock/AeroP2Pchat/pages.yml?style=flat-square&label=Web" alt="Web Status" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', width: '100%', maxWidth: '600px' }}
        >
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <motion.a
              href="https://github.com/Zorblock/AeroP2Pchat/releases/latest/download/Aero-P2P-Chat-Windows-x64-Setup.exe"
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(14,165,233,0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={triggerConfetti}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: 'white', padding: '1rem 2rem', borderRadius: '100px', fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <Download size={20} />
              Windows Setup (.exe)
            </motion.a>

            <motion.a
              href="https://github.com/Zorblock/AeroP2Pchat/releases/latest/download/Aero-P2P-Chat-Linux-x64.AppImage"
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(14,165,233,0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={triggerConfetti}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: 'white', padding: '1rem 2rem', borderRadius: '100px', fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <Download size={20} />
              Linux (.AppImage)
            </motion.a>
          </div>

          <div style={{ marginTop: '1rem', width: '100%' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', justifyContent: 'center' }}>
              <button 
                onClick={() => setInstallOs('windows')}
                style={{ background: installOs === 'windows' ? 'rgba(56,189,248,0.2)' : 'transparent', color: installOs === 'windows' ? '#38bdf8' : '#9db0bb', border: 'none', padding: '0.4rem 1rem', borderRadius: '100px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s' }}
              >
                Windows
              </button>
              <button 
                onClick={() => setInstallOs('linux')}
                style={{ background: installOs === 'linux' ? 'rgba(56,189,248,0.2)' : 'transparent', color: installOs === 'linux' ? '#38bdf8' : '#9db0bb', border: 'none', padding: '0.4rem 1rem', borderRadius: '100px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s' }}
              >
                Linux / macOS
              </button>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <code style={{ color: '#a3e635', fontFamily: 'monospace', flex: 1, fontSize: '0.9rem', overflowX: 'auto', whiteSpace: 'nowrap', userSelect: 'all', cursor: 'text' }}>
                {installCommands[installOs]}
              </code>
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(56,189,248,0.2)', color: '#38bdf8' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  navigator.clipboard.writeText(installCommands[installOs]);
                  toast.success("Command copied to clipboard!");
                }}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', flexShrink: 0, transition: 'background-color 0.2s, color 0.2s' }}
              >
                Copy
              </motion.button>
            </div>
          </div>

          <motion.a
            href="https://github.com/Zorblock/AeroP2Pchat"
            target="_blank"
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.95 }}
            style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '100px', fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            View Source on GitHub
          </motion.a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', width: '100%', maxWidth: '1000px', marginTop: '6rem' }}
        >
          {features.map((feat, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.08)' }}
              style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
            >
              <div style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', padding: '1rem', borderRadius: '16px', marginBottom: '1.5rem', display: 'inline-block' }}>
                {feat.icon}
              </div>
              <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>{feat.title}</h3>
              <p style={{ color: '#9db0bb', lineHeight: 1.5 }}>{feat.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* How It Works Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          style={{ width: '100%', maxWidth: '1000px', marginTop: '6rem', padding: '3rem', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>How It Works</h2>
            <p style={{ color: '#9db0bb', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
              Aero P2P Chat cuts out the middleman. By utilizing WebRTC, data streams directly between you and your friend.
            </p>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ flex: '1 1 250px', textAlign: 'center', padding: '1rem' }}>
              <div style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>1</div>
              <h4 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Open the App</h4>
              <p style={{ color: '#9db0bb', fontSize: '0.95rem' }}>Launch Aero P2P Chat and instantly get your unique, randomized Peer ID.</p>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.2)' }}>➜</div>
            <div style={{ flex: '1 1 250px', textAlign: 'center', padding: '1rem' }}>
              <div style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>2</div>
              <h4 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Share ID</h4>
              <p style={{ color: '#9db0bb', fontSize: '0.95rem' }}>Send your Peer ID to a friend through any secure channel.</p>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.2)' }}>➜</div>
            <div style={{ flex: '1 1 250px', textAlign: 'center', padding: '1rem' }}>
              <div style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>3</div>
              <h4 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Connect directly</h4>
              <p style={{ color: '#9db0bb', fontSize: '0.95rem' }}>They paste it in, hit connect, and the peer-to-peer tunnel is established!</p>
            </div>
          </div>
        </motion.div>

        {/* CLI Showcase Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', width: '100%', maxWidth: '1000px', marginTop: '6rem', alignItems: 'center' }}
        >
          <div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>Powerful CLI Integration</h2>
            <p style={{ color: '#9db0bb', fontSize: '1.1rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              We know developers love the terminal. That's why Aero P2P Chat installs an intelligent <code style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.4rem', borderRadius: '4px', color: '#38bdf8' }}>aerop2p</code> command globally on both Windows and Linux.
            </p>
            <ul style={{ color: '#9db0bb', listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ color: '#38bdf8' }}>✓</span> Interactive update menu</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ color: '#38bdf8' }}>✓</span> Real-time version checking</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ color: '#38bdf8' }}>✓</span> Clean background uninstallation</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ color: '#38bdf8' }}>✓</span> Fast application launching</li>
            </ul>
          </div>
          
          <div style={{ background: '#0a0f14', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
            <div style={{ background: '#131c26', padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f' }}></div>
            </div>
            <div style={{ padding: '1.5rem', fontFamily: 'monospace', fontSize: '0.9rem', color: '#e2e8f0', lineHeight: 1.6 }}>
              <div style={{ marginBottom: '0.5rem' }}><span style={{ color: '#38bdf8' }}>$</span> aerop2p menu</div>
              <div style={{ color: '#9db0bb', marginBottom: '1rem' }}>
                <div style={{ color: '#a3e635' }}>Status: Installed ({installedVersion})</div>
                <div style={{ color: '#facc15' }}>Latest: {latestVersion} (Update available!)</div>
              </div>
              <div style={{ marginBottom: '0.2rem' }}>1 - <span style={{ fontWeight: 'bold' }}>Update to {latestVersion}</span></div>
              <div style={{ marginBottom: '0.2rem', color: '#f87171' }}>2 - Uninstall</div>
              <div style={{ marginBottom: '0.2rem', color: '#22d3ee' }}>3 - Check status details</div>
              <div style={{ marginBottom: '1rem', color: '#64748b' }}>4 - Exit</div>
              <div><span style={{ color: '#38bdf8' }}>Choose an option [1-4]:</span> 1</div>
            </div>
          </div>
        </motion.div>

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          style={{ marginTop: 'auto', paddingTop: '6rem', color: '#55707d', textAlign: 'center', fontSize: '0.9rem' }}
        >
          <p>© {new Date().getFullYear()} <a href="https://zorblock.github.io" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}>Zorblock</a>. Built with Electron, React, and WebRTC.</p>
        </motion.footer>

      </main>
    </>
  )
}

export default App
