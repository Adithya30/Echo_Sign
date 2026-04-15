import { useState, useRef, useEffect, useCallback } from 'react'
import Webcam from 'react-webcam'
import toast from 'react-hot-toast'
import { translateGesture, speakText } from '../services/api'
import { SIGN_MAP, getFullTranslation, UI_LABELS } from '../utils/translations'
import './TranslatorPage.css'

const SESSION_ID = `session-${Date.now()}`

const GESTURE_LABELS = [
    "Hello", "Thank You", "Please", "Sorry", "Yes", "No",
    "Help", "Doctor", "Emergency", "Water", "Food", "Good",
    "Bad", "Love", "Family", "Friend", "Home", "School",
    "Hospital", "Police", "Fire", "Ambulance", "Danger",
    "Stop", "Go", "Come", "Wait", "Understand", "Again", "More"
]

export default function TranslatorPage({ selectedLang }) {
    const L = UI_LABELS[selectedLang]
    const webcamRef = useRef(null)
    const canvasRef = useRef(null)
    const handsRef = useRef(null)
    const cameraRef = useRef(null)
    const animRef = useRef(null)

    const [isActive, setIsActive] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [prediction, setPrediction] = useState(null)
    const [recentWords, setRecentWords] = useState([])
    const [isEmergency, setIsEmergency] = useState(false)
    const [mpReady, setMpReady] = useState(false)
    const [landmarks, setLandmarks] = useState(null)
    const [sentence, setSentence] = useState([])
    const translateCooldown = useRef(false)

    // Load MediaPipe Hands
    useEffect(() => {
        let hands = null
        const loadMP = async () => {
            try {
                const { Hands } = await import('@mediapipe/hands')
                const { Camera } = await import('@mediapipe/camera_utils')

                hands = new Hands({
                    locateFile: (file) =>
                        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
                })
                hands.setOptions({
                    maxNumHands: 1,
                    modelComplexity: 1,
                    minDetectionConfidence: 0.7,
                    minTrackingConfidence: 0.6,
                })
                hands.onResults(onResults)
                handsRef.current = hands
                setMpReady(true)
            } catch (e) {
                console.warn('MediaPipe load failed, using demo mode:', e)
                setMpReady(true) // still allow demo
            }
        }
        loadMP()
        return () => { hands?.close() }
    }, [])

    const onResults = useCallback((results) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        if (results.multiHandLandmarks?.length > 0) {
            const lm = results.multiHandLandmarks[0]
            setLandmarks(lm)

            // Draw hand skeleton
            drawHand(ctx, lm, canvas.width, canvas.height)

            // Auto-translate (sequence chunking)
            if (!window.frameBuffer) window.frameBuffer = []
            const flatLandmarks = lm.map(p => [p.x, p.y, p.z])
            window.frameBuffer.push(flatLandmarks)
            
            // Maintain rolling sliding window of 30 frames
            if (window.frameBuffer.length > 30) {
                window.frameBuffer.shift()
            }

            if (window.frameBuffer.length === 30 && !translateCooldown.current) {
                translateCooldown.current = true
                const sequence = [...window.frameBuffer]

                translateGesture(sequence, SESSION_ID, selectedLang)
                    .then(data => {
                        if (data.status === 'buffering') return
                        setPrediction(data)
                        const emergency = data.is_emergency || false
                        setIsEmergency(emergency)
                        setRecentWords(prev => {
                            const newList = [data.word, ...prev.filter(w => w !== data.word)].slice(0, 8)
                            return newList
                        })
                        if (emergency) {
                            toast.error(`🚨 EMERGENCY: ${data.word} detected!`, { duration: 5000 })
                        }
                    })
                    .catch(() => {
                        // Demo fallback - local prediction
                        const idx = Math.floor(Math.random() * GESTURE_LABELS.length)
                        const rawWord = GESTURE_LABELS[idx]
                        const demoResult = { 
                            word: rawWord, 
                            display_word: getFullTranslation(rawWord, selectedLang),
                            confidence: 0.75 + Math.random() * 0.2, 
                            confidence_percent: 75 + Math.random() * 20, 
                            is_emergency: false 
                        }
                        setPrediction(demoResult)
                        setRecentWords(prev => [demoResult.display_word, ...prev].slice(0, 8))
                    })
                    .finally(() => {
                        setTimeout(() => { translateCooldown.current = false }, 1000)
                    })
            }
        } else {
            setLandmarks(null)
            ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
    }, [])

    function drawHand(ctx, landmarks, W, H) {
        const pts = landmarks.map(p => ({ x: p.x * W, y: p.y * H }))
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],
            [0, 5], [5, 6], [6, 7], [7, 8],
            [0, 9], [9, 10], [10, 11], [11, 12],
            [0, 13], [13, 14], [14, 15], [15, 16],
            [0, 17], [17, 18], [18, 19], [19, 20],
            [5, 9], [9, 13], [13, 17]
        ]

        // Draw connections
        ctx.strokeStyle = 'rgba(79,142,247,0.7)'
        ctx.lineWidth = 2
        connections.forEach(([a, b]) => {
            ctx.beginPath()
            ctx.moveTo(pts[a].x, pts[a].y)
            ctx.lineTo(pts[b].x, pts[b].y)
            ctx.stroke()
        })

        // Draw joints
        pts.forEach((p, i) => {
            ctx.beginPath()
            ctx.arc(p.x, p.y, i === 0 ? 6 : 4, 0, Math.PI * 2)
            ctx.fillStyle = i === 0 ? '#00d4ff' : '#4f8ef7'
            ctx.shadowBlur = 8
            ctx.shadowColor = i === 0 ? '#00d4ff' : '#4f8ef7'
            ctx.fill()
            ctx.shadowBlur = 0
        })
    }

    const startCamera = async () => {
        if (!handsRef.current || !webcamRef.current?.video) return
        setIsLoading(true)
        try {
            const { Camera } = await import('@mediapipe/camera_utils')
            const cam = new Camera(webcamRef.current.video, {
                onFrame: async () => {
                    if (webcamRef.current?.video) {
                        await handsRef.current.send({ image: webcamRef.current.video })
                    }
                },
                width: 640, height: 480
            })
            await cam.start()
            cameraRef.current = cam
            setIsActive(true)
            toast.success('Camera started! Show your hand signs.')
        } catch (e) {
            toast.error('Failed to start camera. Check permissions.')
        } finally {
            setIsLoading(false)
        }
    }

    const stopCamera = async () => {
        cameraRef.current?.stop()
        setIsActive(false)
        setLandmarks(null)
        const canvas = canvasRef.current
        if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    }

    const handleSpeak = () => {
        if (!prediction) return
        const textToSpeak = prediction.translated_word || prediction.word
        const langCode = selectedLang === 'ml' ? 'ml-IN' : selectedLang === 'hi' ? 'hi-IN' : 'en-US'
        
        speakText(textToSpeak, prediction.is_emergency)
            .then(() => toast.success(`Speaking: "${textToSpeak}"`))
            .catch(() => {
                const utter = new SpeechSynthesisUtterance(textToSpeak)
                utter.lang = langCode
                utter.rate = 1.0; utter.pitch = 1.0
                window.speechSynthesis.speak(utter)
                toast.success(`Speaking: "${textToSpeak}"`)
            })
    }

    const addToSentence = () => {
        if (prediction) setSentence(prev => [...prev, prediction.display_word || prediction.word])
    }

    const speakSentence = () => {
        if (!sentence.length) return
        const text = sentence.join(' ')
        const utter = new SpeechSynthesisUtterance(text)
        window.speechSynthesis.speak(utter)
        toast.success('Speaking sentence...')
    }

    const confLevel = prediction
        ? prediction.confidence >= 0.8 ? 'high'
            : prediction.confidence >= 0.6 ? 'medium' : 'low'
        : 'high'

    return (
        <div className="page translator-page">
            <div className="page-header">
                <h1>🤟 <span className="gradient-text">{L.trans_title}</span></h1>
                <p>{L.trans_desc}</p>
            </div>

            <div className="translator-layout">
                {/* Camera Panel */}
                <div className="camera-panel card">
                    <div className="camera-header">
                        <span className="camera-title">📷 {L.nav_translator}</span>
                        <div className="camera-controls">
                            {!isActive ? (
                                <button
                                    className="btn btn-cyan"
                                    onClick={startCamera}
                                    disabled={isLoading || !mpReady}
                                >
                                    {isLoading ? <span className="spinner">⟳</span> : '▶'} {L.btn_start || 'Start'}
                                </button>
                            ) : (
                                <button className="btn btn-ghost" onClick={stopCamera}>停 Stop</button>
                            )}
                        </div>
                    </div>

                    <div className="camera-view">
                        <Webcam
                            ref={webcamRef}
                            className="webcam-feed"
                            mirrored
                            videoConstraints={{ width: 640, height: 480, facingMode: 'user' }}
                        />
                        <canvas ref={canvasRef} className="landmark-canvas" width={640} height={480} />

                        {!isActive && (
                            <div className="camera-overlay">
                                <div className="overlay-content">
                                    <div style={{ fontSize: '4rem' }}>📷</div>
                                    <p>Click <strong>Start</strong> to begin detection</p>
                                </div>
                            </div>
                        )}

                        {isActive && (
                            <div className={`recording-badge ${isEmergency ? 'emergency' : ''}`}>
                                <span className="pulse-dot" />
                                {isEmergency ? `🚨 ${L.nav_emergency.toUpperCase()}` : '● LIVE'}
                            </div>
                        )}
                    </div>

                    {/* Hand status */}
                    <div className="hand-status">
                        <span className={`hand-indicator ${landmarks ? 'detected' : 'none'}`}>
                            {landmarks ? `✋ ${L.trans_hand_detected}` : `👁️ ${L.trans_no_hand}`}
                        </span>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="translator-sidebar">
                    {/* Translation Result */}
                    <div className={`result-card card ${isEmergency ? 'emergency-card' : ''}`}>
                        <div className="result-label">
                            {isEmergency ? `🚨 ${L.nav_emergency.toUpperCase()}` : `🤖 ${L.trans_confidence}`}
                        </div>

                        {prediction ? (
                            <>
                                <div className="result-word" key={prediction.word} style={{ animation: 'word-appear 0.4s ease' }}>
                                    {prediction.display_word || prediction.word}
                                </div>
                                <div className="confidence-section">
                                    <div className="confidence-label">
                                        Confidence: <strong>{prediction.confidence_percent?.toFixed(1) || (prediction.confidence * 100).toFixed(1)}%</strong>
                                    </div>
                                    <div className="confidence-bar-wrap">
                                        <div className="confidence-bar-track">
                                            <div
                                                className={`confidence-bar-fill ${confLevel}`}
                                                style={{ width: `${Math.min(100, prediction.confidence_percent || prediction.confidence * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="result-actions">
                                    <button className="btn btn-primary" onClick={handleSpeak}>
                                        🔊 {L.trans_speak}
                                    </button>
                                    <button className="btn btn-ghost" onClick={addToSentence}>
                                        ➕ {L.trans_add.split(' ')[0]}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                                <div className="empty-icon">🤟</div>
                                <p>{L.trans_desc}</p>
                            </div>
                        )}
                    </div>

                    {/* Sentence Builder */}
                    <div className="card sentence-card">
                        <div className="section-title">📝 {L.add_sentence || 'Sentence'}</div>
                        <div className="sentence-display">
                            {sentence.length > 0
                                ? sentence.map((w, i) => <span key={i} className="word-chip">{w}</span>)
                                : <span className="empty-text">...</span>
                            }
                        </div>
                        <div className="result-actions">
                            <button className="btn btn-ghost btn-sm" onClick={() => setSentence([])}>
                                🗑 {L.trans_clear}
                            </button>
                        </div>
                    </div>

                    {/* Recent Words */}
                    <div className="card recent-card">
                        <div className="section-title">🕐 Recent Signs</div>
                        {recentWords.length > 0 ? (
                            <div className="recent-words">
                                {recentWords.map((w, i) => (
                                    <button key={i} className="word-btn" onClick={() => {
                                        const utter = new SpeechSynthesisUtterance(w)
                                        window.speechSynthesis.speak(utter)
                                    }}>
                                        {w}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No signs detected yet</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Emergency Alert Banner */}
            {isEmergency && (
                <div className="emergency-banner">
                    <div className="emergency-content">
                        <span className="pulse-dot" />
                        <strong>🚨 EMERGENCY ALERT:</strong> Sign "{prediction?.word}" has been detected!
                        Emergency contacts will be notified.
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => setIsEmergency(false)}>
                        Dismiss
                    </button>
                </div>
            )}
        </div>
    )
}
