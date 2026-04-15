import { useState, useEffect } from 'react'
import { getContacts, createContact, updateContact, deleteContact, checkHealth } from '../services/api'
import axios from 'axios'
import { UI_LABELS } from '../utils/translations'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import './SettingsPage.css'

const DEFAULT_CONTACT = { name: '', phone_number: '', is_active: true, is_emergency_contact: false }

export default function SettingsPage({ selectedLang }) {
    const { user: currentUser, isAdmin } = useAuth()
    const L = UI_LABELS[selectedLang]
    const [allUsers, setAllUsers] = useState([])
    const [fetchingUsers, setFetchingUsers] = useState(false)
    const [contacts, setContacts] = useState([])
    const [form, setForm] = useState(DEFAULT_CONTACT)
    const [editId, setEditId] = useState(null)
    const [health, setHealth] = useState(null)
    const [ttsTest, setTtsTest] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        loadContacts()
        if (isAdmin) loadAllUsers()
        checkHealth().then(setHealth).catch(() => setHealth({ status: 'offline', model_loaded: false }))
    }, [])

    const loadAllUsers = async () => {
        setFetchingUsers(true)
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/auth/list/')
            setAllUsers(res.data)
        } catch (err) {
            console.error('Failed to load users', err)
        } finally {
            setFetchingUsers(false)
        }
    }

    const promoteUser = async (userId, newRole) => {
        try {
            await axios.put(`http://127.0.0.1:8000/api/auth/role-update/${userId}/`, { role: newRole })
            toast.success(`User role updated to ${newRole}`)
            loadAllUsers()
        } catch (err) {
            toast.error('Failed to update role')
        }
    }

    const loadContacts = async () => {
        try {
            const res = await getContacts()
            setContacts(Array.isArray(res) ? res : res.results || [])
        } catch { setContacts([]) }
    }

    const handleSave = async () => {
        if (!form.name || !form.phone_number) {
            toast.error('Name and phone number are required')
            return
        }
        setLoading(true)
        try {
            if (editId) {
                await updateContact(editId, form)
                toast.success('Contact updated!')
            } else {
                await createContact(form)
                toast.success('Contact added!')
            }
            setForm(DEFAULT_CONTACT)
            setEditId(null)
            await loadContacts()
        } catch { toast.error('Failed to save contact') }
        finally { setLoading(false) }
    }

    const handleEdit = (c) => {
        setEditId(c.id)
        setForm({ name: c.name, phone_number: c.phone_number, is_active: c.is_active, is_emergency_contact: c.is_emergency_contact })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this contact?')) return
        try {
            await deleteContact(id)
            setContacts(prev => prev.filter(c => c.id !== id))
            toast.success('Contact deleted')
        } catch { toast.error('Failed to delete contact') }
    }

    const testTTS = () => {
        if (!ttsTest) return
        try {
            const utter = new SpeechSynthesisUtterance(ttsTest)
            utter.rate = 1.0; utter.pitch = 1.0
            window.speechSynthesis.speak(utter)
            toast.success('Speaking test text!')
        } catch { toast.error('TTS not supported') }
    }

    return (
        <div className="page settings-page">
            <div className="page-header">
                <h1>⚙️ <span className="gradient-text">{L.sett_title}</span></h1>
                <p>{L.nav_settings}</p>
            </div>

            <div className="settings-layout">
                {/* Left column */}
                <div className="settings-left">
                    {/* Contact Form */}
                    <div className="card settings-card">
                        <h3>{editId ? '✏️' : '➕'} {L.sett_add_contact}</h3>
                        <p style={{ marginBottom: '1.2rem' }}>Emergency contacts receive automatic alerts when emergency signs are detected.</p>

                        <div className="form-grid">
                            <div className="form-field">
                                <label className="form-label">Full Name</label>
                                <input className="input" placeholder="e.g. Dr. Sharma"
                                    value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                            </div>

                            <div className="form-field">
                                <label className="form-label">Phone (with country code)</label>
                                <input className="input" placeholder="+91XXXXXXXXXX"
                                    value={form.phone_number} onChange={e => setForm(p => ({ ...p, phone_number: e.target.value }))} />
                            </div>

                            <div className="form-field form-full toggle-field">
                                <label className="toggle-label">
                                    <div>
                                        <strong>Emergency Contact</strong>
                                        <p>Gets WhatsApp alerts during emergencies</p>
                                    </div>
                                    <div
                                        className={`toggle ${form.is_emergency_contact ? 'on' : ''}`}
                                        onClick={() => setForm(p => ({ ...p, is_emergency_contact: !p.is_emergency_contact }))}
                                    />
                                </label>
                            </div>

                            <div className="form-field form-full toggle-field">
                                <label className="toggle-label">
                                    <div>
                                        <strong>Active</strong>
                                        <p>Disable without deleting</p>
                                    </div>
                                    <div
                                        className={`toggle ${form.is_active ? 'on' : ''}`}
                                        onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                                {loading ? '⏳' : editId ? '💾' : '➕'} {L.sett_add_contact}
                            </button>
                            {editId && (
                                <button className="btn btn-ghost" onClick={() => { setEditId(null); setForm(DEFAULT_CONTACT) }}>
                                    ✕ Cancel
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Contacts List */}
                    <div className="card settings-card">
                        <h3>📱 {L.sett_contacts} ({contacts.length})</h3>
                        {contacts.length === 0 ? (
                            <div className="empty-state" style={{ padding: '2rem' }}>
                                <div className="empty-icon">📱</div>
                                <p>No contacts added yet</p>
                            </div>
                        ) : (
                            <div className="contacts-list">
                                {contacts.map(c => (
                                    <div key={c.id} className="contact-item card-sm">
                                        <div className="contact-left">
                                            <div className="contact-avatar">{c.name.charAt(0).toUpperCase()}</div>
                                            <div className="contact-info">
                                                <strong>{c.name}</strong>
                                                <span>{c.phone_number}</span>
                                                <div className="contact-badges">
                                                    {c.is_emergency_contact && <span className="badge badge-red">🚨 Emergency</span>}
                                                    <span className={`badge ${c.is_active ? 'badge-green' : 'badge-purple'}`}>
                                                        {c.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="contact-actions">
                                            <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(c)}>✏️</button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>🗑</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right column */}
                <div className="settings-right">
                    {/* System Status */}
                    <div className="card settings-card">
                        <h3>🖥️ {L.sett_sys_status}</h3>
                        <div className="status-list">
                            {[
                                { label: 'Backend API', ok: health?.status === 'online', desc: health?.status === 'online' ? 'Django server running' : 'Start: python manage.py runserver' },
                                { label: 'AI Model', ok: health?.model_loaded, desc: health?.model_loaded ? 'LSTM model loaded' : 'Demo mode active' },
                                { label: 'TTS Engine', ok: true, desc: 'Browser SpeechSynthesis + pyttsx3' },
                                { label: 'MediaPipe Hands', ok: true, desc: 'CDN loaded on translator page' },
                                { label: 'WhatsApp Service', ok: true, desc: 'pywhatkit — requires open browser' },
                            ].map(s => (
                                <div key={s.label} className="status-row">
                                    <div className={`status-dot ${s.ok ? 'ok' : 'warn'}`} />
                                    <div className="status-info">
                                        <strong>{s.label}</strong>
                                        <span>{s.desc}</span>
                                    </div>
                                    <span className={`badge ${s.ok ? 'badge-green' : 'badge-red'}`}>
                                        {s.ok ? 'Online' : 'Offline'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* TTS Test */}
                    <div className="card settings-card">
                        <h3>🔊 {L.sett_tts_test}</h3>
                        <p>Test the text-to-speech output in your browser.</p>
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                            <input
                                className="input" placeholder="Type something to speak..."
                                value={ttsTest} onChange={e => setTtsTest(e.target.value)}
                            />
                            <button className="btn btn-primary" onClick={testTTS} disabled={!ttsTest}>
                                🔊 Test
                            </button>
                        </div>
                        <div className="quick-phrases">
                            {['Hello', 'Thank You', 'Help Me', 'Emergency'].map(p => (
                                <button key={p} className="btn btn-ghost btn-sm" onClick={() => {
                                    const utter = new SpeechSynthesisUtterance(p)
                                    window.speechSynthesis.speak(utter)
                                }}>{p}</button>
                            ))}
                        </div>
                    </div>

                    {/* About */}
                    <div className="card settings-card about-card">
                        <div className="about-logo">🤟</div>
                        <h3>EchoSign AI Translator</h3>
                        <p>Version 1.0.0</p>
                        <div className="tech-stack">
                            {['MediaPipe', 'LSTM/TensorFlow', 'Django REST', 'React + Vite', 'pyttsx3', 'pywhatkit'].map(t => (
                                <span key={t} className="tech-pill">{t}</span>
                            ))}
                        </div>
                        <p style={{ marginTop: '1rem', fontSize: '.85rem' }}>
                            Bridging communication gaps for deaf and hard-of-hearing individuals using AI.
                        </p>
                    </div>
                </div>
            </div>

            {isAdmin && (
                <div className="card settings-card admin-section animate-fade-up" style={{ marginTop: '2rem' }}>
                    <div className="section-header">
                        <h2>🛠️ Admin User Management</h2>
                        <button className="btn btn-ghost btn-sm" onClick={loadAllUsers} disabled={fetchingUsers}>
                            {fetchingUsers ? '...' : '🔄 Refresh List'}
                        </button>
                    </div>
                    <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
                        Promote users to Emergency Staff to allow them to handle responder alerts.
                    </p>

                    <div className="table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Current Role</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allUsers.map(u => (
                                    <tr key={u.id}>
                                        <td><strong>{u.username}</strong></td>
                                        <td><span className={`role-tag ${u.role.toLowerCase()}`}>{u.role}</span></td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                {u.role !== 'EMERGENCY_STAFF' && (
                                                    <button className="btn btn-ghost btn-xs" onClick={() => promoteUser(u.id, 'EMERGENCY_STAFF')}>
                                                        ⚕️ Staff
                                                    </button>
                                                )}
                                                {u.role !== 'ADMIN' && (
                                                    <button className="btn btn-ghost btn-xs" onClick={() => promoteUser(u.id, 'ADMIN')}>
                                                        👑 Admin
                                                    </button>
                                                )}
                                                {u.role !== 'USER' && (
                                                    <button className="btn btn-ghost btn-xs" onClick={() => promoteUser(u.id, 'USER')}>
                                                        👤 User
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
