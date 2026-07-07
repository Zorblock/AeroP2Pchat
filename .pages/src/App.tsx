import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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
      {/* Static Overlays as requested */}
      <img 
        src={`${import.meta.env.BASE_URL}img/bubbles.png`}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '800px', zIndex: 0, opacity: 0.8, pointerEvents: 'none', transform: 'scaleX(-1)', WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)', maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)' }}
        alt=""
      />
      
      <img 
        src={`${import.meta.env.BASE_URL}img/flares_6.png`}
        style={{ position: 'absolute', top: '-5%', left: '50%', transform: 'translateX(-50%)', width: '800px', zIndex: 20, opacity: 0.9, mixBlendMode: 'screen', pointerEvents: 'none' }}
        alt=""
      />



      <DustParticles />

      <main style={{ position: 'relative', zIndex: 10, padding: '4rem 2rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Decorative scattered clouds across the entire scrollable height */}
        <img 
          src={`${import.meta.env.BASE_URL}img/clouds_21.png`}
          style={{ position: 'absolute', top: '10%', left: '-10%', width: '500px', zIndex: -1, opacity: 0.7, pointerEvents: 'none', transform: 'rotate(-5deg)' }}
          alt=""
        />
        <img 
          src={`${import.meta.env.BASE_URL}img/clouds_21.png`}
          style={{ position: 'absolute', top: '30%', right: '-5%', width: '400px', zIndex: -1, opacity: 0.5, pointerEvents: 'none', transform: 'scaleX(-1) rotate(10deg)' }}
          alt=""
        />
        <img 
          src={`${import.meta.env.BASE_URL}img/clouds_21.png`}
          style={{ position: 'absolute', top: '55%', left: '2%', width: '300px', zIndex: -1, opacity: 0.6, pointerEvents: 'none', transform: 'scaleX(-1) rotate(-15deg)' }}
          alt=""
        />
        <img 
          src={`${import.meta.env.BASE_URL}img/clouds_21.png`}
          style={{ position: 'absolute', top: '80%', right: '10%', width: '600px', zIndex: -1, opacity: 0.8, pointerEvents: 'none', transform: 'rotate(5deg)' }}
          alt=""
        />
        <img 
          src={`${import.meta.env.BASE_URL}img/clouds_21.png`}
          style={{ position: 'absolute', top: '95%', left: '-15%', width: '700px', zIndex: -1, opacity: 0.4, pointerEvents: 'none', transform: 'scaleX(-1) rotate(-8deg)' }}
          alt=""
        />

        {/* Decorative background bubbles */}
        <img 
          src={`${import.meta.env.BASE_URL}img/bubbles_37.png`}
          style={{ position: 'absolute', top: '45%', right: '-5%', width: '500px', zIndex: -1, opacity: 0.8, pointerEvents: 'none', transform: 'rotate(-15deg)' }}
          alt=""
        />

        {/* Foreground overlapping clouds for 3D depth effect */}
        <img 
          src={`${import.meta.env.BASE_URL}img/clouds_21.png`}
          style={{ position: 'absolute', top: '25%', left: '-15%', width: '450px', zIndex: 50, opacity: 0.8, pointerEvents: 'none', transform: 'rotate(10deg)', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.2))' }}
          alt=""
        />
        <img 
          src={`${import.meta.env.BASE_URL}img/clouds_21.png`}
          style={{ position: 'absolute', top: '65%', right: '-10%', width: '550px', zIndex: 50, opacity: 0.9, pointerEvents: 'none', transform: 'scaleX(-1) rotate(-5deg)', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.2))' }}
          alt=""
        />
        <img 
          src={`${import.meta.env.BASE_URL}img/clouds_21.png`}
          style={{ position: 'absolute', top: '85%', left: '-10%', width: '400px', zIndex: 50, opacity: 0.85, pointerEvents: 'none', transform: 'rotate(15deg)', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.2))' }}
          alt=""
        />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ marginBottom: '4rem', textAlign: 'center' }}
        >
          <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10} scale={1.05} transitionSpeed={2000}>
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Aero P2P Chat" style={{ width: 140, height: 140, filter: 'drop-shadow(0 0 20px rgba(56,189,248,0.4))' }} />
          </Tilt>
          <h1 style={{ fontSize: '4.5rem', fontWeight: 800, color: '#ffffff', marginTop: '1.5rem', letterSpacing: '-0.03em', filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.5))' }}>
            Aero P2P Chat
          </h1>
          <p style={{ color: '#e2e8f0', fontSize: '1.35rem', maxWidth: '600px', margin: '1rem auto 0', lineHeight: 1.6, fontWeight: 500, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
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
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <motion.a
              href="https://github.com/Zorblock/AeroP2Pchat/releases/latest/download/Aero-P2P-Chat-Windows-x64-Setup.exe"
              whileHover={{ scale: 1.05, filter: 'brightness(1.1)' }}
              whileTap={{ scale: 0.95 }}
              onClick={triggerConfetti}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'linear-gradient(180deg, rgba(135,206,235,0.9) 0%, rgba(56,189,248,0.9) 49%, rgba(2,132,199,0.9) 50%, rgba(14,165,233,0.9) 100%)', color: 'white', padding: '1rem 2rem', borderRadius: '100px', fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.9)', boxShadow: 'inset 0 2px 5px rgba(255,255,255,0.8), 0 8px 20px rgba(2,132,199,0.3)', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
            >
              <Download size={22} />
              Windows Setup (.exe)
            </motion.a>

            <motion.a
              href="https://github.com/Zorblock/AeroP2Pchat/releases/latest/download/Aero-P2P-Chat-Linux-x64.AppImage"
              whileHover={{ scale: 1.05, filter: 'brightness(1.1)' }}
              whileTap={{ scale: 0.95 }}
              onClick={triggerConfetti}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'linear-gradient(180deg, rgba(167,243,208,0.9) 0%, rgba(52,211,153,0.9) 49%, rgba(5,150,105,0.9) 50%, rgba(16,185,129,0.9) 100%)', color: 'white', padding: '1rem 2rem', borderRadius: '100px', fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.9)', boxShadow: 'inset 0 2px 5px rgba(255,255,255,0.8), 0 8px 20px rgba(5,150,105,0.3)', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
            >
              <Download size={22} />
              Linux (.AppImage)
            </motion.a>
          </div>

          <div style={{ marginTop: '2rem', width: '100%' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', justifyContent: 'center' }}>
              <button 
                onClick={() => setInstallOs('windows')}
                style={{ background: installOs === 'windows' ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)', color: installOs === 'windows' ? '#0f172a' : '#475569', border: '1px solid rgba(255,255,255,0.8)', padding: '0.4rem 1.2rem', borderRadius: '100px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s', boxShadow: installOs === 'windows' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none' }}
              >
                Windows
              </button>
              <button 
                onClick={() => setInstallOs('linux')}
                style={{ background: installOs === 'linux' ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)', color: installOs === 'linux' ? '#0f172a' : '#475569', border: '1px solid rgba(255,255,255,0.8)', padding: '0.4rem 1.2rem', borderRadius: '100px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s', boxShadow: installOs === 'linux' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none' }}
              >
                Linux
              </button>
            </div>
            <div className="aero-glass" style={{ padding: '0.5rem 0.5rem 0.5rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.5)' }}>
              <code style={{ color: '#0369a1', fontFamily: 'monospace', flex: 1, fontSize: '0.95rem', overflowX: 'auto', whiteSpace: 'nowrap', userSelect: 'all', cursor: 'text', fontWeight: 600 }}>
                {installCommands[installOs]}
              </code>
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.8)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  navigator.clipboard.writeText(installCommands[installOs]);
                  toast.success("Command copied to clipboard!");
                }}
                style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.8)', color: '#0f172a', padding: '0.6rem 1.2rem', borderRadius: '12px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, flexShrink: 0, transition: 'background-color 0.2s', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}
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
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', width: '100%', maxWidth: '1000px', marginTop: '6rem' }}
        >
          {features.map((feat, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5, boxShadow: '0 12px 40px rgba(2,132,199,0.15)' }}
              className="aero-glass"
              style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
            >
              <div style={{ background: 'linear-gradient(135deg, #e0f2fe, #bae6fd)', color: '#0284c7', padding: '1rem', borderRadius: '16px', marginBottom: '1.5rem', display: 'inline-block', border: '1px solid #7dd3fc', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8)' }}>
                {feat.icon}
              </div>
              <h3 style={{ color: '#0f172a', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{feat.title}</h3>
              <p style={{ color: '#334155', lineHeight: 1.6, fontWeight: 500 }}>{feat.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* How It Works Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="aero-glass"
          style={{ width: '100%', maxWidth: '1000px', marginTop: '6rem', padding: '3rem' }}
        >
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>How It Works</h2>
            <p style={{ color: '#334155', fontSize: '1.15rem', maxWidth: '600px', margin: '0 auto', fontWeight: 500 }}>
              Aero P2P Chat cuts out the middleman. By utilizing WebRTC, data streams directly between you and your friend.
            </p>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ flex: '1 1 250px', textAlign: 'center', padding: '1rem' }}>
              <div style={{ background: 'linear-gradient(135deg, #bae6fd, #7dd3fc)', color: '#0284c7', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.5rem', fontWeight: 'bold', border: '2px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>1</div>
              <h4 style={{ color: '#0f172a', fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 700 }}>Open the App</h4>
              <p style={{ color: '#475569', fontSize: '1rem', fontWeight: 500 }}>Launch Aero P2P Chat and instantly get your unique, randomized Peer ID.</p>
            </div>
            <div style={{ color: '#0ea5e9', fontSize: '1.5rem', fontWeight: 'bold' }}>➜</div>
            <div style={{ flex: '1 1 250px', textAlign: 'center', padding: '1rem' }}>
              <div style={{ background: 'linear-gradient(135deg, #bae6fd, #7dd3fc)', color: '#0284c7', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.5rem', fontWeight: 'bold', border: '2px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>2</div>
              <h4 style={{ color: '#0f172a', fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 700 }}>Share ID</h4>
              <p style={{ color: '#475569', fontSize: '1rem', fontWeight: 500 }}>Send your Peer ID to a friend through any secure channel.</p>
            </div>
            <div style={{ color: '#0ea5e9', fontSize: '1.5rem', fontWeight: 'bold' }}>➜</div>
            <div style={{ flex: '1 1 250px', textAlign: 'center', padding: '1rem' }}>
              <div style={{ background: 'linear-gradient(135deg, #bae6fd, #7dd3fc)', color: '#0284c7', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.5rem', fontWeight: 'bold', border: '2px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>3</div>
              <h4 style={{ color: '#0f172a', fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 700 }}>Connect directly</h4>
              <p style={{ color: '#475569', fontSize: '1rem', fontWeight: 500 }}>They paste it in, hit connect, and the peer-to-peer tunnel is established!</p>
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
          <div className="aero-glass" style={{ padding: '2rem', borderRadius: '24px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>Powerful CLI Integration</h2>
            <p style={{ color: '#334155', fontSize: '1.15rem', marginBottom: '1.5rem', lineHeight: 1.6, fontWeight: 500 }}>
              We know developers love the terminal. That's why Aero P2P Chat installs an intelligent <code style={{ background: 'rgba(255,255,255,0.5)', padding: '0.2rem 0.4rem', borderRadius: '4px', color: '#0284c7', border: '1px solid rgba(255,255,255,0.8)' }}>aerop2p</code> command globally on both Windows and Linux.
            </p>
            <ul style={{ color: '#475569', listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontWeight: 500 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ color: '#0ea5e9', fontWeight: 'bold' }}>✓</span> Interactive update menu</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ color: '#0ea5e9', fontWeight: 'bold' }}>✓</span> Real-time version checking</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ color: '#0ea5e9', fontWeight: 'bold' }}>✓</span> Clean background uninstallation</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ color: '#0ea5e9', fontWeight: 'bold' }}>✓</span> Fast application launching</li>
            </ul>
          </div>
          
          <div className="aero-glass" style={{ overflow: 'hidden', padding: 0 }}>
            <div style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 100%)', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.6)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', textShadow: '0 1px 1px #fff' }}>Administrator: Command Prompt</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ width: '24px', height: '14px', borderRadius: '4px', background: 'linear-gradient(180deg, #fca5a5, #ef4444)', border: '1px solid #b91c1c', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.5)' }}></div>
              </div>
            </div>
            <div style={{ padding: '1.5rem', fontFamily: 'Consolas, monospace', fontSize: '0.9rem', color: '#e2e8f0', background: '#0a0f14', lineHeight: 1.6 }}>
              <div style={{ marginBottom: '0.5rem' }}>C:\Users\Admin&gt; aerop2p menu</div>
              <div style={{ color: '#9db0bb', marginBottom: '1rem' }}>
                <div style={{ color: '#a3e635' }}>Status: Installed ({installedVersion})</div>
                <div style={{ color: '#facc15' }}>Latest: {latestVersion} (Update available!)</div>
              </div>
              <div style={{ marginBottom: '0.2rem' }}>1 - <span style={{ fontWeight: 'bold' }}>Update to {latestVersion}</span></div>
              <div style={{ marginBottom: '0.2rem', color: '#f87171' }}>2 - Uninstall</div>
              <div style={{ marginBottom: '0.2rem', color: '#22d3ee' }}>3 - Check status details</div>
              <div style={{ marginBottom: '1rem', color: '#64748b' }}>4 - Exit</div>
              <div><span style={{ color: '#e2e8f0' }}>Choose an option [1-4]:</span> 1</div>
            </div>
          </div>
        </motion.div>

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="aero-glass"
          style={{ marginTop: 'auto', padding: '1rem 2rem', color: '#55707d', textAlign: 'center', fontSize: '0.9rem', borderRadius: '100px', marginBottom: '2rem' }}
        >
          <p style={{ margin: 0 }}>© {new Date().getFullYear()} <a href="https://zorblock.github.io" target="_blank" rel="noopener noreferrer" style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 600 }}>Zorblock</a>. Built with Electron, React, and WebRTC.</p>
        </motion.footer>

        {/* Decorative floating globe at the bottom */}
        <motion.img 
          src={`${import.meta.env.BASE_URL}img/globe.gif`}
          alt="Globe"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          style={{ position: 'absolute', bottom: '150px', right: '5%', width: '120px', height: '120px', zIndex: 5, borderRadius: '50%', filter: 'drop-shadow(0 4px 20px rgba(2,132,199,0.5))' }}
        />
        
        <img 
          src={`${import.meta.env.BASE_URL}img/water_1.png`}
          style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', zIndex: -1, pointerEvents: 'none', objectFit: 'cover' }}
          alt=""
        />
      </main>
    </>
  )
}

export default App
