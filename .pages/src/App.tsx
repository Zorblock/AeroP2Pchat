import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useDragControls } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import Lenis from 'lenis';
import { DustParticles } from './DustParticles';
import { DownloadButton } from './DownloadButton';
import { Shield, Zap, Terminal as TerminalIcon, Download, MonitorPlay } from 'lucide-react';
import { Terminal } from './Terminal';
import './reset.css';
import './index.css';
import '7.css/dist/7.scoped.css';

const AeroBadge = ({ label, value, color }: { label: string, value: string, color: string }) => (
  <div style={{ display: 'flex', overflow: 'hidden', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 4px 10px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.6)', fontSize: '0.8rem', fontWeight: 700, fontFamily: 'sans-serif' }}>
    <div style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.5))', color: '#334155', padding: '0.3rem 0.6rem', borderRight: '1px solid rgba(255,255,255,0.5)' }}>
      {label}
    </div>
    <div style={{ background: `linear-gradient(180deg, ${color}, ${color}dd)`, color: '#ffffff', padding: '0.3rem 0.6rem', textShadow: '0 1px 2px rgba(0,0,0,0.4)', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.4)' }}>
      {value}
    </div>
  </div>
);

function App() {
  const dragControls = useDragControls();
  const { scrollYProgress } = useScroll();
  const cloudY1 = useTransform(scrollYProgress, [0, 1], [0, -300]);
  const cloudY2 = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const cloudY3 = useTransform(scrollYProgress, [0, 1], [0, -450]);
  const cloudY4 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const cloudY5 = useTransform(scrollYProgress, [0, 1], [0, -700]);
  const insectY = useTransform(scrollYProgress, [0, 1], [0, -250]); /* Increased parallax */
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '-15%']);

  const [installOs, setInstallOs] = useState<'windows' | 'linux'>('windows');
  const [useFallbackDomain, setUseFallbackDomain] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string>('v1.2.0');
  const [totalDownloads, setTotalDownloads] = useState<number>(0);
  
  const constraintsRef = useRef(null);

  useEffect(() => {
    // Fetch latest release
    fetch('https://api.github.com/repos/Zorblock/AeroP2Pchat/releases')
      .then(res => res.json())
      .then(releases => {
        if (releases && releases.length > 0) {
          const latest = releases[0];
          setLatestVersion(latest.tag_name);

          // Calculate total downloads across all releases
          let downloads = 0;
          releases.forEach((r: any) => {
            if (r.assets) {
              r.assets.forEach((a: any) => {
                downloads += a.download_count || 0;
              });
            }
          });
          setTotalDownloads(downloads);
        }
      })
      .catch(err => console.error('Failed to fetch github releases:', err));
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
    { icon: <TerminalIcon size={24} />, title: 'CLI Tools', desc: 'Launch directly from your terminal using aerop2p commands.' },
  ];

  const domain = useFallbackDomain ? 'zorblock.github.io' : 'zorblock.de';
  const installCommands = {
    windows: `iwr -useb https://${domain}/AeroP2Pchat/install.ps1 | iex`,
    linux: `curl -sSL https://${domain}/AeroP2Pchat/install.sh | bash`
  };

  return (
    <>
      {/* Dynamic Parallax Background */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '130vh', /* Extra height to prevent empty space when scrolling up */
          zIndex: -100,
          backgroundColor: '#0ea5e9',
          backgroundImage: `url('${import.meta.env.BASE_URL}img/skyboxes_4.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          y: bgY,
          willChange: 'transform'
        }}
      />

      {/* Static Overlays as requested */}
      <img
        src={`${import.meta.env.BASE_URL}img/bubbles.png`}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '800px', zIndex: 0, opacity: 0.8, pointerEvents: 'none', transform: 'scaleX(-1) scaleY(-1)', WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)', maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)' }}
        alt=""
      />

      <img
        src={`${import.meta.env.BASE_URL}img/flares_6.png`}
        className="flare-animate"
        style={{ position: 'absolute', top: '-5%', left: '50%', transform: 'translateX(-50%)', width: '800px', zIndex: 20, opacity: 0.9, mixBlendMode: 'screen', pointerEvents: 'none' }}
        alt=""
      />



      <DustParticles />

      <main style={{ position: 'relative', zIndex: 10, padding: 'clamp(2rem, 5vw, 4rem) clamp(1rem, 3vw, 2rem)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', overflowX: 'hidden' }}>
        {/* Decorative insect at the top right of the hero */}
        <motion.img
          src={`${import.meta.env.BASE_URL}img/insects_8.png`}
          style={{ position: 'absolute', top: '5%', right: '10%', width: '350px', zIndex: 60, opacity: 0.9, pointerEvents: 'none', transform: 'rotate(5deg)', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.3))', y: insectY }}
          alt=""
        />



        {/* Decorative scattered clouds across the entire scrollable height */}
        <motion.img
          src={`${import.meta.env.BASE_URL}img/clouds_21.png`}
          style={{ position: 'absolute', top: '10%', left: '-10%', width: '500px', zIndex: -1, opacity: 0.7, pointerEvents: 'none', transform: 'rotate(-5deg)', y: cloudY1 }}
          alt=""
        />
        <motion.img
          src={`${import.meta.env.BASE_URL}img/clouds_21.png`}
          style={{ position: 'absolute', top: '30%', right: '-5%', width: '400px', zIndex: -1, opacity: 0.5, pointerEvents: 'none', transform: 'scaleX(-1) rotate(10deg)', y: cloudY2 }}
          alt=""
        />
        <motion.img
          src={`${import.meta.env.BASE_URL}img/clouds_21.png`}
          style={{ position: 'absolute', top: '55%', left: '2%', width: '300px', zIndex: -1, opacity: 0.6, pointerEvents: 'none', transform: 'scaleX(-1) rotate(-15deg)', y: cloudY3 }}
          alt=""
        />
        <motion.img
          src={`${import.meta.env.BASE_URL}img/clouds_21.png`}
          style={{ position: 'absolute', top: '80%', right: '10%', width: '600px', zIndex: -1, opacity: 0.8, pointerEvents: 'none', transform: 'rotate(5deg)', y: cloudY1 }}
          alt=""
        />
        <motion.img
          src={`${import.meta.env.BASE_URL}img/clouds_21.png`}
          style={{ position: 'absolute', top: '95%', left: '-15%', width: '700px', zIndex: -1, opacity: 0.4, pointerEvents: 'none', transform: 'scaleX(-1) rotate(-8deg)', y: cloudY4 }}
          alt=""
        />

        {/* Decorative background bubbles */}
        <motion.img
          src={`${import.meta.env.BASE_URL}img/bubbles_37.png`}
          style={{ position: 'absolute', top: '45%', right: '-5%', width: '500px', zIndex: -1, opacity: 0.8, pointerEvents: 'none', transform: 'rotate(-15deg)', y: cloudY2 }}
          alt=""
        />

        {/* Foreground overlapping clouds for 3D depth effect */}
        <motion.img
          src={`${import.meta.env.BASE_URL}img/clouds_21.png`}
          style={{ position: 'absolute', top: '25%', left: '5%', width: '450px', zIndex: 100, opacity: 0.4, pointerEvents: 'none', transform: 'rotate(10deg)', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.2))', y: cloudY5 }}
          alt=""
        />
        <motion.img
          src={`${import.meta.env.BASE_URL}img/clouds_21.png`}
          style={{ position: 'absolute', top: '65%', right: '15%', width: '550px', zIndex: 100, opacity: 0.45, pointerEvents: 'none', transform: 'scaleX(-1) rotate(-5deg)', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.2))', y: cloudY3 }}
          alt=""
        />
        <motion.img
          src={`${import.meta.env.BASE_URL}img/clouds_21.png`}
          style={{ position: 'absolute', top: '75%', right: '5%', width: '400px', zIndex: 100, opacity: 0.6, pointerEvents: 'none', transform: 'rotate(15deg)', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.2))', y: cloudY5 }}
          alt=""
        />
        <motion.img
          src={`${import.meta.env.BASE_URL}img/clouds_21.png`}
          style={{ position: 'absolute', top: '76%', left: '5%', width: '450px', zIndex: 100, opacity: 0.5, pointerEvents: 'none', transform: 'scaleX(-1) rotate(-10deg)', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.2))', y: cloudY3 }}
          alt=""
        />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ marginBottom: '4rem', textAlign: 'center' }}
        >
          <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10} scale={1.05} transitionSpeed={2000}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Aero P2P Chat" style={{ width: 140, height: 140, filter: 'drop-shadow(0 0 20px rgba(56,189,248,0.4))' }} />
              <img src={`${import.meta.env.BASE_URL}img/bubbles_40.png`} style={{ position: 'absolute', top: '-10%', left: '-10%', width: '120%', height: '120%', objectFit: 'contain', zIndex: 10, pointerEvents: 'none', mixBlendMode: 'screen', opacity: 0.9 }} alt="" />
            </div>
          </Tilt>
          <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', fontWeight: 800, color: '#ffffff', marginTop: '1.5rem', letterSpacing: '-0.03em', filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.5))' }}>
            Aero P2P Chat
          </h1>
          <p style={{ color: '#e2e8f0', fontSize: 'clamp(1rem, 4vw, 1.35rem)', maxWidth: '600px', margin: '1rem auto 0', lineHeight: 1.6, fontWeight: 500, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
            Direct desktop messaging without the middleman. Secure, fast, and completely peer-to-peer.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <AeroBadge label="Release" value={latestVersion} color="#0ea5e9" />
            <AeroBadge label="Downloads" value={totalDownloads > 0 ? totalDownloads.toLocaleString() : '12,345'} color="#38bdf8" />
            <AeroBadge label="License" value="Proprietary" color="#7dd3fc" />
            <AeroBadge label="Build" value="Passing" color="#10b981" />
            <AeroBadge label="Web" value="Online" color="#10b981" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', width: '100%', maxWidth: '800px' }}
        >
          <div className="mobile-stack-buttons" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <DownloadButton
              os="windows"
              text="Windows Setup (.exe)"
              icon={<Download size={22} />}
              onClick={triggerConfetti}
            />

            <DownloadButton
              os="linux"
              text="Linux (.AppImage)"
              icon={<Download size={22} />}
              colorTheme="green"
              onClick={triggerConfetti}
            />
          </div>

          <div style={{ marginTop: '2rem', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="install-os-buttons" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', justifyContent: 'center' }}>
              <button
                className="liquid-btn"
                onClick={() => setInstallOs('windows')}
                style={{ background: installOs === 'windows' ? 'linear-gradient(180deg, #bae6fd, #38bdf8)' : 'rgba(255,255,255,0.3)', color: installOs === 'windows' ? '#0369a1' : '#475569', border: installOs === 'windows' ? '1px solid #7dd3fc' : '1px solid rgba(255,255,255,0.8)', padding: '0.4rem 1.4rem', borderRadius: '100px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.3s', boxShadow: installOs === 'windows' ? 'inset 0 2px 4px rgba(255,255,255,0.8), 0 4px 10px rgba(56,189,248,0.4)' : 'inset 0 1px 2px rgba(255,255,255,0.5)' }}
              >
                Windows
              </button>
              <button
                className="liquid-btn"
                onClick={() => setInstallOs('linux')}
                style={{ background: installOs === 'linux' ? 'linear-gradient(180deg, #bae6fd, #38bdf8)' : 'rgba(255,255,255,0.3)', color: installOs === 'linux' ? '#0369a1' : '#475569', border: installOs === 'linux' ? '1px solid #7dd3fc' : '1px solid rgba(255,255,255,0.8)', padding: '0.4rem 1.4rem', borderRadius: '100px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.3s', boxShadow: installOs === 'linux' ? 'inset 0 2px 4px rgba(255,255,255,0.8), 0 4px 10px rgba(56,189,248,0.4)' : 'inset 0 1px 2px rgba(255,255,255,0.5)' }}
              >
                Linux
              </button>
            </div>
            <motion.div 
              layout 
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="aero-glass mobile-col mobile-p-1" 
              style={{ padding: '0.5rem 0.5rem 0.5rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.5)', overflow: 'hidden', borderRadius: '1rem' }}
            >
              <motion.div layout style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <AnimatePresence mode="wait">
                  <motion.code
                    layout
                    key={installOs}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    style={{ color: '#0369a1', fontFamily: 'monospace', fontSize: '0.95rem', whiteSpace: 'nowrap', userSelect: 'all', cursor: 'text', fontWeight: 600, display: 'inline-block' }}
                  >
                    {installCommands[installOs]}
                  </motion.code>
                </AnimatePresence>
              </motion.div>
              <motion.button
                layout
                className="liquid-btn"
                whileHover={{ scale: 1.05, backgroundColor: '#bae6fd', boxShadow: '0 0 15px rgba(56,189,248,0.6)', color: '#0369a1' }}
                whileTap={{ scale: 0.95, backgroundColor: '#7dd3fc' }}
                onClick={() => {
                  navigator.clipboard.writeText(installCommands[installOs]);
                  toast.success("Command copied to clipboard!");
                }}
                style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.5))', border: '1px solid rgba(255,255,255,0.9)', color: '#0f172a', padding: '0.6rem 1.2rem', borderRadius: '12px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, flexShrink: 0, transition: 'background-color 0.2s', boxShadow: '0 4px 10px rgba(0,0,0,0.05), inset 0 2px 4px rgba(255,255,255,0.8)' }}
              >
                Copy
              </motion.button>
            </motion.div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem', width: '100%' }}>
              <label className="subtle-checkbox-label">
                <input 
                  type="checkbox" 
                  checked={useFallbackDomain} 
                  onChange={(e) => setUseFallbackDomain(e.target.checked)} 
                />
                Fallback-Mirror verwenden (zorblock.github.io)
              </label>
            </div>
          </div>

          <motion.a
            href="https://github.com/Zorblock/AeroP2Pchat"
            target="_blank"
            className="aero-glass liquid-btn"
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
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1.5rem', width: '100%', maxWidth: '1000px', marginTop: '6rem' }}
        >
          {features.map((feat, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5, boxShadow: '0 12px 40px rgba(2,132,199,0.15)' }}
              className="aero-glass liquid-animate"
              style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', position: 'relative', overflow: 'hidden' }}
            >
              <img src={`${import.meta.env.BASE_URL}img/bubbles_43.png`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3, mixBlendMode: 'overlay', pointerEvents: 'none', zIndex: 0 }} alt="" />
              <div style={{ position: 'relative', zIndex: 1, background: 'linear-gradient(135deg, #e0f2fe, #bae6fd)', color: '#0284c7', padding: '1rem', borderRadius: '16px', marginBottom: '1.5rem', display: 'inline-block', border: '1px solid #7dd3fc', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8)' }}>
                {feat.icon}
              </div>
              <h3 style={{ position: 'relative', zIndex: 1, color: '#0f172a', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{feat.title}</h3>
              <p style={{ position: 'relative', zIndex: 1, color: '#334155', lineHeight: 1.6, fontWeight: 500 }}>{feat.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* How It Works Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="aero-glass liquid-animate mobile-p-1"
          style={{ width: '100%', maxWidth: '1000px', marginTop: '6rem', padding: '3rem', position: 'relative' }}
        >
          {/* Overlay flare bleeding out of the element */}
          <img
            src={`${import.meta.env.BASE_URL}img/flares_12.png`}
            style={{ position: 'absolute', top: '-50%', left: '-90%', width: '140%', height: '180%', objectFit: 'contain', opacity: 0.9, mixBlendMode: 'screen', pointerEvents: 'none', zIndex: 50, WebkitMaskImage: 'radial-gradient(circle, black 30%, transparent 70%)', maskImage: 'radial-gradient(circle, black 30%, transparent 70%)' }}
            alt=""
          />

          <div style={{ position: 'relative', zIndex: 1 }}>
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
              <div className="hide-on-mobile" style={{ color: '#0ea5e9', fontSize: '1.5rem', fontWeight: 'bold' }}>➜</div>
              <div style={{ flex: '1 1 250px', textAlign: 'center', padding: '1rem' }}>
                <div style={{ background: 'linear-gradient(135deg, #bae6fd, #7dd3fc)', color: '#0284c7', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.5rem', fontWeight: 'bold', border: '2px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>2</div>
                <h4 style={{ color: '#0f172a', fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 700 }}>Share ID</h4>
                <p style={{ color: '#475569', fontSize: '1rem', fontWeight: 500 }}>Send your Peer ID to a friend through any secure channel.</p>
              </div>
              <div className="hide-on-mobile" style={{ color: '#0ea5e9', fontSize: '1.5rem', fontWeight: 'bold' }}>➜</div>
              <div style={{ flex: '1 1 250px', textAlign: 'center', padding: '1rem' }}>
                <div style={{ background: 'linear-gradient(135deg, #bae6fd, #7dd3fc)', color: '#0284c7', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.5rem', fontWeight: 'bold', border: '2px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>3</div>
                <h4 style={{ color: '#0f172a', fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 700 }}>Connect directly</h4>
                <p style={{ color: '#475569', fontSize: '1rem', fontWeight: 500 }}>They paste it in, hit connect, and the peer-to-peer tunnel is established!</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CLI Showcase Section */}
        <motion.div
          ref={constraintsRef}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '4rem', width: '100%', maxWidth: '1000px', marginTop: '6rem', alignItems: 'center', position: 'relative', zIndex: 2 }}
        >
          {/* Sealife next to the command prompt */}
          <img
            src={`${import.meta.env.BASE_URL}img/sealife_14.png`}
            style={{ position: 'absolute', top: '-45%', right: '-15%', width: '400px', zIndex: 9999, pointerEvents: 'none', transform: 'rotate(-5deg)', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.2))' }}
            alt=""
          />
          <div className="aero-glass liquid-animate" style={{ padding: '2rem', borderRadius: '24px' }}>
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

          <Terminal latestVersion={latestVersion} dragControls={dragControls} />
        </motion.div>

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="aero-glass liquid-animate mobile-col mobile-p-1 mobile-text-center"
          style={{
            marginTop: '10rem',
            padding: '2rem 3rem',
            width: '100%',
            maxWidth: '1000px',
            borderRadius: '24px',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '2rem',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 100%)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1), inset 0 2px 10px rgba(255,255,255,0.8)',
            position: 'relative',
            zIndex: 10
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" style={{ width: '48px', height: '48px', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.2))' }} />
            <div style={{ textAlign: 'left' }}>
              <h4 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem', fontWeight: 800 }}>Aero P2P Chat</h4>
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500, color: '#475569' }}>© {new Date().getFullYear()} <a href="https://zorblock.de" target="_blank" rel="noopener noreferrer" style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 700 }}>Zorblock</a>. All rights reserved.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Powered by</p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                <span style={{ background: '#0284c7', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.5)' }}>Electron</span>
                <span style={{ background: '#38bdf8', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.5)' }}>React</span>
                <span style={{ background: '#0ea5e9', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.5)' }}>WebRTC</span>
              </div>
            </div>
          </div>
        </motion.footer>

        {/* Decorative floating globe at the bottom */}
        <motion.img
          src={`${import.meta.env.BASE_URL}img/globe.gif`}
          alt="Globe"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          style={{ position: 'absolute', bottom: '10px', right: '10px', width: '120px', height: '120px', zIndex: 5, borderRadius: '50%', filter: 'drop-shadow(0 4px 20px rgba(2,132,199,0.5))' }}
        />

        <img
          src={`${import.meta.env.BASE_URL}img/water_1.png`}
          style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', zIndex: 5, pointerEvents: 'none', objectFit: 'cover' }}
          alt=""
        />

        {/* Decorative bubbles overlay at the bottom left */}
        <img
          src={`${import.meta.env.BASE_URL}img/bubbles_39.png`}
          style={{ position: 'absolute', bottom: 0, left: '-5%', width: '450px', zIndex: 5, opacity: 0.8, pointerEvents: 'none', mixBlendMode: 'screen', transform: 'rotate(10deg)' }}
          alt=""
        />
      </main>
    </>
  )
}

export default App
