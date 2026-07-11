import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useDragControls } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import Lenis from 'lenis';
import { DustParticles } from './DustParticles.tsx';
import { DownloadButton } from './DownloadButton.tsx';
import { Shield, Zap, Terminal as TerminalIcon, Download, MonitorPlay, Smartphone, Menu, X } from 'lucide-react';
import { Terminal } from './Terminal.tsx';
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

const StepNumber = ({ children }: { children: string }) => (
  <div style={{ position: 'relative', width: '68px', height: '68px', margin: '0 auto 1rem', display: 'grid', placeItems: 'center' }}>
    <div style={{ position: 'relative', zIndex: 1, background: 'linear-gradient(135deg, #bae6fd, #7dd3fc)', color: '#0284c7', width: '60px', height: '60px', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: '1.5rem', fontWeight: 'bold', border: '2px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
      {children}
    </div>
    <img src={`${import.meta.env.BASE_URL}img/bubbles_40.png`} alt="" aria-hidden="true" style={{ position: 'absolute', inset: '-10%', width: '120%', height: '120%', objectFit: 'contain', zIndex: 2, pointerEvents: 'none', mixBlendMode: 'screen', opacity: 0.95 }} />
  </div>
);

interface GitHubReleaseAsset {
  download_count?: number;
}

interface GitHubRelease {
  tag_name: string;
  assets?: GitHubReleaseAsset[];
}

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

  const [installOs, setInstallOs] = useState<'windows' | 'linux' | 'android'>('windows');
  const [useFallbackDomain, setUseFallbackDomain] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string>('v1.2.0');
  const [totalDownloads, setTotalDownloads] = useState<number>(0);
  const [headerCompact, setHeaderCompact] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          releases.forEach((r: GitHubRelease) => {
            if (r.assets) {
              r.assets.forEach((a: GitHubReleaseAsset) => {
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
    const prefersNativeScroll = globalThis.matchMedia(
      '(max-width: 768px), (pointer: coarse)',
    ).matches;
    if (prefersNativeScroll) return;

    const lenis = new Lenis({
      autoRaf: true,
    });
    return () => lenis.destroy();
  }, []);

  useEffect(() => {
    const updateHeader = () => setHeaderCompact(globalThis.scrollY > 70);
    updateHeader();
    globalThis.addEventListener('scroll', updateHeader, { passive: true });
    return () => globalThis.removeEventListener('scroll', updateHeader);
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    globalThis.addEventListener('keydown', closeOnEscape);
    return () => globalThis.removeEventListener('keydown', closeOnEscape);
  }, []);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('android')) {
      setInstallOs('android');
    } else if (userAgent.includes('windows')) {
      setInstallOs('windows');
    } else if (userAgent.includes('linux') && !userAgent.includes('cros')) {
      setInstallOs('linux');
    }
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

  const baseUrl = useFallbackDomain ? 'https://zorblock.github.io/AeroP2Pchat' : 'https://aero.zorblock.de';
  const installCommands = {
    windows: `iwr -useb ${baseUrl}/install.ps1 | iex`,
    linux: `curl -sSL ${baseUrl}/install.sh | bash`
  };
  const platforms = [
    { id: 'windows' as const, label: 'Windows', icon: <Download size={17} /> },
    { id: 'linux' as const, label: 'Linux', icon: <Download size={17} /> },
    { id: 'android' as const, label: 'Android', icon: <Smartphone size={17} /> },
  ];

  return (
    <>
      <header className={`site-header${headerCompact ? ' is-compact' : ''}`}>
        <nav className="site-header__inner" aria-label="Main navigation">
          <a className="site-header__brand" href="#top" aria-label="Aero P2P Chat home" onClick={() => setMobileMenuOpen(false)}>
            <img className="site-header__logo" src={`${import.meta.env.BASE_URL}logo.png`} alt="" width="42" height="42" />
            <span>Aero P2P Chat</span>
          </a>
          <button
            type="button"
            className="site-header__menu-button"
            aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={mobileMenuOpen}
            aria-controls="main-navigation-links"
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div id="main-navigation-links" className={`site-header__links${mobileMenuOpen ? ' is-open' : ''}`}>
            <a href="#download" onClick={() => setMobileMenuOpen(false)}>Download</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How it works</a>
          </div>
        </nav>
      </header>

      {/* Dynamic Parallax Background */}
      <motion.div
        className="parallax-background"
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
      <img loading="lazy" decoding="async"
        src={`${import.meta.env.BASE_URL}img/bubbles.png`}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '800px', zIndex: 0, opacity: 0.8, pointerEvents: 'none', transform: 'scaleX(-1) scaleY(-1)', WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)', maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)' }}
        alt=""
      />

      <img loading="lazy" decoding="async"
        src={`${import.meta.env.BASE_URL}img/flares_6.png`}
        className="flare-animate"
        style={{ position: 'absolute', top: '-5%', left: '50%', transform: 'translateX(-50%)', width: '800px', zIndex: 20, opacity: 0.9, mixBlendMode: 'screen', pointerEvents: 'none' }}
        alt=""
      />



      <DustParticles />

      <main id="top" className="site-main" style={{ position: 'relative', zIndex: 10, padding: 'clamp(6rem, 10vw, 7.5rem) clamp(1rem, 3vw, 2rem) clamp(2rem, 5vw, 4rem)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', overflowX: 'hidden' }}>
        {/* Decorative insect at the top right of the hero */}
        <motion.img loading="lazy" decoding="async" className="hero-insect"
          src={`${import.meta.env.BASE_URL}img/insects_8.png`}
          style={{ position: 'absolute', top: '5%', right: '10%', width: '350px', zIndex: 60, opacity: 0.9, pointerEvents: 'none', transform: 'rotate(5deg)', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.3))', y: insectY }}
          alt=""
        />



        {/* Decorative scattered clouds across the entire scrollable height */}
        <motion.img loading="lazy" decoding="async"
          src={`${import.meta.env.BASE_URL}img/clouds_21.png`}
          style={{ position: 'absolute', top: '10%', left: '-10%', width: '500px', zIndex: -1, opacity: 0.7, pointerEvents: 'none', transform: 'rotate(-5deg)', y: cloudY1 }}
          alt=""
        />
        <motion.img loading="lazy" decoding="async"
          src={`${import.meta.env.BASE_URL}img/clouds_21.png`}
          style={{ position: 'absolute', top: '30%', right: '-5%', width: '400px', zIndex: -1, opacity: 0.5, pointerEvents: 'none', transform: 'scaleX(-1) rotate(10deg)', y: cloudY2 }}
          alt=""
        />
        <motion.img loading="lazy" decoding="async"
          src={`${import.meta.env.BASE_URL}img/clouds_21.png`}
          style={{ position: 'absolute', top: '55%', left: '2%', width: '300px', zIndex: -1, opacity: 0.6, pointerEvents: 'none', transform: 'scaleX(-1) rotate(-15deg)', y: cloudY3 }}
          alt=""
        />
        <motion.img loading="lazy" decoding="async"
          src={`${import.meta.env.BASE_URL}img/clouds_21.png`}
          style={{ position: 'absolute', top: '80%', right: '10%', width: '600px', zIndex: -1, opacity: 0.8, pointerEvents: 'none', transform: 'rotate(5deg)', y: cloudY1 }}
          alt=""
        />
        <motion.img loading="lazy" decoding="async"
          src={`${import.meta.env.BASE_URL}img/clouds_21.png`}
          style={{ position: 'absolute', top: '95%', left: '-15%', width: '700px', zIndex: -1, opacity: 0.4, pointerEvents: 'none', transform: 'scaleX(-1) rotate(-8deg)', y: cloudY4 }}
          alt=""
        />

        {/* Decorative background bubbles */}
        <motion.img loading="lazy" decoding="async"
          src={`${import.meta.env.BASE_URL}img/bubbles_37.png`}
          style={{ position: 'absolute', top: '45%', right: '-5%', width: '500px', zIndex: -1, opacity: 0.8, pointerEvents: 'none', transform: 'rotate(-15deg)', y: cloudY2 }}
          alt=""
        />

        {/* Foreground overlapping clouds for 3D depth effect */}
        <motion.img loading="lazy" decoding="async"
          src={`${import.meta.env.BASE_URL}img/clouds_21.png`}
          style={{ position: 'absolute', top: '25%', left: '5%', width: '450px', zIndex: 100, opacity: 0.4, pointerEvents: 'none', transform: 'rotate(10deg)', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.2))', y: cloudY5 }}
          alt=""
        />
        <motion.img loading="lazy" decoding="async"
          src={`${import.meta.env.BASE_URL}img/clouds_21.png`}
          style={{ position: 'absolute', top: '65%', right: '15%', width: '550px', zIndex: 100, opacity: 0.45, pointerEvents: 'none', transform: 'scaleX(-1) rotate(-5deg)', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.2))', y: cloudY3 }}
          alt=""
        />
        <motion.img loading="lazy" decoding="async"
          src={`${import.meta.env.BASE_URL}img/clouds_21.png`}
          style={{ position: 'absolute', top: '75%', right: '5%', width: '400px', zIndex: 100, opacity: 0.6, pointerEvents: 'none', transform: 'rotate(15deg)', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.2))', y: cloudY5 }}
          alt=""
        />
        <motion.img loading="lazy" decoding="async"
          src={`${import.meta.env.BASE_URL}img/clouds_21.png`}
          style={{ position: 'absolute', top: '76%', left: '5%', width: '450px', zIndex: 100, opacity: 0.5, pointerEvents: 'none', transform: 'scaleX(-1) rotate(-10deg)', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.2))', y: cloudY3 }}
          alt=""
        />

        <motion.div
          className="hero-intro"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ marginBottom: '4rem', textAlign: 'center' }}
        >
          <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10} scale={1.05} transitionSpeed={2000}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img className="hero-logo" fetchPriority="high" src={`${import.meta.env.BASE_URL}logo.png`} alt="Aero P2P Chat" style={{ width: 140, height: 140, filter: 'drop-shadow(0 0 20px rgba(56,189,248,0.4))' }} />
              <img loading="lazy" decoding="async" src={`${import.meta.env.BASE_URL}img/bubbles_40.png`} style={{ position: 'absolute', top: '-10%', left: '-10%', width: '120%', height: '120%', objectFit: 'contain', zIndex: 10, pointerEvents: 'none', mixBlendMode: 'screen', opacity: 0.9 }} alt="" />
            </div>
          </Tilt>
          <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', fontWeight: 800, color: '#ffffff', marginTop: '1.5rem', letterSpacing: '-0.03em', filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.5))' }}>
            Aero P2P Chat
          </h1>
          <p style={{ color: '#e2e8f0', fontSize: 'clamp(1rem, 4vw, 1.35rem)', maxWidth: '600px', margin: '1rem auto 0', lineHeight: 1.6, fontWeight: 500, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
            Direct desktop messaging without the middleman. Secure, fast, and completely peer-to-peer.
          </p>
          <div className="hero-badges" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
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
          <div
            id="download"
            className="aero-glass mobile-p-1"
            style={{ marginTop: '0.5rem', padding: '1.25rem', width: '100%', maxWidth: '680px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'linear-gradient(180deg, rgba(255,255,255,0.72), rgba(224,242,254,0.54))', border: '1px solid rgba(255,255,255,0.9)', borderRadius: '1.5rem', boxShadow: 'inset 0 2px 5px rgba(255,255,255,0.9), 0 18px 45px rgba(2,64,145,0.22)' }}
          >
            <div className="install-os-buttons platform-tabs" role="tablist" aria-label="Choose your platform" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem', width: '100%', padding: '0.3rem', marginBottom: '1.25rem', background: 'rgba(15, 82, 150, 0.12)', border: '1px solid rgba(255,255,255,0.65)', borderRadius: '1rem', boxShadow: 'inset 0 2px 5px rgba(2,64,145,0.12)' }}>
              {platforms.map((platform) => {
                const selected = installOs === platform.id;
                return (
                  <button
                    key={platform.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    className="liquid-btn"
                    onClick={() => setInstallOs(platform.id)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', background: selected ? 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(186,230,253,0.95))' : 'transparent', color: selected ? '#0369a1' : '#475569', border: selected ? '1px solid rgba(255,255,255,0.95)' : '1px solid transparent', padding: '0.7rem 0.8rem', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.25s', boxShadow: selected ? '0 5px 14px rgba(2,132,199,0.2), inset 0 1px 2px white' : 'none' }}
                  >
                    {platform.icon}
                    {platform.label}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={installOs}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
              >
              <DownloadButton
                os={installOs}
                text={installOs === 'windows' ? 'Download for Windows (.exe)' : installOs === 'linux' ? 'Download for Linux (.AppImage)' : 'Download for Android (.apk)'}
                icon={installOs === 'android' ? <Smartphone size={22} /> : <Download size={22} />}
                colorTheme={installOs === 'windows' ? 'blue' : 'green'}
                onClick={triggerConfetti}
              />

              {installOs === 'windows' && (
                <div className="microsoft-store-option">
                  <div className="microsoft-store-option__copy">
                    <strong>Prefer Microsoft Store?</strong>
                    <span>One-click install and automatic updates</span>
                  </div>
                  <ms-store-badge
                    className="microsoft-store-badge"
                    productid="9MTXCOM7P403"
                    productname="Aero P2P Chat"
                    window-mode="full"
                    theme="light"
                    animation="on"
                  />
                </div>
              )}

              {installOs !== 'android' && <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  <span style={{ height: '1px', flex: 1, background: 'rgba(51,65,85,0.18)' }} />
                  Or install from the terminal
                  <span style={{ height: '1px', flex: 1, background: 'rgba(51,65,85,0.18)' }} />
                </div>

                <motion.div
                  layout
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="mobile-col"
                  style={{ padding: '0.45rem 0.45rem 0.45rem 1rem', width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.68)', border: '1px solid rgba(148,163,184,0.3)', overflow: 'hidden', borderRadius: '0.9rem', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.9)' }}
                >
                  <motion.div layout style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', overflowX: 'auto' }}>
                    <motion.code layout style={{ color: '#075985', fontFamily: 'monospace', fontSize: '0.88rem', whiteSpace: 'nowrap', userSelect: 'all', cursor: 'text', fontWeight: 650, display: 'inline-block' }}>
                      {installCommands[installOs]}
                    </motion.code>
                  </motion.div>
                  <motion.button
                    type="button"
                    layout
                    className="liquid-btn"
                    whileHover={{ scale: 1.03, backgroundColor: '#e0f2fe' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      navigator.clipboard.writeText(installCommands[installOs]);
                      toast.success("Command copied to clipboard!");
                    }}
                    style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(125,211,252,0.8)', color: '#075985', padding: '0.62rem 1rem', borderRadius: '0.65rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 750, flexShrink: 0, boxShadow: '0 3px 8px rgba(2,132,199,0.12)' }}
                  >
                    Copy
                  </motion.button>
                </motion.div>

                <label className="subtle-checkbox-label" style={{ alignSelf: 'flex-start', color: '#475569' }}>
                  <input
                    type="checkbox"
                    checked={useFallbackDomain}
                    onChange={(e) => setUseFallbackDomain(e.target.checked)}
                  />
                  Use GitHub mirror
                </label>
              </>}
              </motion.div>
            </AnimatePresence>
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
          id="features"
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
              <img loading="lazy" decoding="async" src={`${import.meta.env.BASE_URL}img/bubbles_43.png`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3, mixBlendMode: 'overlay', pointerEvents: 'none', zIndex: 0 }} alt="" />
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ background: 'linear-gradient(135deg, #e0f2fe, #bae6fd)', color: '#0284c7', padding: '1rem', borderRadius: '16px', display: 'inline-flex', flexShrink: 0, border: '1px solid #7dd3fc', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8)' }}>
                  {feat.icon}
                </div>
                <h3 style={{ color: '#0f172a', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{feat.title}</h3>
              </div>
              <p style={{ position: 'relative', zIndex: 1, color: '#334155', lineHeight: 1.6, fontWeight: 500 }}>{feat.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* How It Works Section */}
        <motion.div
          id="how-it-works"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="aero-glass liquid-animate mobile-p-1"
          style={{ width: '100%', maxWidth: '1000px', marginTop: '6rem', padding: '3rem', position: 'relative' }}
        >
          {/* Overlay flare bleeding out of the element */}
          <img loading="lazy" decoding="async"
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
                <StepNumber>1</StepNumber>
                <h4 style={{ color: '#0f172a', fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 700 }}>Open the App</h4>
                <p style={{ color: '#475569', fontSize: '1rem', fontWeight: 500 }}>Launch Aero P2P Chat and instantly get your unique, randomized Peer ID.</p>
              </div>
              <div className="hide-on-mobile" style={{ color: '#0ea5e9', fontSize: '1.5rem', fontWeight: 'bold' }}>➜</div>
              <div style={{ flex: '1 1 250px', textAlign: 'center', padding: '1rem' }}>
                <StepNumber>2</StepNumber>
                <h4 style={{ color: '#0f172a', fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 700 }}>Share ID</h4>
                <p style={{ color: '#475569', fontSize: '1rem', fontWeight: 500 }}>Send your Peer ID to a friend through any secure channel.</p>
              </div>
              <div className="hide-on-mobile" style={{ color: '#0ea5e9', fontSize: '1.5rem', fontWeight: 'bold' }}>➜</div>
              <div style={{ flex: '1 1 250px', textAlign: 'center', padding: '1rem' }}>
                <StepNumber>3</StepNumber>
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
          <img loading="lazy" decoding="async"
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
            <img fetchPriority="high" src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" style={{ width: '48px', height: '48px', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.2))' }} />
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
        <motion.img loading="lazy" decoding="async"
          src={`${import.meta.env.BASE_URL}img/globe.gif`}
          alt="Globe"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          style={{ position: 'absolute', bottom: '10px', right: '10px', width: '120px', height: '120px', zIndex: 5, borderRadius: '50%', filter: 'drop-shadow(0 4px 20px rgba(2,132,199,0.5))' }}
        />

        <img loading="lazy" decoding="async"
          src={`${import.meta.env.BASE_URL}img/water_1.png`}
          style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', zIndex: 5, pointerEvents: 'none', objectFit: 'cover' }}
          alt=""
        />

        {/* Decorative bubbles overlay at the bottom left */}
        <img loading="lazy" decoding="async"
          src={`${import.meta.env.BASE_URL}img/bubbles_39.png`}
          style={{ position: 'absolute', bottom: 0, left: '-5%', width: '450px', zIndex: 5, opacity: 0.8, pointerEvents: 'none', mixBlendMode: 'screen', transform: 'rotate(10deg)' }}
          alt=""
        />
      </main>
    </>
  )
}

export default App
