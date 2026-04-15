import { useState, useRef, useEffect, useCallback } from 'react'
import Webcam from 'react-webcam'
import toast from 'react-hot-toast'
import { translateGesture, speakText } from '../services/api'
import { getFullTranslation, UI_LABELS } from '../utils/translations'
import { useAuth } from '../context/AuthContext'
import './Dashboards.css'
import './TranslatorPage.css' // Reuse camera styles

const GESTURE_LABELS = [
    "Hello", "Thank You", "Please", "Sorry", "Yes", "No",
    "Help", "Doctor", "Emergency", "Water", "Food", "Good"
]

export default function UserDashboard({ selectedLang }) {
    const { user, token } = useAuth()
    const L = UI_LABELS[selectedLang]
    
    // Core Logic States
    const webcamRef = useRef(null)
    const canvasRef = useRef(null)
    const handsRef = useRef(null)
    const translateCooldown = useRef(false)
    const [isActive, setIsActive] = useState(false)
    const [mpReady, setMpReady] = useState(false)
    const [prediction, setPrediction] = useState(null)
    const [isEmergency, setIsEmergency] = useState(false)

    // Chat States
    const [messages, setMessages] = useState([])
    const [chatMsg, setChatMsg] = useState("")
    const chatWs = useRef(null)

    // Setup Chat WebSocket
    useEffect(() => {
        if (!token) return
        const ws = new WebSocket(`ws://127.0.0.1:8000/ws/chat/?token=${token}`)
        ws.onmessage = (e) => {
            const data = JSON.parse(e.data)
            if (data.type === 'chat_message') {
                setMessages(prev => [...prev, data])
            }
        }
        chatWs.current = ws
        return () => ws.close()
    }, [token])

    const sendChatMessage = (e) => {
        e.preventDefault()
        if (!chatMsg.trim() || !chatWs.current) return
        
        // Find an emergency staff to message (in a real app, this would be a selected contact)
        // For demo, we just broadcast or target a placeholder ID if needed
        chatWs.current.send(JSON.stringify({
            message: chatMsg,
            receiver_id: "SYSTEM_STAFF" // Placeholder
        }))
        
        // Optimistic local add
        setMessages(prev => [...prev, {
            sender_name: "You",
            message: chatMsg,
            timestamp: new Date().toISOString(),
            is_sent: true
        }])
        setChatMsg("")
    }

    // MediaPipe Setup (Simplified for Dashboard)
    useEffect(() => {
        const loadMP = async () => {
            try {
                const { Hands } = await import('@mediapipe/hands')
                const hands = new Hands({
                    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
                })
                hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.7 })
                hands.onResults(onResults)
                handsRef.current = hands
                setMpReady(true)
            } catch (e) {
                setMpReady(true) // demo mode fallback
            }
        }
        loadMP()
    }, [])

    const onResults = useCallback((results) => {
        if (results.multiHandLandmarks?.length > 0) {
            
            if (!window.dashFrameBuffer) window.dashFrameBuffer = []
            const lm = results.multiHandLandmarks[0]
            const flatLandmarks = lm.map(p => [p.x, p.y, p.z])
            window.dashFrameBuffer.push(flatLandmarks)
            
            // Maintain rolling sliding window of 30 frames
            if (window.dashFrameBuffer.length > 30) {
                window.dashFrameBuffer.shift()
            }
            
            if (window.dashFrameBuffer.length === 30 && !translateCooldown.current) {
                translateCooldown.current = true
                const sequence = [...window.dashFrameBuffer]
                
                translateGesture(sequence, "dashboard-session", selectedLang)
                    .then(data => {
                        if (data.status === 'buffering') return
                        setPrediction(data)
                        setIsEmergency(data.is_emergency)
                        if (data.is_emergency) toast.error("🚨 Emergency Sign Detected!")
                    })
                    .finally(() => setTimeout(() => { translateCooldown.current = false }, 1000))
            }
        }
    }, [selectedLang])

    return (
        <div className="dashboard-container">
            <div className="dash-card-header" style={{ border: 'none' }}>
                <div>
                    <h2 className="gradient-text">👋 Welcome, {user.username}</h2>
                    <p style={{ color: 'var(--text-muted)' }}>EchoSign Personal Assistant Dashboard</p>
                </div>
                <div className="navbar-badge">
                    <span className="pulse-dot" /> {mpReady ? 'AI Engine Ready' : 'Initializing...'}
                </div>
            </div>

            <div className="dashboard-grid">
                {/* Main Action Area */}
                <div className="main-section">
                    <div className="dash-card">
                        <div className="dash-card-header">
                            <h3 className="dash-card-title">🤟 Real-Time Translator</h3>
                            <button className={`btn ${isActive ? 'btn-ghost' : 'btn-cyan'}`} onClick={() => setIsActive(!isActive)}>
                                {isActive ? 'Stop System' : 'Launch System'}
                            </button>
                        </div>
                        
                        <div className="camera-view" style={{ minHeight: '400px', background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
                            {isActive && (
                                <Webcam
                                    ref={webcamRef}
                                    className="webcam-feed"
                                    mirrored
                                    onUserMedia={() => {
                                        import('@mediapipe/camera_utils').then(({ Camera }) => {
                                            const cam = new Camera(webcamRef.current.video, {
                                                onFrame: async () => {
                                                    if (webcamRef.current?.video) await handsRef.current.send({ image: webcamRef.current.video })
                                                },
                                                width: 640, height: 480
                                            })
                                            cam.start()
                                        })
                                    }}
                                />
                            )}
                            {!isActive && (
                                <div className="camera-overlay">
                                    <p>System Dormant. Click <strong>Launch</strong> to begin.</p>
                                </div>
                            )}
                        </div>

                        <div className="stats-row" style={{ marginTop: '1.5rem' }}>
                            <div className="stat-box">
                                <div className="stat-label">Prediction</div>
                                <div className="stat-value" style={{ color: isEmergency ? 'var(--danger)' : 'var(--cyan)' }}>
                                    {prediction ? (prediction.display_word || prediction.word) : '---'}
                                </div>
                            </div>
                            <div className="stat-box">
                                <div className="stat-label">Confidence</div>
                                <div className="stat-value">
                                    {prediction ? `${(prediction.confidence * 100).toFixed(0)}%` : '0%'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Communication Sidebar */}
                <div className="sidebar-section">
                    <div className="dash-card chat-sidebar">
                        <div className="dash-card-header">
                            <h3 className="dash-card-title">💬 Support Chat</h3>
                        </div>
                        
                        <div className="chat-messages">
                            {messages.length === 0 ? (
                                <div className="empty-state" style={{ opacity: 0.5 }}>
                                    <p>No messages yet.</p>
                                    <small>Emergency staff will appear here if an alert is triggered.</small>
                                </div>
                            ) : (
                                messages.map((m, i) => (
                                    <div key={i} className={`msg-bubble ${m.is_sent ? 'msg-sent' : 'msg-received'}`}>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '2px' }}>{m.sender_name}</div>
                                        {m.message}
                                    </div>
                                ))
                            )}
                        </div>

                        <form className="chat-input-area" onSubmit={sendChatMessage} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                            <input 
                                type="text" 
                                className="input-custom" 
                                placeholder="Type a message..." 
                                value={chatMsg}
                                onChange={(e) => setChatMsg(e.target.value)}
                            />
                            <button className="btn btn-cyan btn-sm">Sent</button>
                        </form>
                    </div>

                    <div className="dash-card" style={{ marginTop: '1.5rem' }}>
                        <h3 className="dash-card-title">🚨 Rescue Shortcuts</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '1rem' }}>
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}>🔥 Fire</button>
                            <button className="btn btn-ghost btn-sm" style={{ color: '#' }}>🚑 Ambulance</button>
                            <button className="btn btn-ghost btn-sm" style={{ color: '#' }}>🚓 Police</button>
                            <button className="btn btn-ghost btn-sm" style={{ color: '#' }}>⚕️ Doctor</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
