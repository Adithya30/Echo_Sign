import { useState, useEffect } from 'react'
import { getEmergencyAlerts, triggerEmergency, acknowledgeAlert } from '../services/api'
import { UI_LABELS } from '../utils/translations'
import toast from 'react-hot-toast'
import './EmergencyPage.css'

const getProtocolSteps = (L) => [
    { step: '1', icon: '🤟', title: L.step_1_title, desc: 'User performs emergency sign in front of webcam.' },
    { step: '2', icon: '🤖', title: L.step_2_title, desc: 'LSTM model identifies sign with confidence score.' },
    { step: '3', icon: '🚨', title: L.step_3_title, desc: 'System plays voice alert and logs the event.' },
    { step: '4', icon: '💬', title: L.step_4_title, desc: 'Message sent to all emergency contacts.' },
    { step: '5', icon: '📋', title: L.step_5_title, desc: 'Event stored in database for review.' },
    { step: '6', icon: '✅', title: L.step_6_title, desc: 'Staff acknowledges and resolves the alert.' },
]

const EMERGENCY_SIGNS = [
    { word: 'HELP', emoji: '🆘', desc: 'General distress signal' },
    { word: 'DOCTOR', emoji: '🩺', desc: 'Medical assistance needed' },
    { word: 'EMERGENCY', emoji: '🚨', desc: 'Critical emergency' },
    { word: 'DANGER', emoji: '⚠️', desc: 'Hazardous situation' },
    { word: 'POLICE', emoji: '🚔', desc: 'Law enforcement needed' },
    { word: 'FIRE', emoji: '🔥', desc: 'Fire hazard detected' },
    { word: 'AMBULANCE', emoji: '🚑', desc: 'Immediate medical transport' },
]

export default function EmergencyPage({ selectedLang }) {
    const L = UI_LABELS[selectedLang]
    const protocolSteps = getProtocolSteps(L)
    const [alerts, setAlerts] = useState([])
    const [loading, setLoading] = useState(true)
    const [triggering, setTriggering] = useState(null)

    const loadAlerts = async () => {
        setLoading(true)
        try {
            const res = await getEmergencyAlerts()
            setAlerts(res.results || [])
        } catch {
            // Demo data
            setAlerts([
                { id: '1', alert_type: 'HELP', message: "Emergency sign 'Help' detected.", status: 'ACTIVE', confidence: 0.91, timestamp: new Date().toISOString() },
                { id: '2', alert_type: 'DOCTOR', message: "Emergency sign 'Doctor' detected.", status: 'ACKNOWLEDGED', confidence: 0.88, timestamp: new Date(Date.now() - 3600000).toISOString() },
            ])
        } finally { setLoading(false) }
    }

    useEffect(() => { loadAlerts() }, [])

    const handleTrigger = async (word) => {
        setTriggering(word)
        try {
            await triggerEmergency(word, `Manual emergency trigger: ${word}`, 1.0)
            toast.error(`🚨 Emergency "${word}" triggered! TTS and contacts notified.`, { duration: 6000 })
            await loadAlerts()
        } catch {
            toast.error(`Emergency triggered locally: ${word}`)
            const utter = new SpeechSynthesisUtterance(`EMERGENCY! ${word}! Please help!`)
            utter.rate = 1.3; utter.pitch = 1.2; utter.volume = 1.0
            window.speechSynthesis.speak(utter)
        } finally { setTriggering(null) }
    }

    const handleAck = async (id) => {
        try {
            await acknowledgeAlert(id)
            setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a))
            toast.success('Alert acknowledged')
        } catch { toast.error('Failed to acknowledge') }
    }

    const activeAlerts = alerts.filter(a => a.status === 'ACTIVE')

    return (
        <div className="page emergency-page">
            <div className="page-header">
                <h1>🚨 <span className="gradient-text-purple">{L.em_title}</span></h1>
                <p>{L.em_desc}</p>
            </div>

            {/* Active alert banner */}
            {activeAlerts.length > 0 && (
                <div className="active-alert-banner card emergency-card">
                    <div className="alert-banner-icon">🚨</div>
                    <div className="alert-banner-text">
                        <strong>{activeAlerts.length} {L.em_active}</strong>
                        <p>{L.immediate_attention || 'Attention Required'}</p>
                    </div>
                </div>
            )}

            {/* Emergency Sign Reference */}
            <div className="em-section">
                <h2>{L.em_ref_title}</h2>
                <p>{L.em_desc}</p>
                <div className="emergency-grid">
                    {EMERGENCY_SIGNS.map(s => (
                        <div key={s.word} className="emergency-word-card card">
                            <div className="ew-emoji">{s.emoji}</div>
                            <div className="ew-word">{s.word}</div>
                            <div className="ew-desc">{s.desc}</div>
                            <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleTrigger(s.word)}
                                disabled={triggering === s.word}
                            >
                                {triggering === s.word ? `⏳ ${L.btn_sending}` : `⚡ ${L.em_btn_trigger}`}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Alert History */}
            <div className="em-section">
                <div className="em-section-header">
                    <h2>{L.alert_log || 'Log'}</h2>
                    <button className="btn btn-ghost btn-sm" onClick={loadAlerts}>🔄 {L.btn_refresh}</button>
                </div>

                {loading ? (
                    <div className="empty-state"><p>Loading alerts...</p></div>
                ) : alerts.length === 0 ? (
                    <div className="empty-state card" style={{ padding: '3rem' }}>
                        <div className="empty-icon">✅</div>
                        <p>{L.no_alerts}</p>
                    </div>
                ) : (
                    <div className="alert-list">
                        {alerts.map(alert => (
                            <div key={alert.id} className={`alert-item card ${alert.status === 'ACTIVE' ? 'emergency-card' : ''}`}>
                                <div className="alert-item-left">
                                    <div className="alert-type-badge">
                                        <span className="badge badge-red">{alert.alert_type}</span>
                                        <span className={`badge ${alert.status === 'ACTIVE' ? 'badge-red' : 'badge-green'}`}>
                                            {alert.status}
                                        </span>
                                    </div>
                                    <p className="alert-message">{alert.message}</p>
                                    <div className="alert-meta">
                                        <span>🎯 Confidence: {(alert.confidence * 100).toFixed(1)}%</span>
                                        <span>🕐 {new Date(alert.timestamp).toLocaleString()}</span>
                                    </div>
                                </div>
                                {alert.status === 'ACTIVE' && (
                                    <button className="btn btn-ghost btn-sm" onClick={() => handleAck(alert.id)}>
                                        ✅ {L.btn_ack}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Emergency Protocol Info */}
            <div className="em-section">
                <h2>{L.protocol_title}</h2>
                <div className="grid-3 protocol-grid">
                    {protocolSteps.map(s => (
                        <div key={s.step} className="card protocol-step">
                            <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>{s.icon}</div>
                            <strong>{s.title}</strong>
                            <p style={{ fontSize: '.85rem', marginTop: '.3rem' }}>{s.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
