import { Link } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { UI_LABELS } from '../utils/translations'
import './HomePage.css'

const getFeatures = (L) => [
    {
        icon: '🤟',
        title: L.nav_translator,
        desc: L.home_hero_desc,
        color: 'blue',
    },
    {
        icon: '🚨',
        title: L.nav_emergency,
        desc: L.em_desc,
        color: 'red',
    },
    {
        icon: '📋',
        title: L.nav_history,
        desc: L.hist_title,
        color: 'purple',
    },
]

const getSteps = (lng) => {
    if (lng === 'ml') return [
        { n: '01', title: 'പിടിച്ചെടുക്കുക', desc: 'വെബ്ക്യാം കൈ ആംഗ്യം റെക്കോർഡ് ചെയ്യുന്നു' },
        { n: '02', title: 'കണ്ടെത്തുക', desc: 'MediaPipe 21 കൈ പോയിന്റുകൾ കണ്ടെത്തുന്നു' },
        { n: '03', title: 'വിശകലനം', desc: 'LSTM മോഡൽ ചിഹ്നം തിരിച്ചറിയുന്നു' },
        { n: '04', title: 'ഫലം', desc: 'ടെക്സ്റ്റും വോയിസും വരുന്നു' }
    ]
    if (lng === 'hi') return [
        { n: '01', title: 'पकड़ें', desc: 'वेबकैम हाथ के इशारों को रिकॉर्ड करता है' },
        { n: '02', title: 'पहचानें', desc: 'मीडियापाइप 21 हाथ के बिंदुओं को ढूँढता है' },
        { n: '03', title: 'विश्लेषण', desc: 'एलएसटीएम मॉडल संकेत की पहचान करता है' },
        { n: '04', title: 'आउटपुट', desc: 'टेक्स्ट और आवाज प्रदर्शित होती है' }
    ]
    return [
        { n: '01', title: 'Capture', desc: 'Webcam records hand gesture' },
        { n: '02', title: 'Detect', desc: 'MediaPipe finds 21 hand landmarks' },
        { n: '03', title: 'Analyze', desc: 'LSTM model predicts the sign' },
        { n: '04', title: 'Output', desc: 'Text displayed + voice spoken aloud' },
    ]
}

export default function HomePage({ selectedLang }) {
    const L = UI_LABELS[selectedLang]
    const features = getFeatures(L)
    const steps = getSteps(selectedLang)
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        const W = canvas.width = window.innerWidth
        const H = canvas.height = window.innerHeight

        const particles = Array.from({ length: 60 }, () => ({
            x: Math.random() * W, y: Math.random() * H,
            r: Math.random() * 2 + 0.5,
            dx: (Math.random() - 0.5) * 0.4,
            dy: (Math.random() - 0.5) * 0.4,
            alpha: Math.random() * 0.5 + 0.1,
        }))

        let raf
        function draw() {
            ctx.clearRect(0, 0, W, H)
            particles.forEach(p => {
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(79,142,247,${p.alpha})`
                ctx.fill()
                p.x += p.dx; p.y += p.dy
                if (p.x < 0 || p.x > W) p.dx *= -1
                if (p.y < 0 || p.y > H) p.dy *= -1
            })
            raf = requestAnimationFrame(draw)
        }
        draw()
        return () => cancelAnimationFrame(raf)
    }, [])

    return (
        <div className="home-page">
            <canvas ref={canvasRef} className="home-canvas" />

            {/* Hero */}
            <section className="hero">
                <div className="hero-content animate-fade-up">
                    <div className="hero-badge">
                        <span className="badge badge-blue">🤖 {L.home_hero_badge_ai || 'AI Powered'}</span>
                        <span className="badge badge-cyan">🌐 {L.home_hero_badge_realtime || 'Real-Time'}</span>
                        <span className="badge badge-purple">🔒 {L.home_hero_badge_offline || 'Offline Ready'}</span>
                    </div>
                    <h1>
                        {L.home_hero_title}
                        <br />{L.home_hero_subtitle}
                    </h1>
                    <p className="hero-desc">
                        {L.home_hero_desc}
                    </p>
                    <div className="hero-actions">
                        <Link to="/translator" className="btn btn-cyan btn-lg">
                            🤟 {L.home_btn_start}
                        </Link>
                        <Link to="/history" className="btn btn-ghost btn-lg">
                            📋 {L.home_btn_history}
                        </Link>
                    </div>

                    {/* Live stats */}
                    <div className="hero-stats">
                        {[
                            { label: L.home_stat_signs, value: '30+' },
                            { label: L.home_stat_fps, value: '30' },
                            { label: L.home_stat_offline, value: '100%' },
                            { label: L.home_stat_accuracy, value: '95%' },
                        ].map(s => (
                            <div key={s.label} className="hero-stat">
                                <div className="hero-stat-value">{s.value}</div>
                                <div className="hero-stat-label">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Hero visual */}
                <div className="hero-visual animate-float">
                    <div className="hand-orb">
                        <span className="hand-emoji">🤟</span>
                        <div className="orb-ring r1" />
                        <div className="orb-ring r2" />
                        <div className="orb-ring r3" />
                    </div>
                    <div className="translation-bubble">
                        <span>Hello 👋</span>
                        <span className="conf-pill">Confidence: 94%</span>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="section">
                <div className="section-label">How It Works</div>
                <h2>Capture → Detect → Translate → <span className="gradient-text">Speak</span></h2>
                <div className="steps-row">
                    {steps.map((s, i) => (
                        <div key={s.n} className="step-card card">
                            <div className="step-num">{s.n}</div>
                            <h3>{s.title}</h3>
                            <p>{s.desc}</p>
                            {i < steps.length - 1 && <div className="step-arrow">→</div>}
                        </div>
                    ))}
                </div>
            </section>

            {/* Features */}
            <section className="section">
                <div className="section-label">Features</div>
                <h2>Everything You Need to <span className="gradient-text">Communicate</span></h2>
                <div className="features-grid">
                    {features.map(f => (
                        <div key={f.title} className={`feature-card card feature-${f.color}`}>
                            <div className="feature-icon">{f.icon}</div>
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="cta-section">
                <div className="cta-inner card">
                    <h2>Ready to Break the <span className="gradient-text">Silence</span>?</h2>
                    <p>Open your webcam and start communicating in seconds.</p>
                    <Link to="/translator" className="btn btn-cyan btn-lg">
                        🤟 Launch Translator
                    </Link>
                </div>
            </section>
        </div>
    )
}
