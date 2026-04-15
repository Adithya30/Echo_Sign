import { NavLink, Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { UI_LABELS } from '../utils/translations'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

const getNavItems = (L, user) => {
    const items = [{ to: '/', label: `🏠 ${L.nav_home}` }]
    
    if (user?.role === 'ADMIN') {
        items.push({ to: '/dashboard/admin', label: `🛠️ Admin` })
    } else if (user?.role === 'EMERGENCY_STAFF') {
        items.push({ to: '/dashboard/staff', label: `🚨 Mission Control` })
    } else if (user) {
        items.push({ to: '/dashboard/user', label: `🤟 Translator` })
    }

    items.push({ to: '/history', label: `📋 ${L.nav_history}` })
    items.push({ to: '/settings', label: `⚙️ ${L.nav_settings}` })
    
    return items
}

export default function Navbar({ selectedLang, setSelectedLang }) {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const L = UI_LABELS[selectedLang]
    
    const handleLogout = () => {
        logout()
        toast.success('Logged out successfully')
        navigate('/login')
    }
    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <NavLink to="/" className="navbar-logo">
                    <span className="logo-icon">🤟</span>
                    <span className="logo-text">Echo<span className="logo-accent">Sign</span></span>
                </NavLink>

                <ul className="navbar-links">
                    {getNavItems(UI_LABELS[selectedLang], user).map(({ to, label }) => (
                        <li key={to}>
                            <NavLink
                                to={to}
                                end={to === '/'}
                                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            >
                                {label}
                            </NavLink>
                        </li>
                    ))}
                </ul>

                <div className="navbar-right">
                    <div className="nav-lang-selector">
                        <select 
                            className="lang-select"
                            value={selectedLang}
                            onChange={(e) => {
                                setSelectedLang(e.target.value)
                                toast.success(`Language: ${e.target.options[e.target.selectedIndex].text}`)
                            }}
                        >
                            <option value="en">English</option>
                            <option value="ml">Malayalam</option>
                            <option value="hi">Hindi</option>
                        </select>
                    </div>
                    
                    <div className="navbar-badge">
                        <span className="pulse-dot" />
                        <span className="badge-text">{L.nav_ai_active}</span>
                    </div>

                    <div className="nav-auth-section">
                        {user ? (
                            <div className="user-profile-nav">
                                <div className="user-info">
                                    <span className="user-name">{user.username}</span>
                                    <span className={`role-tag ${user.role.toLowerCase()}`}>{user.role}</span>
                                </div>
                                <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                                    🚪 Logout
                                </button>
                            </div>
                        ) : (
                            <div className="auth-links">
                                <Link to="/login" className="nav-link">Login</Link>
                                <Link to="/signup" className="btn btn-cyan btn-sm">Sign Up</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}
