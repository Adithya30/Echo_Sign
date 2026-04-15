import { useState, useEffect } from 'react'
import { getHistory, getStats, deleteHistory, deleteHistoryItem } from '../services/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getFullTranslation, UI_LABELS } from '../utils/translations'
import toast from 'react-hot-toast'
import './HistoryPage.css'

export default function HistoryPage({ selectedLang }) {
    const L = UI_LABELS[selectedLang]
    const [records, setRecords] = useState([])
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState('all')

    const load = async () => {
        setLoading(true)
        try {
            const [histRes, statsRes] = await Promise.all([getHistory(), getStats()])
            setRecords(histRes.results || [])
            setStats(statsRes)
        } catch {
            toast.error('Could not load history (is Django running?)')
            // Demo data
            setRecords([
                { id: '1', word: 'Hello', confidence: 0.94, timestamp: new Date().toISOString(), is_emergency: false },
                { id: '2', word: 'Thank You', confidence: 0.88, timestamp: new Date().toISOString(), is_emergency: false },
                { id: '3', word: 'Help', confidence: 0.91, timestamp: new Date().toISOString(), is_emergency: true },
                { id: '4', word: 'Water', confidence: 0.76, timestamp: new Date().toISOString(), is_emergency: false },
                { id: '5', word: 'Good', confidence: 0.82, timestamp: new Date().toISOString(), is_emergency: false },
            ])
            setStats({
                total_translations: 5, today_translations: 5, emergency_alerts: 1,
                avg_confidence: 86.2,
                top_words: [{ word: 'Hello', count: 3 }, { word: 'Thank You', count: 2 }, { word: 'Help', count: 1 }],
                weekly_activity: [
                    { date: 'Mon', count: 2 }, { date: 'Tue', count: 5 }, { date: 'Wed', count: 3 },
                    { date: 'Thu', count: 7 }, { date: 'Fri', count: 4 }, { date: 'Sat', count: 1 }, { date: 'Sun', count: 5 }
                ]
            })
        } finally { setLoading(false) }
    }

    useEffect(() => { load() }, [])

    const handleClear = async () => {
        if (!window.confirm('Clear all translation history?')) return
        try {
            await deleteHistory()
            setRecords([])
            toast.success('History cleared')
        } catch { toast.error('Failed to clear history') }
    }

    const handleDelete = async (id) => {
        try {
            await deleteHistoryItem(id)
            setRecords(prev => prev.filter(r => r.id !== id))
            toast.success('Record deleted')
        } catch { toast.error('Failed to delete record') }
    }

    const filtered = records.filter(r => {
        const matchWord = r.word.toLowerCase().includes(search.toLowerCase())
        if (filter === 'emergency') return matchWord && r.is_emergency
        if (filter === 'normal') return matchWord && !r.is_emergency
        return matchWord
    })

    const confPct = (c) => typeof c === 'number' ? (c > 1 ? c : c * 100).toFixed(1) : '—'
    const confClass = (c) => {
        const v = c > 1 ? c : c * 100
        return v >= 80 ? 'conf-high' : v >= 60 ? 'conf-medium' : 'conf-low'
    }

    return (
        <div className="page history-page">
            <div className="page-header">
                <h1>📋 <span className="gradient-text">{L.hist_title}</span></h1>
                <p>{L.home_btn_history}</p>
            </div>

            {/* Stats cards */}
            <div className="grid-4 hist-stats">
                {[
                    { icon: '🔤', label: L.hist_stats_total, value: stats?.total_translations ?? '—', color: 'blue' },
                    { icon: '📅', label: L.hist_stats_today, value: stats?.today_translations ?? '—', color: 'cyan' },
                    { icon: '🚨', label: L.hist_stats_em, value: stats?.emergency_alerts ?? '—', color: 'red' },
                    { icon: '🎯', label: L.hist_stats_conf, value: stats ? `${stats.avg_confidence}%` : '—', color: 'green' },
                ].map(s => (
                    <div key={s.label} className={`card stat-card stat-${s.color}`}>
                        <div className="stat-icon">{s.icon}</div>
                        <div className="stat-value">{s.value}</div>
                        <div className="stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Chart + Top words */}
            <div className="hist-charts grid-2">
                <div className="card chart-card">
                    <h3>📈 Weekly Activity</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={stats?.weekly_activity || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ background: '#0d1020', border: '1px solid rgba(79,142,247,0.2)', borderRadius: 8 }}
                                labelStyle={{ color: '#e2e8f0' }} itemStyle={{ color: '#4f8ef7' }}
                            />
                            <Bar dataKey="count" fill="#4f8ef7" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="card chart-card">
                    <h3>🔤 Top Detected Words</h3>
                    {stats?.top_words?.length > 0 ? (
                        <div className="top-words">
                            {stats.top_words.map((w, i) => (
                                <div key={i} className="top-word-row">
                                    <span className="top-rank">#{i + 1}</span>
                                    <span className="top-word">{w.word}</span>
                                    <div className="top-bar-wrap">
                                        <div className="top-bar" style={{
                                            width: `${Math.min(100, (w.count / (stats.top_words[0]?.count || 1)) * 100)}%`
                                        }} />
                                    </div>
                                    <span className="top-count">{w.count}</span>
                                </div>
                            ))}
                        </div>
                    ) : <div className="empty-state"><p>No data yet</p></div>}
                </div>
            </div>

            {/* Table */}
            <div className="card history-table-card">
                <div className="table-controls">
                    <input
                        className="input" style={{ maxWidth: 260 }}
                        placeholder="🔍 Search words..."
                        value={search} onChange={e => setSearch(e.target.value)}
                    />
                    <div className="filter-tabs">
                        {['all', 'normal', 'emergency'].map(f => (
                            <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`}
                                onClick={() => setFilter(f)}>
                                {f === 'all' ? 'All' : f === 'normal' ? 'Normal' : '🚨 Emergency'}
                            </button>
                        ))}
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={handleClear} style={{ marginLeft: 'auto' }}>
                        🗑 Clear All
                    </button>
                </div>

                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>{L.hist_table_word}</th>
                                <th>{L.hist_table_conf}</th>
                                <th>{L.hist_table_type}</th>
                                <th>{L.hist_table_time}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6}>
                                    <div className="empty-state">
                                        <div className="empty-icon">📋</div>
                                        <p>No records found</p>
                                    </div>
                                </td></tr>
                            ) : filtered.map((r, i) => (
                                <tr key={r.id}>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i + 1}</td>
                                    <td><strong style={{ color: 'var(--text)' }}>{getFullTranslation(r.word, selectedLang)}</strong></td>
                                    <td>
                                        <span className={`conf-chip ${confClass(r.confidence)}`}>
                                            {confPct(r.confidence)}%
                                        </span>
                                    </td>
                                    <td>
                                        {r.is_emergency
                                            ? <span className="badge badge-red">🚨 Emergency</span>
                                            : <span className="badge badge-blue">Normal</span>}
                                    </td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>
                                        {new Date(r.timestamp).toLocaleString()}
                                    </td>
                                    <td>
                                        <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(r.id)}>🗑</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
