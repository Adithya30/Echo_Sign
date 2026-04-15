import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import './Dashboards.css'

export default function AdminDashboard({ selectedLang }) {
    const { user, token } = useAuth()
    const [stats, setStats] = useState({ users: 0, alerts: 0, translations: 0, uptime: '99.9%' })
    const [users, setUsers] = useState([])
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [uRes, sRes, lRes] = await Promise.all([
                axios.get('http://127.0.0.1:8000/api/auth/list/'),
                axios.get('http://127.0.0.1:8000/api/translator/stats/global/'),
                axios.get('http://127.0.0.1:8000/api/translator/audit-logs/')
            ])
            setUsers(uRes.data)
            setStats(sRes.data)
            setLogs(lRes.data)
        } catch (err) {
            console.error('Failed to load admin data', err)
            // Mock stats for demo if backend endpoint missing
            setStats({ users: users.length, alerts: 12, translations: 450, uptime: '99.9%' })
        } finally {
            setLoading(false)
        }
    }

    const updateUserRole = async (userId, role) => {
        try {
            await axios.put(`http://127.0.0.1:8000/api/auth/role-update/${userId}/`, { role })
            toast.success(`User role updated to ${role}`)
            loadData()
        } catch (err) {
            toast.error('Failed to update role')
        }
    }

    const deleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return
        try {
            await axios.delete(`http://127.0.0.1:8000/api/auth/users/${id}/`)
            toast.success('User deleted')
            loadData()
        } catch (err) {
            toast.error('Failed to delete user')
        }
    }

    return (
        <div className="dashboard-container">
            <div className="dash-card-header" style={{ border: 'none' }}>
                <div>
                    <h2 className="gradient-text">🛠️ System Administration</h2>
                    <p style={{ color: 'var(--text-muted)' }}>EchoSign Global Infrastructure Management</p>
                </div>
                <button className="btn btn-cyan btn-sm" onClick={loadData}>🔄 Refresh System Cache</button>
            </div>

            {/* Stats Overview */}
            <div className="stats-row">
                <div className="stat-box">
                    <div className="stat-label">Total Users</div>
                    <div className="stat-value">{stats.users}</div>
                </div>
                <div className="stat-box">
                    <div className="stat-label">Emergency Alerts</div>
                    <div className="stat-value" style={{ color: 'var(--danger)' }}>{stats.alerts}</div>
                </div>
                <div className="stat-box">
                    <div className="stat-label">Total Translations</div>
                    <div className="stat-value" style={{ color: 'var(--cyan)' }}>{stats.translations}</div>
                </div>
                <div className="stat-box">
                    <div className="stat-label">System Uptime</div>
                    <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.uptime}</div>
                </div>
            </div>

            <div className="dashboard-grid">
                {/* User Management Section */}
                <div className="main-section">
                    <div className="dash-card">
                        <div className="dash-card-header">
                            <h3 className="dash-card-title">👥 User Directory</h3>
                        </div>
                        
                        <div className="table-wrap">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Username</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id}>
                                            <td><strong>{u.username}</strong></td>
                                            <td>{u.email}</td>
                                            <td><span className={`role-tag ${u.role.toLowerCase()}`}>{u.role}</span></td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <select 
                                                        className="lang-select" 
                                                        style={{ padding: '0.2rem', fontSize: '0.8rem' }}
                                                        value={u.role}
                                                        onChange={(e) => updateUserRole(u.id, e.target.value)}
                                                    >
                                                        <option value="USER">User</option>
                                                        <option value="EMERGENCY_STAFF">Staff</option>
                                                        <option value="ADMIN">Admin</option>
                                                    </select>
                                                    <button className="btn btn-ghost btn-xs" onClick={() => deleteUser(u.id)}>🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Audit Logs Sidebar */}
                <div className="sidebar-section">
                    <div className="dash-card">
                        <div className="dash-card-header">
                            <h3 className="dash-card-title">📜 Audit Trail</h3>
                        </div>
                        <div className="realtime-feed">
                            {logs.length === 0 ? (
                                <p className="empty-state">No audit logs available.</p>
                            ) : (
                                logs.map((log, i) => (
                                    <div key={i} className="feed-item info" style={{ fontSize: '0.85rem' }}>
                                        <div style={{ fontWeight: '600' }}>{log.action}</div>
                                        <div style={{ opacity: 0.7 }}>{log.details}</div>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{new Date(log.timestamp).toLocaleString()}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="dash-card" style={{ marginTop: '1.5rem' }}>
                        <h3 className="dash-card-title">⚙️ AI Performance</h3>
                        <div style={{ marginTop: '1rem' }}>
                            <div className="confidence-label">Model Accuracy: <strong>94.2%</strong></div>
                            <div className="confidence-bar-wrap" style={{ margin: '0.5rem 0' }}>
                                <div className="confidence-bar-track">
                                    <div className="confidence-bar-fill high" style={{ width: '94.2%' }} />
                                </div>
                            </div>
                            <small style={{ color: 'var(--text-muted)' }}>Last Retrained: 2 days ago</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
