import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import './Dashboards.css'

export default function StaffDashboard({ selectedLang }) {
    const { user, token } = useAuth()
    const [alerts, setAlerts] = useState([])
    const [activeAlert, setActiveAlert] = useState(null)
    const [chatMessages, setChatMessages] = useState([])
    const [chatInput, setChatInput] = useState("")
    const [stats, setStats] = useState({ active: 0, resolved: 0, total: 0 })
    
    const emergencyWs = useRef(null)
    const chatWs = useRef(null)

    useEffect(() => {
        loadAlerts()
        setupWebSockets()
        return () => {
            emergencyWs.current?.close()
            chatWs.current?.close()
        }
    }, [])

    const loadAlerts = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/translator/alerts/')
            setAlerts(res.data)
            updateStats(res.data)
        } catch (err) {
            console.error('Failed to load alerts', err)
        }
    }

    const updateStats = (data) => {
        const active = data.filter(a => a.status === 'ACTIVE').length
        const resolved = data.filter(a => a.status === 'RESOLVED').length
        setStats({ active, resolved, total: data.length })
    }

    const setupWebSockets = () => {
        if (!token) return

        // Emergency Alerts Stream
        const eWs = new WebSocket(`ws://127.0.0.1:8000/ws/emergency/?token=${token}`)
        eWs.onmessage = (e) => {
            const data = JSON.parse(e.data)
            setAlerts(prev => [data, ...prev])
            setStats(prev => ({ ...prev, active: prev.active + 1, total: prev.total + 1 }))
            toast.error(`🚨 NEW ALERT: ${data.alert_type} from ${data.user_name || 'Anonymous'}`)
        }
        emergencyWs.current = eWs

        // Chat Stream
        const cWs = new WebSocket(`ws://127.0.0.1:8000/ws/chat/?token=${token}`)
        cWs.onmessage = (e) => {
            const data = JSON.parse(e.data)
            if (data.type === 'chat_message') {
                setChatMessages(prev => [...prev, data])
            }
        }
        chatWs.current = cWs
    }

    const sendChat = (e) => {
        e.preventDefault()
        if (!chatInput.trim() || !activeAlert) return
        
        chatWs.current.send(JSON.stringify({
            message: chatInput,
            receiver_id: activeAlert.user // Send to the user who triggered the alert
        }))

        setChatMessages(prev => [...prev, {
            sender_name: "Staff (You)",
            message: chatInput,
            timestamp: new Date().toISOString(),
            is_sent: true
        }])
        setChatInput("")
    }

    const resolveAlert = async (id) => {
        try {
            await axios.put(`http://127.0.0.1:8000/api/translator/alerts/${id}/resolve/`)
            toast.success('Alert marked as resolved')
            loadAlerts()
            if (activeAlert?.id === id) setActiveAlert(null)
        } catch (err) {
            toast.error('Failed to resolve alert')
        }
    }

    return (
        <div className="dashboard-container">
            <div className="dash-card-header" style={{ border: 'none' }}>
                <div>
                    <h2 className="gradient-text">🚨 Responder Mission Control</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Real-Time Emergency Monitoring System</p>
                </div>
                <div className="stats-header" style={{ display: 'flex', gap: '2rem' }}>
                    <div className="stat-pill red">{stats.active} Active</div>
                    <div className="stat-pill green">{stats.resolved} Resolved</div>
                </div>
            </div>

            <div className="dashboard-grid">
                {/* Alert Feed Section */}
                <div className="main-section">
                    <div className="dash-card">
                        <div className="dash-card-header">
                            <h3 className="dash-card-title">📉 Live Emergency Feed</h3>
                            <button className="btn btn-ghost btn-sm" onClick={loadAlerts}>🔄 Refresh</button>
                        </div>
                        
                        <div className="realtime-feed">
                            {alerts.length === 0 ? (
                                <div className="empty-state">No pending emergency alerts.</div>
                            ) : (
                                alerts.map(alert => (
                                    <div 
                                        key={alert.id} 
                                        className={`feed-item ${alert.status === 'ACTIVE' ? 'urgent' : 'info'} ${activeAlert?.id === alert.id ? 'active-item' : ''}`}
                                        onClick={() => setActiveAlert(alert)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <strong>{alert.alert_type} Alert</strong>
                                            <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                        <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>{alert.message}</p>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                                            User: {alert.user_name || 'Anonymous'} | Status: <span className={`status-tag ${alert.status.toLowerCase()}`}>{alert.status}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Response & Chat Sidebar */}
                <div className="sidebar-section">
                    {activeAlert ? (
                        <div className="dash-card chat-sidebar">
                            <div className="dash-card-header">
                                <h3 className="dash-card-title">💬 Comms: {activeAlert.user_name || 'User'}</h3>
                                <button className="btn btn-danger btn-xs" onClick={() => resolveAlert(activeAlert.id)}>Resolve</button>
                            </div>
                            
                            <div className="chat-messages">
                                {chatMessages.map((m, i) => (
                                    <div key={i} className={`msg-bubble ${m.is_sent ? 'msg-sent' : 'msg-received'}`}>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '2px' }}>{m.sender_name}</div>
                                        {m.message}
                                    </div>
                                ))}
                            </div>

                            <form className="chat-input-area" onSubmit={sendChat} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                <input 
                                    type="text" 
                                    className="input-custom" 
                                    placeholder="Reply to user..." 
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                />
                                <button className="btn btn-cyan btn-sm">Sent</button>
                            </form>
                        </div>
                    ) : (
                        <div className="dash-card">
                            <div className="empty-state" style={{ height: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📡</div>
                                <p>Select an alert from the feed to initiate emergency communication.</p>
                            </div>
                        </div>
                    )}

                    <div className="dash-card" style={{ marginTop: '1.5rem' }}>
                        <h3 className="dash-card-title">📊 Session Summary</h3>
                        <div className="stats-row" style={{ marginTop: '1rem' }}>
                            <div className="stat-box">
                                <div className="stat-label">Total</div>
                                <div className="stat-value">{stats.total}</div>
                            </div>
                            <div className="stat-box">
                                <div className="stat-label">Response Time</div>
                                <div className="stat-value" style={{ fontSize: '1.2rem', color: 'var(--success)' }}>&lt; 2 min</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
